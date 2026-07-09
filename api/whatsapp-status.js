const clean = s => s?.replace(/^﻿/, '').trim();

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const url      = clean(process.env.EVOLUTION_API_URL)?.replace(/\/$/, '');
  const key      = clean(process.env.EVOLUTION_API_KEY);
  const instance = clean(process.env.EVOLUTION_INSTANCE);

  if (!url || !key || !instance) {
    return res.status(500).json({ error: 'Evolution API nao configurada' });
  }

  try {
    const r = await fetch(`${url}/instance/connectionState/${instance}`, {
      headers: { apikey: key },
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
