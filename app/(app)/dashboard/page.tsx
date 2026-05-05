'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getClients, getSubscriptions, getExpenses, updateSubscription } from '@/lib/data-store';
import { Client, Expense, Subscription } from '@/lib/types';
import { DollarSign, AlertCircle, TrendingUp, CreditCard, Activity, Check, X, MessageCircle, Info } from 'lucide-react';
import { format, isAfter, setDate, startOfDay, endOfMonth, startOfMonth, isBefore, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  if (loading) return <div>Carregando dashboard...</div>;

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

  // Generate last 6 months for the elegant table, but only from system start (May 2026)
  const systemStartDate = new Date(2026, 4, 1); // May 2026
  const monthList = Array.from({ length: 6 })
    .map((_, i) => subMonths(today, 5 - i))
    .filter(d => d.getFullYear() > 2026 || (d.getFullYear() === 2026 && d.getMonth() >= 4));

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
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Dashboard Financeiro</h2>
          <p className="text-sm sm:text-base text-slate-400">Visão geral de receitas e inadimplência</p>
        </div>
      </header>

      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="p-1 group hover:border-slate-700 transition-colors duration-300 cursor-default">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-slate-400 uppercase tracking-widest">Receita Prevista</p>
                <Tooltip>
                  <TooltipTrigger type="button" className="focus:outline-none">
                    <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Soma do valor de todas as assinaturas ativas.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TrendingUp className="h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:scale-110" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expectedRevenue)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-1 group hover:border-emerald-500/50 transition-colors duration-300 cursor-default">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-emerald-400 uppercase tracking-widest">Recebido</p>
                <Tooltip>
                  <TooltipTrigger type="button" className="focus:outline-none">
                    <Info className="h-3.5 w-3.5 text-emerald-500/70 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total de pagamentos recebidos no mês atual.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <DollarSign className="h-5 w-5 text-emerald-400 transition-transform duration-200 ease-out group-hover:-translate-y-1 group-hover:scale-110" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receivedRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card className="p-1 border-rose-500/30 group hover:border-rose-500/70 transition-colors duration-300 cursor-default">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-rose-400 uppercase tracking-widest">Em Aberto</p>
                <Tooltip>
                  <TooltipTrigger type="button" className="focus:outline-none">
                    <Info className="h-3.5 w-3.5 text-rose-500/70 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total pendente de recebimento (Receita Prevista - Recebido).</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <AlertCircle className="h-5 w-5 text-rose-400 transition-transform duration-200 ease-out group-hover:-translate-y-1 group-hover:scale-110" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-rose-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(openRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card className="p-1 group hover:border-slate-700 transition-colors duration-300 cursor-default">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-slate-400 uppercase tracking-widest">Despesas</p>
                <Tooltip>
                  <TooltipTrigger type="button" className="focus:outline-none">
                    <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total de todas as despesas pagas cadastradas.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CreditCard className="h-5 w-5 text-slate-400 transition-transform duration-200 ease-out group-hover:-translate-y-1 group-hover:rotate-[8deg] group-hover:scale-110" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}
              </div>
            </CardContent>
          </Card>

          <Card className={`p-1 border group cursor-default transition-colors duration-300 ${realIncome >= 0 ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50' : 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/50'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <div className="flex items-center gap-1.5">
                <p className={`text-xs uppercase tracking-widest ${realIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Margem de Lucro</p>
                <Tooltip>
                  <TooltipTrigger type="button" className="focus:outline-none">
                    <Info className={`h-3.5 w-3.5 cursor-help ${realIncome >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Lucro líquido total (Recebido - Despesas Pagas).</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Activity className={`h-5 w-5 ${realIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'} transition-transform duration-200 ease-out group-hover:-translate-y-1 group-hover:scale-110`} />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={`text-2xl font-bold ${realIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(realIncome)}
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold flex items-center gap-2 text-white">Controle de Mensalidades</h3>
          <span className="text-xs text-slate-400 font-medium">Histórico de {monthList.length} meses</span>
        </div>

        <Card className="overflow-x-auto border-slate-800 p-0">
          <CardContent className="p-0 min-w-[800px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900/50 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Cliente</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs w-32">Ação</th>
                  {monthList.map(m => (
                    <th key={m.getTime()} className="px-4 py-4 font-medium uppercase tracking-wider text-xs text-center w-24">
                      {format(m, 'MMM', { locale: ptBR })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {activeSubs.map(sub => {
                  const isCurrentMonthPaid = sub.payments?.[currentMonthKey] || sub.paid;
                  const cPhone = getSubClientPhone(sub).replace(/\D/g, '');
                  const shouldMessage = !isCurrentMonthPaid && isTodayAfter10th;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-100">{getSubClientName(sub)}</p>
                        <p className="text-xs text-slate-500">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.monthlyValue)} 
                          {' • '}Dia {sub.dueDay}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {shouldMessage && cPhone && (
                          <a 
                            href={`https://wa.me/55${cPhone}?text=Olá! Vimos que sua mensalidade deste mês (vencimento dia ${sub.dueDay}) está pendente. Para manter o seu acesso, não esqueça de realizar o pagamento.`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 p-2 rounded-full transition-colors"
                            title="Cobrar via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                      {monthList.map(m => {
                        const mKey = format(m, 'yyyy-MM');
                        const isThisMonthPaid = sub.payments?.[mKey] || (mKey === currentMonthKey && sub.paid);
                        
                        return (
                          <td key={m.getTime()} className="px-4 py-4 text-center">
                            <button
                              onClick={() => togglePayment(sub, m)}
                              title={isThisMonthPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                              className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center transition-all ${
                                isThisMonthPaid 
                                  ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50' 
                                  : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                              }`}
                            >
                              {isThisMonthPaid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 opacity-50" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  )
                })}
                {activeSubs.length === 0 && (
                  <tr>
                    <td colSpan={2 + monthList.length} className="px-6 py-8 text-center text-slate-500">
                      Nenhuma assinatura cadastrada ou ativa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 mt-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold flex items-center gap-2 text-white">O que posso melhorar?</h3>
          <span className="text-xs text-slate-400 font-medium">Insights baseados no mês atual</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {openRevenue > 0 ? (
            <Card className="bg-rose-500/5 border-rose-500/20 p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-rose-400 mb-1">Recuperação de Inadimplência</h4>
                  <p className="text-xs text-slate-400">Você tem <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(openRevenue)}</strong> em aberto neste mês. Utilize os botões do WhatsApp na tabela acima para lembrar os clientes amigavelmente.</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="bg-emerald-500/5 border-emerald-500/20 p-4">
              <div className="flex gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-400 mb-1">Inadimplência Controlada</h4>
                  <p className="text-xs text-slate-400">Excelente! Todos os pagamentos do mês estão em dia. Considere oferecer descontos ou vantagens para pagamento antecipado em planos trimestrais ou semestrais.</p>
                </div>
              </div>
            </Card>
          )}

          {totalExpenses > (receivedRevenue * 0.7) ? (
            <Card className="bg-amber-500/5 border-amber-500/20 p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-500 mb-1">Atenção às Despesas</h4>
                  <p className="text-xs text-slate-400">Suas despesas representam uma alta porcentagem da sua receita ({receivedRevenue > 0 ? Math.round((totalExpenses / receivedRevenue) * 100) : 100}%). Revise seus custos variáveis para aumentar a margem de lucro.</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="bg-slate-800/40 border-slate-700/50 p-4">
              <div className="flex gap-3">
                <Activity className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-400 mb-1">Planejamento e Caixa</h4>
                  <p className="text-xs text-slate-400">Seus custos parecem dentro do controle. Aproveite a folga no fluxo de caixa para montar uma reserva de emergência para manutenções ou melhorias do espaço/serviços.</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="bg-purple-500/5 border-purple-500/20 p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-purple-400 mb-1">Crescimento de Clientes</h4>
                <p className="text-xs text-slate-400">Você tem <strong>{activeSubs.length}</strong> assinaturas ativas agora. Peça indicações para os clientes mais engajados para aumentar sua base de receita recorrente sem gastar com anúncios.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
