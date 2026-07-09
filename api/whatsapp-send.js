const clean = s => s?.replace(/^﻿/, '').trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const url      = clean(process.env.EVOLUTION_API_URL)?.replace(/\/$/, '');
  const key      = clean(process.env.EVOLUTION_API_KEY);
  const instance = clean(process.env.EVOLUTION_INSTANCE);

  if (!url || !key || !instance) {
    return res.status(500).json({ error: 'Evolution API não configurada' });
  }

  const { phone, message } = req.body ?? {};
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone e message são obrigatórios' });
  }

  const clean = phone.replace(/\D/g, '');
  const number = clean.startsWith('55') ? clean : `55${clean}`;

  try {
    const r = await fetch(`${url}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key },
      body: JSON.stringify({ number, textMessage: { text: message } }),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
