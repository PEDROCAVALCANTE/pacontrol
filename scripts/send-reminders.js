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
  // Retorna a data de hoje no fuso de Brasília (UTC-3) no formato yyyy-MM-dd
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10);
}

function reminderMessage(name, dueDay, value) {
  return (
    `Olá, ${name}! 👋\n\n` +
    `Passando para lembrar que sua mensalidade vence *amanhã (dia ${dueDay})*. 📅\n\n` +
    `Valor: *${formatCurrency(value)}* 💰\n\n` +
    `Não esqueça de realizar o pagamento para manter seu acesso ativo! 🙏\n\n` +
    `Qualquer dúvida, só chamar! 😊`
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
  const today    = todayBRT();
  const tomorrow = new Date(today + 'T12:00:00Z');
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay     = tomorrow.getDate();
  const currentMonthKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}`;

  console.log(`\n📅 [${today}] Verificando vencimentos para o dia ${tomorrowDay}...\n`);

  const snapshot = await db.collection('subscriptions')
    .where('status', '==', 'active')
    .where('dueDay', '==', tomorrowDay)
    .get();

  if (snapshot.empty) {
    console.log('✅ Nenhum vencimento amanhã.');
    return;
  }

  let sent = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const sub  = { id: doc.id, ...doc.data() };
    const name = sub.clientName || 'Cliente';

    // ── Não envia se já pagou este mês ──────────────────────────────────────
    const isPaid = sub.payments?.[currentMonthKey] || sub.paid;
    if (isPaid) {
      console.log(`⏭️  ${name} — já pagou este mês.`);
      skipped++;
      continue;
    }

    // ── Não envia se já mandou lembrete hoje ────────────────────────────────
    if (sub.lastReminderDate === today) {
      console.log(`⏭️  ${name} — lembrete já enviado hoje (${today}).`);
      skipped++;
      continue;
    }

    // ── Sem telefone ────────────────────────────────────────────────────────
    const phone = sub.clientPhone;
    if (!phone) {
      console.log(`⚠️  ${name} — sem telefone cadastrado.`);
      skipped++;
      continue;
    }

    try {
      const msg = reminderMessage(name, sub.dueDay, sub.monthlyValue);
      await sendWhatsApp(phone, msg);

      // Marca que lembrete foi enviado hoje
      await db.collection('subscriptions').doc(doc.id).update({
        lastReminderDate: today,
        lastReminderAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ Lembrete enviado para ${name} (${phone})`);
      sent++;
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${name}:`, err.message);
    }

    // Delay entre mensagens para não ser bloqueado pelo WhatsApp
    await new Promise(r => setTimeout(r, 2500));
  }

  console.log(`\n📊 Resultado: ${sent} enviados, ${skipped} pulados.\n`);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
