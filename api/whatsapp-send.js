function stripBom(s) {
  return s?.replace(/^﻿/, '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const url      = stripBom(process.env.EVOLUTION_API_URL)?.replace(/\/$/, '');
  const key      = stripBom(process.env.EVOLUTION_API_KEY);
  const instance = stripBom(process.env.EVOLUTION_INSTANCE);

  if (!url || !key || !instance) {
    return res.status(500).json({ error: 'Evolution API nao configurada' });
  }

  const { phone, message } = req.body ?? {};
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone e message sao obrigatorios' });
  }

  const digits = phone.replace(/\D/g, '');
  const number = digits.startsWith('55') ? digits : `55${digits}`;

  try {
    const r = await fetch(`${url}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key },
      body: JSON.stringify({ number, text: message }),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
