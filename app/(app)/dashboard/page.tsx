'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getClients, getSubscriptions, getExpenses } from '@/lib/data-store';
import { Client, Expense, Subscription } from '@/lib/types';
import { DollarSign, Users, AlertCircle, TrendingUp, CreditCard, Activity } from 'lucide-react';
import { format, isAfter, setDate, startOfDay, endOfMonth, startOfMonth, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    async function loadData() {
      const [c, s, e] = await Promise.all([getClients(), getSubscriptions(), getExpenses()]);
      setClients(c);
      setSubs(s);
      setExpenses(e);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div>Carregando dashboard...</div>;

  const today = startOfDay(new Date());
  
  // Calculations
  const activeSubs = subs.filter(s => s.status === 'active');
  const activeClientsCount = clients.filter(c => c.status === 'active').length;

  const expectedRevenue = activeSubs.reduce((acc, sub) => acc + sub.monthlyValue, 0);
  const receivedRevenue = activeSubs.filter(s => s.paid).reduce((acc, sub) => acc + sub.monthlyValue, 0);
  const openRevenue = expectedRevenue - receivedRevenue;

  const currentMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return isAfter(d, startOfMonth(today)) && isBefore(d, endOfMonth(today));
  }).reduce((acc, e) => acc + e.amount, 0);

  const realIncome = receivedRevenue - currentMonthExpenses;

  const lateSubs = activeSubs.filter(s => {
    const dueDateThisMonth = setDate(today, s.dueDay);
    return !s.paid && isBefore(dueDateThisMonth, today);
  });

  const soonSubs = activeSubs.filter(s => {
    const dueDateThisMonth = setDate(today, s.dueDay);
    return !s.paid && !isBefore(dueDateThisMonth, today) && (dueDateThisMonth.getTime() - today.getTime()) <= 7 * 24 * 60 * 60 * 1000;
  });

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Desconhecido';

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Dashboard Financeiro</h2>
          <p className="text-sm sm:text-base text-slate-400">Visão geral de receitas e inadimplência</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="p-1">
          <CardHeader className="flex flex-col items-start space-y-0 p-4 pb-2">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Receita Prevista</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expectedRevenue)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-1">
          <CardHeader className="flex flex-col items-start space-y-0 p-4 pb-2">
            <p className="text-xs text-emerald-400 uppercase tracking-widest mb-2">Recebido</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receivedRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className="p-1 border-rose-500/30">
          <CardHeader className="flex flex-col items-start space-y-0 p-4 pb-2">
            <p className="text-xs text-rose-400 uppercase tracking-widest mb-2">Em Aberto</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-rose-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(openRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className="p-1">
          <CardHeader className="flex flex-col items-start space-y-0 p-4 pb-2">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Despesas</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentMonthExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card className={`p-1 border ${realIncome >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
          <CardHeader className="flex flex-col items-start space-y-0 p-4 pb-2">
            <p className={`text-xs uppercase tracking-widest mb-2 ${realIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Margem de Lucro</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={`text-2xl font-bold ${realIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(realIncome)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold flex items-center gap-2 text-white">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span> Inadimplentes
            </h3>
            <span className="text-xs text-rose-400 font-medium">{lateSubs.length} Clientes em atraso</span>
          </div>

          <Card className="overflow-hidden border-rose-500/20 p-0">
            <CardContent className="p-0">
              {lateSubs.length === 0 ? (
                <p className="text-sm text-slate-500 p-6 text-center">Nenhum cliente em atraso.</p>
              ) : (
                <div className="divide-y divide-slate-800/50">
                  {lateSubs.map(sub => (
                    <div key={sub.id} className="overdue-highlight hover:bg-rose-900/10 transition-colors flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-rose-100">{getClientName(sub.clientId)}</p>
                        <p className="text-xs text-slate-500 text-rose-400/60">Venceu dia {sub.dueDay}</p>
                      </div>
                      <div className="font-mono text-rose-100">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.monthlyValue)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold flex items-center gap-2 text-white">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span> Próximos Vencimentos
            </h3>
            <span className="text-xs text-slate-500">Próximos 7 dias</span>
          </div>

          <Card className="overflow-hidden p-0">
            <CardContent className="p-0">
              {soonSubs.length === 0 ? (
                <p className="text-sm text-slate-500 p-6 text-center">Nenhuma assinatura vencendo nos próximos 7 dias.</p>
              ) : (
                <div className="divide-y divide-slate-800/50">
                  {soonSubs.map(sub => (
                    <div key={sub.id} className="hover:bg-slate-800/30 transition-colors flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-slate-200">{getClientName(sub.clientId)}</p>
                        <p className="text-xs text-slate-500">Vence dia {sub.dueDay}</p>
                      </div>
                      <div className="font-mono text-slate-200">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.monthlyValue)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
