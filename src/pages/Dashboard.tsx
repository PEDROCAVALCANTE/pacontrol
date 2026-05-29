'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getClients, getSubscriptions, getExpenses, updateSubscription } from '@/lib/data-store';
import { Client, Expense, Subscription } from '@/lib/types';
import { DollarSign, AlertCircle, TrendingUp, CreditCard, Activity, Check, X, Info } from 'lucide-react';
import { format, startOfDay, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'motion/react';
import { WhatsAppButton } from '@/components/WhatsAppButton';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const loadData = async () => {
    const [c, s, e] = await Promise.all([getClients(), getSubscriptions(), getExpenses()]);
    setClients(c);
    setSubs(s);
    setExpenses(e);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Carregando dashboard...</div>;

  const today = startOfDay(new Date());
  const currentMonthKey = format(today, 'yyyy-MM');
  
  const getSubClientName = (sub: Subscription) => {
    if (sub.clientName) return sub.clientName;
    if (sub.clientId) return clients.find(c => c.id === sub.clientId)?.name || 'Desconhecido';
    return 'Desconhecido';
  };

  const getSubClientPhone = (sub: Subscription) => {
    if (sub.clientPhone) return sub.clientPhone;
    if (sub.clientId) return clients.find(c => c.id === sub.clientId)?.phone || '';
    return '';
  };
  
  // Calculations
  const activeSubs = subs.filter(s => s.status === 'active');
  const expectedRevenue = activeSubs.reduce((acc, sub) => acc + Number(sub.monthlyValue), 0);
  const receivedRevenue = activeSubs.filter(s => s.payments?.[currentMonthKey] || s.paid).reduce((acc, sub) => acc + Number(sub.monthlyValue), 0);
  const openRevenue = expectedRevenue - receivedRevenue;

  const totalExpenses = expenses.filter(e => e.paid).reduce((acc, e) => acc + Number(e.amount), 0);

  const realIncome = receivedRevenue - totalExpenses;

  // Generate last 1 months for the elegant table, as seen in the image
  const systemStartDate = new Date(2026, 4, 1); // May 2026
  const monthList = [today];

  const togglePayment = async (sub: Subscription, monthDate: Date) => {
    const mKey = format(monthDate, 'yyyy-MM');
    const isPaid = sub.payments?.[mKey] || (mKey === currentMonthKey ? sub.paid : false);
    
    const newPayments = { ...(sub.payments || {}) };
    newPayments[mKey] = !isPaid;
    
    // For current month backwards compatibility
    const paidLegacyUpdate = mKey === currentMonthKey ? { paid: !isPaid } : {};

    await updateSubscription(sub.id, { payments: newPayments, ...paidLegacyUpdate });
    toast.success(!isPaid ? 'Mês marcado como pago' : 'Pagamento removido');
    loadData();
  };

  const isTodayAfter10th = today.getDate() > 10;

  return (
    <div className="space-y-8 font-sans">
      <header className="mb-6 flex flex-col gap-1">
        <h2 className="text-4xl font-serif text-foreground tracking-tight">Visão Geral</h2>
        <p className="text-sm text-muted-foreground">Métricas e histórico de recebimentos.</p>
      </header>

      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.0 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receita Prevista</p>
                  <Tooltip>
                    <TooltipTrigger render={<button type="button" className="focus:outline-none rounded-full p-0.5 cursor-pointer" />}>
                      <Info className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Soma do valor de todas as assinaturas ativas.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground opacity-70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expectedRevenue)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-emerald-500 uppercase tracking-wider">Recebido</p>
                  <Tooltip>
                    <TooltipTrigger render={<button type="button" className="focus:outline-none rounded-full p-0.5 cursor-pointer" />}>
                      <Info className="h-3.5 w-3.5 text-emerald-500 opacity-70" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total de pagamentos recebidos no mês atual.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <DollarSign className="h-4 w-4 text-emerald-500 opacity-70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receivedRevenue)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-rose-500 uppercase tracking-wider">Em Aberto</p>
                  <Tooltip>
                    <TooltipTrigger render={<button type="button" className="focus:outline-none rounded-full p-0.5" />}>
                      <Info className="h-3.5 w-3.5 text-rose-500 opacity-70" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total pendente de recebimento.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <AlertCircle className="h-4 w-4 text-rose-500 opacity-70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(openRevenue)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Despesas</p>
                  <Tooltip>
                    <TooltipTrigger render={<button type="button" className="focus:outline-none rounded-full p-0.5 cursor-pointer" />}>
                      <Info className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total de todas as despesas pagas cadastradas.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CreditCard className="h-4 w-4 text-muted-foreground opacity-70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-emerald-500 uppercase tracking-wider">Lucro Líquido</p>
                  <Tooltip>
                    <TooltipTrigger render={<button type="button" className="focus:outline-none rounded-full p-0.5 cursor-pointer" />}>
                      <Info className="h-3.5 w-3.5 text-emerald-500 opacity-70" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Lucro líquido total (Recebido - Despesas Pagas).</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Activity className="h-4 w-4 text-emerald-500 opacity-70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(realIncome)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </TooltipProvider>

      <div className="flex justify-between items-end mt-12 mb-4 font-sans max-w-full">
        <h3 className="text-3xl font-serif text-foreground tracking-tight">Histórico de Recebimentos</h3>
        <p className="text-xs text-muted-foreground font-medium">Últimos {monthList.length} meses</p>
      </div>
      <div className="flex flex-col gap-4 font-sans">
        <div className="overflow-hidden">
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px] border-separate border-spacing-y-2 p-2">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider w-24 text-center">Ação</th>
                  {monthList.map(m => (
                    <th key={m.getTime()} className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-center w-28">
                      {format(m, 'MMM', { locale: ptBR })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeSubs.map((sub, index) => {
                  const isCurrentMonthPaid = sub.payments?.[currentMonthKey] || sub.paid;
                  const cPhone = getSubClientPhone(sub).replace(/\D/g, '');
                  const shouldMessage = !isCurrentMonthPaid && isTodayAfter10th;

                  return (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: index * 0.05 }}
                      key={sub.id} 
                      className="glass-panel shadow-sm hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5)] hover:-translate-y-[2px] transition-all duration-300 [&>td:first-child]:rounded-l-xl [&>td:last-child]:rounded-r-xl"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{getSubClientName(sub)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.monthlyValue)} 
                          {' • '}Dia {sub.dueDay}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {shouldMessage && cPhone && (
                          <WhatsAppButton
                            phone={cPhone}
                            clientName={getSubClientName(sub)}
                            dueDay={sub.dueDay}
                          />
                        )}
                      </td>
                      {monthList.map(m => {
                        const mKey = format(m, 'yyyy-MM');
                        const isThisMonthPaid = sub.payments?.[mKey] || (mKey === currentMonthKey && sub.paid);
                        
                        return (
                          <td key={m.getTime()} className="px-6 py-4 text-center">
                            <button
                              onClick={() => togglePayment(sub, m)}
                              title={isThisMonthPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                              className={`w-8 h-8 mx-auto flex items-center justify-center transition-all rounded-full border ${
                                isThisMonthPaid 
                                  ? 'bg-emerald-500/10 border-transparent text-emerald-500 hover:bg-emerald-500/20' 
                                  : 'bg-transparent border-input text-muted-foreground hover:bg-accent'
                              }`}
                            >
                              {isThisMonthPaid ? <Check className="w-4 h-4" strokeWidth={2.5} /> : <X className="w-4 h-4" strokeWidth={2.5} />}
                            </button>
                          </td>
                        );
                      })}
                    </motion.tr>
                  )
                })}
                {activeSubs.length === 0 && (
                  <tr>
                    <td colSpan={2 + monthList.length} className="px-6 py-8 text-center text-muted-foreground">
                      Nenhuma assinatura cadastrada ou ativa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
