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

const PIX =
  `*Chave PIX (CNPJ)*\n` +
  `69360759000181\n\n` +
  `Favorecido: PEDRO HENRIQUE FIGUEIRA DA SILVA CAVALCANTE\n` +
  `Instituição: Banco Inter`;

const FOOTER = `\n\n_PA Control · mensagem automática_`;

const SUFIXOS = /^(ltda|ltda\.|me|mei|eireli|epp|s\/a|sa|s\.a\.|cia)$/i;
const PREPOSICOES = /^(de|da|do|das|dos|e)$/i;

/**
 * Nome de tratamento: funciona para pessoa ("Maria Aparecida de Souza" -> "Maria Aparecida")
 * e para empresa ("Colegio Sao Jose Educacao Ltda" -> "Colegio Sao Jose").
 */
const displayName = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(w => w && !SUFIXOS.test(w));
  if (words.length === 0) return name.trim();
  const picked = words.length <= 3 ? words : words.slice(0, 3);
  while (picked.length > 1 && PREPOSICOES.test(picked[picked.length - 1])) picked.pop();
  return picked.join(' ');
};

/**
 * Lembrete ou cobrança conforme o momento:
 * antes do vencimento, no dia, 1-2 dias, 3-6 dias ou 7+ dias de atraso.
 */
export function chargeMessage(name: string, value: number, dueDay: number, daysLate: number, auto = false): string {
  const n = displayName(name);
  const v = fmtBRL(value);
  let body: string;

  if (daysLate < 0) {
    body =
      `Olá, ${n}! 👋\n\n` +
      `Sua mensalidade de *${v}* vence no *dia ${dueDay}*.\n\n` +
      `${PIX}\n\n` +
      `Se o pagamento já foi realizado, desconsidere esta mensagem. Obrigado!`;
  } else if (daysLate === 0) {
    body =
      `Olá, ${n}! 👋\n\n` +
      `Sua mensalidade de *${v}* vence *hoje (dia ${dueDay})*.\n\n` +
      `${PIX}\n\n` +
      `Se o pagamento já foi realizado, desconsidere esta mensagem. Obrigado!`;
  } else if (daysLate < 3) {
    body =
      `Olá, ${n}!\n\n` +
      `Ainda não identificamos o pagamento da mensalidade de *${v}*, com vencimento em *${daysLate === 1 ? `ontem, dia ${dueDay}` : `dia ${dueDay}`}*.\n\n` +
      `${PIX}\n\n` +
      `Se já efetuou o pagamento, por favor envie o comprovante para conferência.`;
  } else if (daysLate < 7) {
    body =
      `Olá, ${n}!\n\n` +
      `A mensalidade de *${v}* está em aberto há *${daysLate} dias* (vencimento dia ${dueDay}).\n\n` +
      `Pedimos a gentileza de regularizar o pagamento.\n\n` +
      `${PIX}\n\n` +
      `Caso esteja com alguma dificuldade, podemos combinar uma nova data. É só responder esta mensagem.`;
  } else {
    body =
      `Olá, ${n}.\n\n` +
      `A mensalidade de *${v}* consta em atraso há *${daysLate} dias* (vencimento dia ${dueDay}).\n\n` +
      `Para manter o serviço ativo, solicitamos a regularização do pagamento.\n\n` +
      `${PIX}\n\n` +
      `Se o pagamento já foi realizado ou deseja combinar uma nova data, responda esta mensagem.`;
  }

  return auto ? body + FOOTER : body;
}

export function thankYouMessage(name: string, value: number, month: Date): string {
  return (
    `Olá, ${displayName(name)}! ✅\n\n` +
    `Confirmamos o recebimento do seu pagamento de *${fmtBRL(value)}*, referente a *${format(month, "MMMM 'de' yyyy", { locale: ptBR })}*.\n\n` +
    `Obrigado pela confiança! Qualquer dúvida, estamos à disposição.` +
    FOOTER
  );
}
