'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getClients, getSubscriptions, updateSubscription } from '@/lib/data-store';
import { Client, Subscription } from '@/lib/types';
import { Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, addMonths, subMonths, startOfMonth, setDate, isBefore, isToday, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WhatsAppReminderButton } from '@/components/whatsapp-button';

export default function AgendaPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [currentViewMonth, setCurrentViewMonth] = useState(startOfMonth(new Date()));

  const loadData = async () => {
    const [c, s] = await Promise.all([getClients(), getSubscriptions()]);
    setClients(c);
    setSubs(s);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se o usuário estiver digitando em algum campo
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        setCurrentViewMonth(prev => {
          const newDate = subMonths(prev, 1);
          // Prevenindo navegar antes de Maio de 2026, igual ao botão desabilitado na UI
          if (newDate.getFullYear() < 2026 || (newDate.getFullYear() === 2026 && newDate.getMonth() < 4)) {
            return prev;
          }
          return newDate;
        });
      } else if (e.key === 'ArrowRight') {
        setCurrentViewMonth(prev => addMonths(prev, 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getSubClientName = (sub: Subscription) => {
    if (sub.clientName) return sub.clientName;
    if (sub.clientId) return clients.find(c => c.id === sub.clientId)?.name || 'Desconhecido';
    return 'Desconhecido';
  };

  const handlePrevMonth = () => setCurrentViewMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentViewMonth(prev => addMonths(prev, 1));

  const monthKey = format(currentViewMonth, 'yyyy-MM');
  const today = new Date();

  const togglePayment = async (sub: Subscription) => {
    const isPaid = sub.payments?.[monthKey] || (monthKey === format(today, 'yyyy-MM') ? sub.paid : false);
    const newPayments = { ...(sub.payments || {}) };
    newPayments[monthKey] = !isPaid;

    // For current month backwards compatibility
    const paidLegacyUpdate = monthKey === format(today, 'yyyy-MM') ? { paid: !isPaid } : {};

    await updateSubscription(sub.id, { payments: newPayments, ...paidLegacyUpdate });
    toast.success(!isPaid ? 'Pagamento confirmado!' : 'Pagamento desfeito');
    loadData();
  };

  if (loading) return <div className="text-slate-400">Carregando agenda...</div>;

  const activeSubs = subs.filter(s => s.status === 'active');
  const expectedTotal = activeSubs.reduce((acc, sub) => acc + Number(sub.monthlyValue), 0);
  
  // Create an array of active subscriptions mapped to their payment state for the view month
  const scheduledItems = activeSubs.map(sub => {
    const dueDate = setDate(currentViewMonth, sub.dueDay);
    const isPaid = sub.payments?.[monthKey] || (monthKey === format(today, 'yyyy-MM') ? sub.paid : false);
    
    // Determine status
    let statusText = 'Pendente';
    let statusColor = 'text-[#F59E0B]';
    let statusBg = 'bg-[#F59E0B]/10';
    let statusIcon = <Clock className="w-4 h-4 mr-1" />;

    if (isPaid) {
      statusText = 'Pago';
      statusColor = 'text-[#10B981]';
      statusBg = 'bg-[#10B981]/10';
      statusIcon = <CheckCircle2 className="w-4 h-4 mr-1" />;
    } else if (isBefore(dueDate, startOfDay(today))) {
      statusText = 'Atrasado';
      statusColor = 'text-[#EF4444]';
      statusBg = 'bg-[#EF4444]/10';
      statusIcon = <AlertCircle className="w-4 h-4 mr-1" />;
    } else if (isSameDay(dueDate, today)) {
       statusText = 'Vence Hoje';
       statusColor = 'text-[#3B82F6]';
       statusBg = 'bg-[#3B82F6]/10';
    }

    return {
      ...sub,
      clientName: getSubClientName(sub),
      dueDate,
      isPaid,
      statusText,
      statusColor,
      statusBg,
      statusIcon
    };
  }).sort((a, b) => a.dueDay - b.dueDay);

  const totalReceived = scheduledItems.filter(item => item.isPaid).reduce((acc, item) => acc + Number(item.monthlyValue), 0);
  const totalPending = expectedTotal - totalReceived;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Agenda de Recebimentos</h2>
          <p className="text-sm sm:text-base text-[#9CA3AF]">Gerencie todos os pagamentos recorrentes das suas assinaturas</p>
        </div>
      </header>

      {/* Month Navigation & Summary */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-[#0F172A]/80 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] p-4 sm:p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePrevMonth} 
            disabled={currentViewMonth.getFullYear() < 2026 || (currentViewMonth.getFullYear() === 2026 && currentViewMonth.getMonth() <= 4)}
            className="border-[rgba(255,255,255,0.08)] bg-[#111827] text-[#E5E7EB] hover:bg-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col items-center min-w-[120px]">
             <span className="text-[10px] sm:text-xs text-[#9CA3AF] uppercase tracking-wider mb-1 font-semibold">Competência</span>
             <span className="text-lg sm:text-xl font-bold text-[#FF6A00] uppercase">
                {format(currentViewMonth, 'MMM yyyy', { locale: ptBR }).replace('.', '')}
             </span>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="border-[rgba(255,255,255,0.08)] bg-[#111827] text-[#E5E7EB] hover:bg-[#1E293B]">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex w-full md:w-auto justify-between gap-4 sm:gap-8 pt-4 md:pt-0 border-t border-[rgba(255,255,255,0.05)] md:border-none">
           <div className="flex flex-col items-center md:items-end">
             <span className="text-[10px] sm:text-xs text-[#9CA3AF] uppercase tracking-wider">Previsto</span>
             <span className="text-sm sm:text-lg font-bold text-[#E5E7EB]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expectedTotal)}</span>
           </div>
           <div className="flex flex-col items-center md:items-end">
             <span className="text-[10px] sm:text-xs text-[#9CA3AF] uppercase tracking-wider">Recebido</span>
             <span className="text-sm sm:text-lg font-bold text-[#10B981]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceived)}</span>
           </div>
           <div className="flex flex-col items-center md:items-end">
             <span className="text-[10px] sm:text-xs text-[#9CA3AF] uppercase tracking-wider">Pendente</span>
             <span className="text-sm sm:text-lg font-bold text-[#F59E0B]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPending)}</span>
           </div>
        </div>
      </div>

      {/* Agenda List */}
      <div className="grid gap-4">
        {scheduledItems.length === 0 ? (
          <div className="text-center py-12 bg-[#0F172A]/40 border border-[rgba(255,255,255,0.08)] rounded-2xl">
            <CalendarIcon className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4 opacity-50" />
            <p className="text-[#9CA3AF]">Nenhuma assinatura ativa para agendamento.</p>
          </div>
        ) : (
          scheduledItems.map(item => (
            <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-2xl transition-all hover:bg-[#1E293B] group">
               <div className="flex items-center gap-6 w-full sm:w-auto">
                 <div className="flex flex-col items-center justify-center bg-[#0B0F14] w-14 h-14 rounded-xl border border-[rgba(255,255,255,0.05)] shadow-inner">
                    <span className="text-xs text-[#9CA3AF] font-medium uppercase">Dia</span>
                    <span className="text-xl font-bold text-[#E5E7EB]">{item.dueDay}</span>
                 </div>
                 
                 <div className="flex flex-col">
                   <h4 className="text-lg font-semibold text-[#E5E7EB]">{item.clientName}</h4>
                   <p className="text-sm text-[#9CA3AF]">{item.service || 'Assinatura Padrão'}</p>
                 </div>
               </div>

               <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0 gap-6">
                 <div className="flex flex-col items-end">
                   <span className="text-sm font-medium text-[#9CA3AF]">Valor</span>
                   <span className="font-bold text-[#E5E7EB]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.monthlyValue)}</span>
                 </div>

                 <Badge className={`border-none px-3 py-1.5 flex items-center shadow-none ${item.statusBg} ${item.statusColor}`}>
                   {item.statusIcon}
                   {item.statusText}
                 </Badge>

                 <div className="flex gap-2">
                   {!item.isPaid && item.clientPhone && (
                     <WhatsAppReminderButton
                       clientName={item.clientName}
                       clientPhone={item.clientPhone}
                       amount={item.monthlyValue}
                       dueDay={item.dueDay}
                       asIcon={true}
                     />
                   )}
                   <Button 
                     onClick={() => togglePayment(item)}
                     className={`rounded-xl px-6 transition-all ${
                       item.isPaid 
                         ? 'bg-transparent border border-[#10B981]/50 text-[#10B981] hover:bg-[#10B981]/10' 
                         : 'bg-[#FF6A00] hover:bg-[#E65F00] text-white shadow-[0_4px_24px_rgba(255,106,0,0.2)] hover:shadow-[0_6px_32px_rgba(255,106,0,0.3)]'
                     }`}
                     variant={item.isPaid ? 'outline' : 'default'}
                   >
                     {item.isPaid ? 'Desfazer' : 'Confirmar Pgto'}
                   </Button>
                 </div>
               </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
