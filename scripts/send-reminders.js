const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// ── Config ────────────────────────────────────────────────────────────────────
const clean = s => (s ?? '').replace(/^﻿/, '').trim();

const EVOLUTION_URL      = clean(process.env.EVOLUTION_API_URL).replace(/\/$/, '');
const EVOLUTION_KEY      = clean(process.env.EVOLUTION_API_KEY);
const EVOLUTION_INSTANCE = clean(process.env.EVOLUTION_INSTANCE);
const DRY_RUN            = process.env.DRY_RUN === 'true';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

function maskPhone(phone) {
  const digits = formatPhone(phone);
  return `${digits.slice(0, 4)}*****${digits.slice(-2)}`;
}

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Data de hoje no fuso de São Paulo: { year, month (1-12), day } */
function todaySaoPaulo() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const get = type => Number(parts.find(p => p.type === type).value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

// ── Mensagens ─────────────────────────────────────────────────────────────────
// Manter os textos iguais aos de src/lib/whatsapp.ts (chargeMessage).

const PIX    = `PIX (Nubank):\n62991803975`;
const FOOTER = `\n\n_PA Control · mensagem automática_`;

const firstName = name => name.trim().split(/\s+/)[0] || name;

function chargeMessage(name, value, dueDay, daysLate) {
  const n = firstName(name);
  const v = formatCurrency(value);
  let body;

  if (daysLate < 0) {
    body =
      `Oi, ${n}! Tudo bem? 😊\n\n` +
      `Passando pra lembrar que sua mensalidade de *${v}* vence *dia ${dueDay}*.\n\n` +
      `${PIX}\n\n` +
      `Se já pagou, pode desconsiderar. Obrigado! 🙏`;
  } else if (daysLate === 0) {
    body =
      `Oi, ${n}! 😊\n\n` +
      `Sua mensalidade de *${v}* vence *hoje*.\n\n` +
      `${PIX}\n\n` +
      `Se já pagou, é só desconsiderar. Obrigado! 🙏`;
  } else if (daysLate < 3) {
    body =
      `Oi, ${n}, tudo bem?\n\n` +
      `Ainda não identificamos o pagamento da mensalidade de *${v}*, que venceu *${daysLate === 1 ? `ontem (dia ${dueDay})` : `dia ${dueDay}`}*.\n\n` +
      `Pode ter sido só um esquecimento, sem problema! 😊\n\n` +
      `${PIX}\n\n` +
      `Se já pagou, me avisa que eu confiro.`;
  } else if (daysLate < 7) {
    body =
      `Oi, ${n}!\n\n` +
      `Sua mensalidade de *${v}* está em aberto há *${daysLate} dias* (venceu dia ${dueDay}).\n\n` +
      `Consegue regularizar hoje?\n\n` +
      `${PIX}\n\n` +
      `Se estiver com alguma dificuldade, me chama que a gente conversa. 🤝`;
  } else {
    body =
      `Oi, ${n}.\n\n` +
      `A mensalidade de *${v}* está em atraso há *${daysLate} dias* (venceu dia ${dueDay}).\n\n` +
      `Precisamos do pagamento para manter o serviço ativo.\n\n` +
      `${PIX}\n\n` +
      `Se já pagou ou quer combinar outra data, é só responder esta mensagem. 🙏`;
  }

  return body + FOOTER;
}

// Em quais dias o envio automático acontece (em relação ao vencimento)
const SCHEDULE = {
  [-3]: 'aviso 3 dias antes',
  [0]:  'vence hoje',
  [1]:  'atraso 1 dia',
  [3]:  'atraso 3 dias',
  [7]:  'atraso 7 dias',
};

async function sendWhatsApp(phone, message) {
  const res = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
    body: JSON.stringify({ number: formatPhone(phone), text: message }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!DRY_RUN && (!EVOLUTION_URL || !EVOLUTION_KEY || !EVOLUTION_INSTANCE)) {
    throw new Error('Secrets da Evolution API ausentes.');
  }

  const { year, month, day } = todaySaoPaulo();
  const today           = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const currentMonthKey = today.slice(0, 7);
  const daysInMonth     = new Date(year, month, 0).getDate();

  console.log(`\n📅 [${today}] ${DRY_RUN ? 'MODO TESTE (nada será enviado)' : 'Enviando lembretes'}\n`);

  const [subsSnap, clientsSnap] = await Promise.all([
    db.collection('subscriptions').where('status', '==', 'active').get(),
    db.collection('clients').get(),
  ]);
  const clients = new Map(clientsSnap.docs.map(d => [d.id, d.data()]));

  let sent = 0, failed = 0, skipped = 0;

  for (const doc of subsSnap.docs) {
    const sub    = doc.data();
    const legacy = sub.clientId ? clients.get(sub.clientId) : null;
    const name   = sub.clientName || legacy?.name || 'Cliente';
    const phone  = sub.clientPhone || legacy?.phone || '';

    if (sub.payments?.[currentMonthKey] === true) continue;
    if (!phone || !sub.dueDay) continue;

    const dueDay   = Math.min(Number(sub.dueDay), daysInMonth);
    const daysLate = day - dueDay;
    const stage    = SCHEDULE[daysLate];
    if (!stage) continue;

    if (sub.lastReminderDate === today) {
      console.log(`⏭️  [${stage}] ${maskPhone(phone)} já recebeu hoje.`);
      skipped++;
      continue;
    }

    const message = chargeMessage(name, sub.monthlyValue, Number(sub.dueDay), daysLate);

    if (DRY_RUN) {
      console.log(`🧪 [${stage}] ${maskPhone(phone)}\n${message}\n`);
      continue;
    }

    try {
      await sendWhatsApp(phone, message);
      await doc.ref.update({
        lastReminderDate: today,
        lastReminderStage: stage,
        lastReminderAt: FieldValue.serverTimestamp(),
      });
      console.log(`✅ [${stage}] Enviado para ${maskPhone(phone)}`);
      sent++;
    } catch (err) {
      console.error(`❌ [${stage}] Falha para ${maskPhone(phone)}: ${err.message}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 2500));
  }

  console.log(`\n📊 Resultado: ${sent} enviados, ${failed} falharam, ${skipped} já enviados hoje.\n`);

  // Faz a execução aparecer como falha no GitHub quando algum envio não foi.
  if (failed > 0) process.exitCode = 1;
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
