const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// ── Init Firebase Admin ───────────────────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Config ────────────────────────────────────────────────────────────────────
const EVOLUTION_URL      = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
const EVOLUTION_KEY      = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPhone(phone) {
  const clean = phone.replace(/\D/g, '');
  return clean.startsWith('55') ? clean : `55${clean}`;
}

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function todayBRT() {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10);
}

// ── Mensagens por tipo ────────────────────────────────────────────────────────

function msgAviso(name, dueDay, value) {
  return (
    `🤖 _Mensagem automática do sistema de gestão PA Control_\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Olá, *${name}*! 👋😊\n\n` +
    `📢 *Aviso de vencimento próximo!*\n\n` +
    `📅 Sua mensalidade vence no *dia ${dueDay}* deste mês.\n\n` +
    `💵 Valor: *${formatCurrency(value)}*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💳 *Chave PIX para pagamento:*\n` +
    `🔑 *62991803975*\n` +
    `🏦 Nubank\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `✅ Qualquer dúvida é só chamar! 💬🙏`
  );
}

function msgAmanha(name, dueDay, value) {
  return (
    `🤖 _Mensagem automática do sistema de gestão PA Control_\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Olá, *${name}*! 👋😊\n\n` +
    `⚠️ *Sua mensalidade vence amanhã!*\n\n` +
    `📅 Vencimento: *amanhã, dia ${dueDay}*\n` +
    `💵 Valor: *${formatCurrency(value)}*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💳 *Chave PIX para pagamento:*\n` +
    `🔑 *62991803975*\n` +
    `🏦 Nubank\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `✅ Após o pagamento, seu acesso continua ativo normalmente!\n\n` +
    `Qualquer dúvida é só chamar! 💬🙏`
  );
}

function msgHoje(name, dueDay, value) {
  return (
    `🤖 _Mensagem automática do sistema de gestão PA Control_\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Olá, *${name}*! 👋😊\n\n` +
    `🔔 *Sua mensalidade vence HOJE!*\n\n` +
    `📅 Vencimento: *hoje, dia ${dueDay}*\n` +
    `💵 Valor: *${formatCurrency(value)}*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💳 *Chave PIX para pagamento:*\n` +
    `🔑 *62991803975*\n` +
    `🏦 Nubank\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `✅ Realize o pagamento hoje para manter seu acesso ativo!\n\n` +
    `Qualquer dúvida é só chamar! 💬🙏`
  );
}

function msgAtrasada(name, dueDay, value, daysLate) {
  return (
    `🤖 _Mensagem automática do sistema de gestão PA Control_\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Olá, *${name}*! 👋\n\n` +
    `🚨 *Mensalidade em atraso!*\n\n` +
    `📅 Venceu em: *dia ${dueDay}* (${daysLate} dia${daysLate > 1 ? 's' : ''} em atraso)\n` +
    `💵 Valor: *${formatCurrency(value)}*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💳 *Chave PIX para pagamento:*\n` +
    `🔑 *62991803975*\n` +
    `🏦 Nubank\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `⚠️ Regularize o pagamento para evitar interrupção do serviço.\n\n` +
    `Qualquer dúvida é só chamar! 💬🙏`
  );
}

async function sendWhatsApp(phone, message) {
  const res = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: formatPhone(phone),
      textMessage: { text: message },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const today       = todayBRT();
  const todayDate   = new Date(today + 'T12:00:00Z');
  const todayDay    = todayDate.getDate();
  const year        = todayDate.getFullYear();
  const month       = todayDate.getMonth() + 1;
  const currentMonthKey = `${year}-${String(month).padStart(2, '0')}`;

  console.log(`\n📅 [${today}] Dia ${todayDay} — verificando mensagens a enviar...\n`);

  // Busca todas as assinaturas ativas
  const snapshot = await db.collection('subscriptions')
    .where('status', '==', 'active')
    .get();

  if (snapshot.empty) {
    console.log('✅ Nenhuma assinatura ativa.');
    return;
  }

  let sent = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const sub  = { id: doc.id, ...doc.data() };
    const name = sub.clientName || 'Cliente';
    const dueDay = sub.dueDay;

    // ── Já pagou este mês → pula ────────────────────────────────────────────
    if (sub.payments?.[currentMonthKey] === true) {
      continue;
    }

    // ── Já enviou mensagem hoje → pula ──────────────────────────────────────
    if (sub.lastReminderDate === today) {
      console.log(`⏭️  ${name} — mensagem já enviada hoje.`);
      skipped++;
      continue;
    }

    // ── Sem telefone → pula ─────────────────────────────────────────────────
    if (!sub.clientPhone) {
      continue;
    }

    // ── Determina o tipo de mensagem pelo dia ────────────────────────────────
    // Dias de atraso: positivo = atrasado, negativo = falta N dias
    const diff = todayDay - dueDay;
    let msg = null;
    let tipo = '';

    if (diff < -2) {
      // Mais de 2 dias antes: sem mensagem (ex: dia 1 a 7 quando dueDay=10)
      // Exceto se for exatamente 3 dias antes (dia 7 para vencimento dia 10)
      if (diff === -3) {
        msg  = msgAviso(name, dueDay, sub.monthlyValue);
        tipo = 'aviso antecipado';
      } else {
        continue;
      }
    } else if (diff === -1) {
      // Um dia antes do vencimento
      msg  = msgAmanha(name, dueDay, sub.monthlyValue);
      tipo = 'vence amanhã';
    } else if (diff === 0) {
      // Dia do vencimento
      msg  = msgHoje(name, dueDay, sub.monthlyValue);
      tipo = 'vence hoje';
    } else if (diff > 0) {
      // Em atraso — só envia 1x por dia (já garantido pelo lastReminderDate)
      msg  = msgAtrasada(name, dueDay, sub.monthlyValue, diff);
      tipo = `atrasada ${diff}d`;
    }

    if (!msg) continue;

    try {
      await sendWhatsApp(sub.clientPhone, msg);

      await db.collection('subscriptions').doc(doc.id).update({
        lastReminderDate: today,
        lastReminderAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ [${tipo}] Enviado para ${name}`);
      sent++;
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${name}:`, err.message);
    }

    await new Promise(r => setTimeout(r, 2500));
  }

  console.log(`\n📊 Resultado: ${sent} enviados, ${skipped} pulados.\n`);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
