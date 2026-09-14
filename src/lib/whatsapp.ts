import { format, getDaysInMonth, setDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auth } from './firebase';
import { Client, Subscription } from './types';

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

/** Chama as funções /api/* enviando o token do Firebase (exigido pelo servidor). */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await auth.currentUser?.getIdToken();
  return fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

export function buildWaLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const number = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Envia via Evolution API (proxy). Lança erro se a API recusar. */
export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  const res = await apiFetch('/api/whatsapp-send', {
    method: 'POST',
    body: JSON.stringify({ phone, message }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const notOnWhatsApp = Array.isArray(data?.response?.message) &&
      data.response.message.some((m: { exists?: boolean }) => m?.exists === false);
    throw new Error(notOnWhatsApp ? 'Número não tem WhatsApp' : (data?.error ?? `Erro ${res.status}`));
  }
}

/** Nome/telefone considerando assinaturas legadas ligadas por clientId. */
export function subClientName(sub: Subscription, clients: Client[]): string {
  return sub.clientName || clients.find(c => c.id === sub.clientId)?.name || 'Cliente';
}

export function subClientPhone(sub: Subscription, clients: Client[]): string {
  return sub.clientPhone || clients.find(c => c.id === sub.clientId)?.phone || '';
}

/** Data de vencimento no mês, sem "vazar" para o mês seguinte (dia 31 em mês de 30 dias). */
export function dueDateIn(month: Date, dueDay: number): Date {
  return setDate(month, Math.min(dueDay, getDaysInMonth(month)));
}

/** Dias de atraso no mês atual: negativo = faltam N dias, 0 = vence hoje. */
export function daysLateFor(dueDay: number, now = new Date()): number {
  return now.getDate() - dueDateIn(now, dueDay).getDate();
}

// ── Mensagens ─────────────────────────────────────────────────────────────────
// Manter os textos iguais aos de scripts/send-reminders.js (envio automático).

const PIX    = `PIX (Nubank):\n62991803975`;
const FOOTER = `\n\n_PA Control · mensagem automática_`;

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

/**
 * Lembrete ou cobrança conforme o momento:
 * antes do vencimento, no dia, 1-2 dias, 3-6 dias ou 7+ dias de atraso.
 */
export function chargeMessage(name: string, value: number, dueDay: number, daysLate: number, auto = false): string {
  const n = firstName(name);
  const v = fmtBRL(value);
  let body: string;

  if (daysLate < 0) {
    body =
      `Oi, ${n}! Tudo bem? 😊\n\n` +
      `Passando pra lembrar que sua mensalidade de *${v}* vence *dia ${dueDay}*.\n\n` +
      `${PIX}\n\n` +
      `Se já pagou, pode desconsiderar. Obrigado! 🙏`;
  } else if (daysLate === 0) {
    body =
      `Oi, ${n}! 😊\n\n` +
      `Sua mensalidade de *${v}* vence *hoje*.\n\n` +
      `${PIX}\n\n` +
      `Se já pagou, é só desconsiderar. Obrigado! 🙏`;
  } else if (daysLate < 3) {
    body =
      `Oi, ${n}, tudo bem?\n\n` +
      `Ainda não identificamos o pagamento da mensalidade de *${v}*, que venceu *${daysLate === 1 ? `ontem (dia ${dueDay})` : `dia ${dueDay}`}*.\n\n` +
      `Pode ter sido só um esquecimento, sem problema! 😊\n\n` +
      `${PIX}\n\n` +
      `Se já pagou, me avisa que eu confiro.`;
  } else if (daysLate < 7) {
    body =
      `Oi, ${n}!\n\n` +
      `Sua mensalidade de *${v}* está em aberto há *${daysLate} dias* (venceu dia ${dueDay}).\n\n` +
      `Consegue regularizar hoje?\n\n` +
      `${PIX}\n\n` +
      `Se estiver com alguma dificuldade, me chama que a gente conversa. 🤝`;
  } else {
    body =
      `Oi, ${n}.\n\n` +
      `A mensalidade de *${v}* está em atraso há *${daysLate} dias* (venceu dia ${dueDay}).\n\n` +
      `Precisamos do pagamento para manter o serviço ativo.\n\n` +
      `${PIX}\n\n` +
      `Se já pagou ou quer combinar outra data, é só responder esta mensagem. 🙏`;
  }

  return auto ? body + FOOTER : body;
}

export function thankYouMessage(name: string, value: number, month: Date): string {
  return (
    `Oi, ${firstName(name)}! 😊\n\n` +
    `Recebemos seu pagamento de *${fmtBRL(value)}* referente a *${format(month, "MMMM 'de' yyyy", { locale: ptBR })}*. ✅\n\n` +
    `Obrigado por manter tudo em dia! Qualquer coisa, é só chamar. 🙏` +
    FOOTER
  );
}
