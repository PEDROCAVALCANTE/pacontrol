const API_URL = import.meta.env.VITE_EVOLUTION_API_URL?.replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY;
const INSTANCE = import.meta.env.VITE_EVOLUTION_INSTANCE;

export function isEvolutionConfigured(): boolean {
  return !!(API_URL && API_KEY && INSTANCE);
}

export function buildWaLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '');
  const number = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  const clean = phone.replace(/\D/g, '');
  const number = clean.startsWith('55') ? clean : `55${clean}`;

  const res = await fetch(`${API_URL}/message/sendText/${INSTANCE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: API_KEY,
    },
    body: JSON.stringify({
      number,
      text: message,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Evolution API error ${res.status}: ${err}`);
  }
}

export function reminderMessage(clientName: string, dueDay: number): string {
  return `Olá, ${clientName}! 👋\n\nSua mensalidade deste mês (vencimento dia ${dueDay}) está pendente. ⚠️\n\nPara manter seu acesso ativo, não esqueça de realizar o pagamento. 💳\n\nQualquer dúvida, só chamar! 🤝`;
}
