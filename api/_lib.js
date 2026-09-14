export function stripBom(s) {
  return s?.replace(/^﻿/, '').trim();
}

export function evolutionConfig() {
  return {
    url:      stripBom(process.env.EVOLUTION_API_URL)?.replace(/\/$/, ''),
    key:      stripBom(process.env.EVOLUTION_API_KEY),
    instance: stripBom(process.env.EVOLUTION_INSTANCE),
  };
}

// Valida o ID token do Firebase enviado pelo app. Sem isso qualquer pessoa
// poderia disparar mensagens ou puxar o QR Code da instância.
export async function requireUser(req, res) {
  const header = req.headers.authorization ?? '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
  const apiKey = stripBom(process.env.VITE_FIREBASE_API_KEY);

  if (!token || !apiKey) {
    res.status(401).json({ error: 'Nao autorizado' });
    return false;
  }

  try {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    if (!r.ok) {
      res.status(401).json({ error: 'Sessao invalida' });
      return false;
    }
    return true;
  } catch {
    res.status(401).json({ error: 'Nao autorizado' });
    return false;
  }
}

export async function forward(res, r) {
  const text = await r.text();
  try {
    res.status(r.status).json(JSON.parse(text));
  } catch {
    res.status(r.status).json({ error: text || `Evolution API ${r.status}` });
  }
}
