import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface WhatsAppReminderButtonProps {
  clientName: string;
  clientPhone: string;
  amount: number;
  dueDay?: number;
  asIcon?: boolean;
}

export function WhatsAppReminderButton({
  clientName,
  clientPhone,
  amount,
  dueDay,
  asIcon
}: WhatsAppReminderButtonProps) {
  const handleSendWhatsApp = () => {
    // Formatar número de telefone: remover tudo que não for dígito
    const cleanPhone = clientPhone.replace(/\D/g, '');
    
    // Validar se tem pelo menos 10 dígitos (DDD + número)
    if (cleanPhone.length < 10) {
      alert("Número de telefone inválido para WhatsApp.");
      return;
    }

    // Usar código do país 55 (Brasil) por padrão se não tiver
    const whatsappNumber = cleanPhone.startsWith('55') 
      ? cleanPhone 
      : `55${cleanPhone}`;

    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
    
    const dayText = dueDay ? ` dia ${dueDay}` : 'este mês';

    // Mensagem elegante de lembrete
    const message = `Olá, ${clientName}! Tudo bem? ✨

Passando aqui de forma rápida para compartilhar os dados de nossa próxima renovação, programada para o${dayText}.

*Valor:* ${formattedAmount}
*Chave PIX:* 62991803975 (Nubank)

Sua assinatura garante a continuidade dos nossos serviços sem interrupções.

Qualquer dúvida, estou totalmente à disposição. Tenha um excelente dia! 🙏`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (asIcon) {
    return (
      <button
        onClick={handleSendWhatsApp}
        className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 p-2 rounded-full transition-colors"
        title="Cobrar via WhatsApp"
        type="button"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 z-10 relative"
      onClick={(e) => {
        // Stop propagation so it doesn't trigger parent click handlers (like opening a modal)
        e.stopPropagation();
        handleSendWhatsApp();
      }}
      title="Enviar lembrete via WhatsApp"
      type="button"
    >
      <MessageCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Lembrete</span>
    </Button>
  );
}
