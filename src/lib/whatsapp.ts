import { format, getDaysInMonth, setDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auth } from './firebase';
import { Client, Subscription } from './types';

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

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

export function thankYouMessage(name: string, value: number, month: Date): string {
  return (
    `🤖 _Mensagem automática do sistema de gestão PA Control_\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Olá, *${name}*! 👋😊\n\n` +
    `✅ *Pagamento confirmado!*\n\n` +
    `💵 Valor: *${fmtBRL(Number(value))}*\n` +
    `📅 Mês de competência: *${format(month, "MMMM 'de' yyyy", { locale: ptBR })}*\n\n` +
    `Obrigado por manter sua assinatura em dia! 🙏\n\n` +
    `Qualquer dúvida é só chamar! 💬`
  );
}

export function reminderMessage(clientName: string, dueDay: number): string {
  return `Olá, ${clientName}! 👋\n\nSua mensalidade deste mês (vencimento dia ${dueDay}) está pendente. ⚠️\n\nPara manter seu acesso ativo, não esqueça de realizar o pagamento. 💳\n\nQualquer dúvida, só chamar! 🤝`;
}
