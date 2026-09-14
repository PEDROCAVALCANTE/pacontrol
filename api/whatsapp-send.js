import { evolutionConfig, requireUser, forward } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!(await requireUser(req, res))) return;

  const { url, key, instance } = evolutionConfig();
  if (!url || !key || !instance) {
    return res.status(500).json({ error: 'Evolution API nao configurada' });
  }

  const { phone, message } = req.body ?? {};
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone e message sao obrigatorios' });
  }

  const digits = String(phone).replace(/\D/g, '');
  const number = digits.startsWith('55') ? digits : `55${digits}`;

  try {
    const r = await fetch(`${url}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key },
      body: JSON.stringify({ number, text: message }),
    });
    await forward(res, r);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
