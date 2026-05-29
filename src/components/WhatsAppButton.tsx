import { useState } from 'react';
import { MessageCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendWhatsApp, buildWaLink, isEvolutionConfigured, reminderMessage } from '@/lib/whatsapp';

interface Props {
  phone: string;
  clientName: string;
  dueDay: number;
}

export function WhatsAppButton({ phone, clientName, dueDay }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const message = reminderMessage(clientName, dueDay);

  const handleClick = async () => {
    if (!isEvolutionConfigured()) {
      window.open(buildWaLink(phone, message), '_blank');
      return;
    }

    setStatus('sending');
    try {
      await sendWhatsApp(phone, message);
      setStatus('sent');
      toast.success(`Lembrete enviado para ${clientName}`);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      toast.error('Falha ao enviar. Abrindo WhatsApp Web...');
      window.open(buildWaLink(phone, message), '_blank');
      setStatus('idle');
    }
  };

  if (status === 'sent') {
    return (
      <span className="inline-flex items-center justify-center text-emerald-500 p-2 rounded-full">
        <CheckCircle2 className="w-4 h-4" />
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === 'sending'}
      title="Enviar lembrete via WhatsApp"
      className="inline-flex items-center justify-center text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 p-2 rounded-full transition-colors disabled:opacity-50"
    >
      {status === 'sending'
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <MessageCircle className="w-4 h-4" />
      }
    </button>
  );
}
