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
import { motion } from 'motion/react';
import { PageHeader } from '@/components/PageHeader';
import { TableSkeleton } from '@/components/Skeleton';

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

  const sendThankYou = async (sub: Subscription) => {
    const phone = sub.clientPhone;
    if (!phone) return;
    const name = sub.clientName || 'Cliente';
    const value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(sub.monthlyValue));
    const message =
      `🤖 _Mensagem automática do sistema de gestão PA Control_\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Olá, *${name}*! 👋😊\n\n` +
      `✅ *Pagamento confirmado!*\n\n` +
      `💵 Valor: *${value}*\n` +
      `📅 Mês de competência: *${format(currentViewMonth, 'MMMM yyyy', { locale: ptBR })}*\n\n` +
      `Obrigado por manter sua assinatura em dia! 🙏\n\n` +
      `Qualquer dúvida é só chamar! 💬`;
    try {
      await fetch('/api/whatsapp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message }),
      });
    } catch {
      // falha silenciosa
    }
  };

  const togglePayment = async (sub: Subscription) => {
    const isPaid = sub.payments ? sub.payments[monthKey] === true : (monthKey === format(today, 'yyyy-MM') ? sub.paid === true : false);
    const newPayments = { ...(sub.payments || {}) };
    newPayments[monthKey] = !isPaid;

    await updateSubscription(sub.id, { payments: newPayments });
    toast.success(!isPaid ? 'Pagamento confirmado!' : 'Pagamento desfeito');
    if (!isPaid) sendThankYou(sub);
    loadData();
  };

  if (loading) return <TableSkeleton rows={5} />;

  const activeSubs = subs.filter(s => s.status === 'active');
  const expectedTotal = activeSubs.reduce((acc, sub) => acc + Number(sub.monthlyValue), 0);
  
  // Create an array of active subscriptions mapped to their payment state for the view month
  const scheduledItems = activeSubs.map(sub => {
    const dueDate = setDate(currentViewMonth, sub.dueDay);
    const isPaid = sub.payments ? sub.payments[monthKey] === true : (monthKey === format(today, 'yyyy-MM') ? sub.paid === true : false);
    
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
      <PageHeader
        title="Agenda"
        subtitle="Gerencie todos os pagamentos recorrentes por mês."
      />

      {/* Month Navigation & Summary */}
      <div className="glass-panel p-4 rounded-[1.5rem] shadow-lg">
        {/* Month selector */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <Button
            variant="outline" size="icon"
            onClick={handlePrevMonth}
            disabled={currentViewMonth.getFullYear() < 2026 || (currentViewMonth.getFullYear() === 2026 && currentViewMonth.getMonth() <= 4)}
            className="bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 font-semibold">Competência</span>
            <span className="text-lg font-bold text-primary uppercase">
              {format(currentViewMonth, 'MMM yyyy', { locale: ptBR }).replace('.', '')}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="bg-muted text-foreground hover:bg-muted/80 shrink-0">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Previsto</span>
            <span className="text-sm font-bold text-foreground mt-0.5">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expectedTotal)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Recebido</span>
            <span className="text-sm font-bold text-emerald-500 mt-0.5">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceived)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendente</span>
            <span className="text-sm font-bold text-amber-500 mt-0.5">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPending)}</span>
          </div>
        </div>
      </div>

      {/* Agenda List */}
      <div className="grid gap-4">
        {scheduledItems.length === 0 ? (
          <div className="text-center py-12 bg-card/40 rounded-2xl">
            <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhuma assinatura ativa para agendamento.</p>
          </div>
        ) : (
          scheduledItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-panel p-4 sm:p-5 rounded-2xl transition-all duration-300"
            >
              {/* Top row: day + name + badge */}
              <div className="flex items-center gap-4 mb-3 sm:mb-0">
                <div className="flex flex-col items-center justify-center bg-background w-12 h-12 sm:w-14 sm:h-14 rounded-xl shadow-inner shrink-0">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">Dia</span>
                  <span className="text-lg sm:text-xl font-bold text-foreground">{item.dueDay}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-semibold text-foreground truncate">{item.clientName}</h4>
                  <p className="text-sm text-muted-foreground truncate">{item.service || 'Assinatura Padrão'}</p>
                </div>
                <Badge className={`border-none px-2.5 py-1 flex items-center shadow-none text-xs shrink-0 ${item.statusBg} ${item.statusColor}`}>
                  {item.statusIcon}
                  <span className="hidden sm:inline">{item.statusText}</span>
                </Badge>
              </div>

              {/* Bottom row: value + button */}
              <div className="flex items-center justify-between gap-3 sm:mt-0 pt-3 sm:pt-0"
                   style={{ borderTop: '1px solid var(--border)' }}>
                <div className="sm:hidden">
                  <span className="text-xs text-muted-foreground">Valor</span>
                  <p className="font-bold text-foreground text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.monthlyValue)}</p>
                </div>
                <span className="hidden sm:block font-bold text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.monthlyValue)}
                </span>
                <Button
                  onClick={() => togglePayment(item)}
                  size="sm"
                  className={`rounded-xl px-4 sm:px-6 transition-all ${
                    item.isPaid
                      ? 'bg-transparent border border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
                  }`}
                  variant={item.isPaid ? 'outline' : 'default'}
                >
                  {item.isPaid ? 'Desfazer' : 'Confirmar Pgto'}
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

    </div>
  );
}
