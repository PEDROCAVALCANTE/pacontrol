import { evolutionConfig, requireUser, forward } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!(await requireUser(req, res))) return;

  const { url, key, instance } = evolutionConfig();
  if (!url || !key || !instance) {
    return res.status(500).json({ error: 'Evolution API nao configurada' });
  }

  try {
    const r = await fetch(`${url}/instance/connect/${instance}`, {
      headers: { apikey: key },
    });
    await forward(res, r);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
