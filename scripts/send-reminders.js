const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// ── Config ────────────────────────────────────────────────────────────────────
const clean = s => (s ?? '').replace(/^﻿/, '').trim();

const EVOLUTION_URL      = clean(process.env.EVOLUTION_API_URL).replace(/\/$/, '');
const EVOLUTION_KEY      = clean(process.env.EVOLUTION_API_KEY);
const EVOLUTION_INSTANCE = clean(process.env.EVOLUTION_INSTANCE);
const DRY_RUN            = process.env.DRY_RUN === 'true';

// Inicializado dentro de main, para que este arquivo possa ser carregado
// em um teste sem exigir as credenciais.
let db;

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

const FOOTER = `\n\n_PA Control · mensagem automática_`;

// PIX Copia e Cola (BR Code). Manter igual ao de src/lib/whatsapp.ts.
const PIX_KEY  = '69360759000181';
const PIX_NAME = 'PEDRO H F S CAVALCANTE';
const PIX_CITY = 'APARECIDA DE GO';

const tlv = (id, value) => id + String(value.length).padStart(2, '0') + value;

function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function pixPayload(value) {
  const body =
    tlv('00', '01') +
    tlv('26', tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', PIX_KEY)) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', Number(value).toFixed(2)) +
    tlv('58', 'BR') +
    tlv('59', PIX_NAME) +
    tlv('60', PIX_CITY) +
    tlv('62', tlv('05', '***')) +
    '6304';
  return body + crc16(body);
}

// Nome de tratamento: serve para pessoa e para razao social.
// Manter igual ao displayName de src/lib/whatsapp.ts.
const SUFIXOS = /^(ltda|ltda\.|me|mei|eireli|epp|s\/a|sa|s\.a\.|cia)$/i;
const PREPOSICOES = /^(de|da|do|das|dos|e)$/i;

const displayName = name => {
  const words = name.trim().split(/\s+/).filter(w => w && !SUFIXOS.test(w));
  if (words.length === 0) return name.trim();
  const picked = words.length <= 3 ? words : words.slice(0, 3);
  while (picked.length > 1 && PREPOSICOES.test(picked[picked.length - 1])) picked.pop();
  return picked.join(' ');
};

function chargeMessage(name, value, dueDay, daysLate) {
  const n = displayName(name);
  const v = formatCurrency(value);
  const PIX_AVISO =
    'Para pagar, use a *chave PIX* da próxima mensagem, ' +
    'ou copie o *código copia e cola* da mensagem seguinte, que já vem com o valor preenchido.';
  let body;

  if (daysLate < 0) {
    body =
      `Olá, ${n}! 👋\n\n` +
      `Sua mensalidade de *${v}* vence no *dia ${dueDay}*.\n\n` +
      `${PIX_AVISO}\n\n` +
      `Se o pagamento já foi realizado, desconsidere esta mensagem. Obrigado!`;
  } else if (daysLate === 0) {
    body =
      `Olá, ${n}! 👋\n\n` +
      `Sua mensalidade de *${v}* vence *hoje (dia ${dueDay})*.\n\n` +
      `${PIX_AVISO}\n\n` +
      `Se o pagamento já foi realizado, desconsidere esta mensagem. Obrigado!`;
  } else if (daysLate < 3) {
    body =
      `Olá, ${n}!\n\n` +
      `Ainda não identificamos o pagamento da mensalidade de *${v}*, com vencimento em *${daysLate === 1 ? `ontem, dia ${dueDay}` : `dia ${dueDay}`}*.\n\n` +
      `${PIX_AVISO}\n\n` +
      `Se já efetuou o pagamento, por favor envie o comprovante para conferência.`;
  } else if (daysLate < 7) {
    body =
      `Olá, ${n}!\n\n` +
      `A mensalidade de *${v}* está em aberto há *${daysLate} dias* (vencimento dia ${dueDay}).\n\n` +
      `Pedimos a gentileza de regularizar o pagamento.\n\n` +
      `${PIX_AVISO}\n\n` +
      `Caso esteja com alguma dificuldade, podemos combinar uma nova data. É só responder esta mensagem.`;
  } else {
    body =
      `Olá, ${n}.\n\n` +
      `A mensalidade de *${v}* consta em atraso há *${daysLate} dias* (vencimento dia ${dueDay}).\n\n` +
      `Para manter o serviço ativo, solicitamos a regularização do pagamento.\n\n` +
      `${PIX_AVISO}\n\n` +
      `Se o pagamento já foi realizado ou deseja combinar uma nova data, responda esta mensagem.`;
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

  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  db = getFirestore();

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
    if (!Number.isFinite(Number(sub.monthlyValue)) || Number(sub.monthlyValue) <= 0) {
      console.log(`⏭️  ${maskPhone(phone)} sem valor mensal valido.`);
      skipped++;
      continue;
    }

    const dueDay   = Math.min(Number(sub.dueDay), daysInMonth);
    const daysLate = day - dueDay;
    const stage    = SCHEDULE[daysLate];
    if (!stage) continue;

    if (sub.lastReminderDate === today) {
      console.log(`⏭️  [${stage}] ${maskPhone(phone)} já recebeu hoje.`);
      skipped++;
      continue;
    }

    // usa o dia efetivo (dia 31 em mes de 30 dias vira dia 30) para o texto bater com o calculo
    const message = chargeMessage(name, sub.monthlyValue, dueDay, daysLate);
    const pix     = pixPayload(sub.monthlyValue);

    if (DRY_RUN) {
      console.log(`🧪 [${stage}] ${maskPhone(phone)}\n${message}\n\n--- 2a mensagem (chave PIX) ---\n${PIX_KEY}\n\n--- 3a mensagem (copia e cola) ---\n${pix}\n`);
      continue;
    }

    try {
      await sendWhatsApp(phone, message);
      // Chave e codigo vao sozinhos, cada um em sua mensagem, para o cliente
      // copiar com um toque.
      await new Promise(r => setTimeout(r, 1200));
      await sendWhatsApp(phone, PIX_KEY);
      await new Promise(r => setTimeout(r, 1200));
      await sendWhatsApp(phone, pix);
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

if (require.main === module) {
  main().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
}

// Exportado para permitir conferir os textos sem enviar nada.
module.exports = { chargeMessage, pixPayload, displayName };
