import { useState } from 'react';
import { MessageCircle, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { sendWhatsApp, buildWaLink, chargeMessage, daysLateFor } from '@/lib/whatsapp';

interface Props {
  phone: string;
  clientName: string;
  dueDay: number;
  value: number;
  /** Quando informado, mostra um botão com texto em vez de só o ícone. */
  label?: string;
}

/**
 * Único caminho de cobrança do sistema: monta o texto conforme o vencimento,
 * envia pela Evolution API e, se falhar, abre o WhatsApp Web com a mensagem pronta.
 */
export function WhatsAppButton({ phone, clientName, dueDay, value, label }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleClick = async () => {
    const message = chargeMessage(clientName, value, dueDay, daysLateFor(dueDay));
    setStatus('sending');
    try {
      await sendWhatsApp(phone, message);
      setStatus('sent');
      toast.success(`Cobrança enviada para ${clientName}`);
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      toast.error(`Não enviou pela Evolution: ${err instanceof Error ? err.message : 'erro'}. Abrindo WhatsApp Web.`);
      window.open(buildWaLink(phone, message), '_blank');
      setStatus('idle');
    }
  };

  const icon = status === 'sending'
    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
    : status === 'sent'
      ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
      : <MessageCircle className="w-3.5 h-3.5" />;

  if (label) {
    return (
      <button
        onClick={handleClick}
        disabled={status !== 'idle'}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] text-xs font-semibold
                   bg-primary text-primary-foreground transition-opacity
                   hover:opacity-90 disabled:opacity-60"
      >
        {icon}
        {status === 'sent' ? 'Enviada' : status === 'sending' ? 'Enviando' : label}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={status !== 'idle'}
      title="Cobrar pelo WhatsApp"
      className="inline-flex items-center justify-center w-8 h-8 rounded-[10px]
                 text-primary bg-[var(--primary-soft)] transition-opacity
                 hover:opacity-80 disabled:opacity-50"
    >
      {icon}
    </button>
  );
}
