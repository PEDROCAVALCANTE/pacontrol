const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

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
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay    = tomorrow.getDate();
  const currentMonthKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}`;

  console.log(`\n📅 Verificando vencimentos para o dia ${tomorrowDay} (${currentMonthKey})...\n`);

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

    // Skip if already paid this month
    const isPaid = sub.payments?.[currentMonthKey] || sub.paid;
    if (isPaid) {
      console.log(`⏭️  ${name} — já pagou este mês, pulando.`);
      skipped++;
      continue;
    }

    const phone = sub.clientPhone;
    if (!phone) {
      console.log(`⚠️  ${name} — sem telefone cadastrado, pulando.`);
      skipped++;
      continue;
    }

    try {
      const msg = reminderMessage(name, sub.dueDay, sub.monthlyValue);
      await sendWhatsApp(phone, msg);
      console.log(`✅ Lembrete enviado para ${name} (${phone})`);
      sent++;
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${name}:`, err.message);
    }

    // Delay entre mensagens para não ser bloqueado
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n📊 Resultado: ${sent} enviados, ${skipped} pulados.\n`);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
