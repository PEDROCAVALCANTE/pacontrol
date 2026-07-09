'use client';

import { useEffect, useState } from 'react';
import { getClients, getSubscriptions, getExpenses, updateSubscription } from '@/lib/data-store';
import { Client, Expense, Subscription } from '@/lib/types';
import {
  TrendingUp, DollarSign, AlertCircle, CreditCard, Activity,
  Check, X, Info, Sun, Sunrise, Moon, Users, TrendingDown,
} from 'lucide-react';
import { format, startOfDay, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'motion/react';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { DashboardSkeleton } from '@/components/Skeleton';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function useGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: 'Bom dia',  Icon: Sunrise };
  if (h >= 12 && h < 18) return { text: 'Boa tarde', Icon: Sun    };
  return                         { text: 'Boa noite', Icon: Moon   };
}

function trendPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// ── Trend Badge ───────────────────────────────────────────────────────────────

function TrendBadge({ pct, prevLabel }: { pct: number | null; prevLabel: string }) {
  if (pct === null) return null;
  const up      = pct >= 0;
  const Icon    = up ? TrendingUp : TrendingDown;
  const color   = up ? '#10B981' : '#EF4444';
  const bgColor = up ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
  return (
    <Tooltip>
      <TooltipTrigger render={<button type="button" className="focus:outline-none" />}>
        <motion.div
          key={pct}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-1 rounded-full px-2 py-0.5"
          style={{ background: bgColor }}
        >
          <Icon className="w-3 h-3" style={{ color }} />
          <span className="text-[10px] font-semibold tabular" style={{ color }}>
            {up ? '+' : ''}{pct}%
          </span>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Comparado com {prevLabel}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  tooltip?: string;
  delay?: number;
  trend?: number | null;
  prevLabel?: string;
}

function KpiCard({ label, value, icon: Icon, color, tooltip, delay = 0, trend, prevLabel }: KpiCardProps) {
  const colorMap: Record<string, { text: string; icon: string }> = {
    orange:  { text: '#FF6A00', icon: 'rgba(255,106,0,0.15)'  },
    emerald: { text: '#10B981', icon: 'rgba(16,185,129,0.12)' },
    rose:    { text: '#EF4444', icon: 'rgba(239,68,68,0.12)'  },
    slate:   { text: '#8896A7', icon: 'rgba(92,106,126,0.12)' },
    blue:    { text: '#3B82F6', icon: 'rgba(59,130,246,0.12)' },
  };
  const c = colorMap[color] ?? colorMap.slate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
    >
      <div className="rounded-xl p-5 card-interactive h-full"
           style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: c.icon }}>
            <Icon className="w-4 h-4" style={{ color: c.text }} />
          </div>
          <div className="flex items-center gap-2">
            {trend !== undefined && trend !== null && prevLabel && (
              <TrendBadge pct={trend} prevLabel={prevLabel} />
            )}
            {tooltip && (
              <Tooltip>
                <TooltipTrigger render={<button type="button" className="focus:outline-none" />}>
                  <Info className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">{tooltip}</p></TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Value — animates when it changes */}
        <AnimatePresence mode="wait">
          <motion.p
            key={value}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="tabular text-xl font-semibold leading-tight"
            style={{ color: c.text }}
          >
            {value}
          </motion.p>
        </AnimatePresence>

        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ── Revenue Progress ──────────────────────────────────────────────────────────

function RevenueProgress({ received, expected, prevReceived, prevExpected, prevLabel }:
  { received: number; expected: number; prevReceived: number; prevExpected: number; prevLabel: string }) {
  const pct     = expected > 0 ? Math.min(100, Math.round((received / expected) * 100)) : 0;
  const prevPct = prevExpected > 0 ? Math.min(100, Math.round((prevReceived / prevExpected) * 100)) : 0;
  const open    = expected - received;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="rounded-xl p-5 card-interactive"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Coleta do Mês</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            <span style={{ color: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444' }}>{pct}%</span> recebido
          </p>
        </div>
        <div className="text-right">
          <AnimatePresence mode="wait">
            <motion.span
              key={pct}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-2xl font-bold tabular block"
              style={{ color: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444' }}
            >
              {pct}%
            </motion.span>
          </AnimatePresence>
          {prevPct > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{prevPct}% em {prevLabel}</p>
          )}
        </div>
      </div>

      {/* Current month bar */}
      <div className="h-2 w-full rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          key={pct}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: pct >= 80
              ? 'linear-gradient(90deg,#10B981,#34D399)'
              : pct >= 50
              ? 'linear-gradient(90deg,#F59E0B,#FCD34D)'
              : 'linear-gradient(90deg,#EF4444,#F87171)',
          }}
        />
      </div>

      {/* Previous month bar (ghost) */}
      {prevPct > 0 && (
        <div className="h-1 w-full rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="h-full rounded-full opacity-40"
               style={{ width: `${prevPct}%`, background: '#8896A7' }} />
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{fmt(received)}</span> recebido
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium" style={{ color: '#EF4444' }}>{fmt(open)}</span> pendente
        </p>
      </div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading]   = useState(true);
  const [clients, setClients]   = useState<Client[]>([]);
  const [subs, setSubs]         = useState<Subscription[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { text: greet, Icon: GreetIcon } = useGreeting();

  const loadData = async () => {
    const [c, s, e] = await Promise.all([getClients(), getSubscriptions(), getExpenses()]);
    setClients(c);
    setSubs(s);
    setExpenses(e);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <DashboardSkeleton />;

  // ── Dates ────────────────────────────────────────────────
  const today           = startOfDay(new Date());
  const currentMonthKey = format(today, 'yyyy-MM');
  const prevMonth       = subMonths(today, 1);
  const prevMonthKey    = format(prevMonth, 'yyyy-MM');
  const prevMonthLabel  = format(prevMonth, 'MMM/yy', { locale: ptBR });
  const monthLabel      = format(today, "MMMM 'de' yyyy", { locale: ptBR });
  const isTodayAfter10  = today.getDate() > 10;

  const getSubClientName  = (sub: Subscription) =>
    sub.clientName ?? clients.find(c => c.id === sub.clientId)?.name ?? 'Desconhecido';
  const getSubClientPhone = (sub: Subscription) =>
    sub.clientPhone ?? clients.find(c => c.id === sub.clientId)?.phone ?? '';

  // ── Helpers ───────────────────────────────────────────────
  const expensesByMonth = (month: Date) => {
    const m = month.getMonth(), y = month.getFullYear();
    return expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === y; });
  };

  // ── Current month calculations ───────────────────────────
  const activeSubs      = subs.filter(s => s.status === 'active');
  const expectedRevenue = activeSubs.reduce((a, s) => a + Number(s.monthlyValue), 0);
  const isPaidCurrentMonth = (s: Subscription) =>
    s.payments ? s.payments[currentMonthKey] === true : s.paid === true;

  const receivedRevenue   = activeSubs.filter(isPaidCurrentMonth).reduce((a, s) => a + Number(s.monthlyValue), 0);
  const openRevenue       = expectedRevenue - receivedRevenue;

  const currMonthExp      = expensesByMonth(today);
  const totalExpenses     = currMonthExp.reduce((a, e) => a + Number(e.amount), 0);
  const totalExpensesPaid = currMonthExp.filter(e => e.paid).reduce((a, e) => a + Number(e.amount), 0);
  const totalExpensesPend = currMonthExp.filter(e => !e.paid).reduce((a, e) => a + Number(e.amount), 0);
  const realIncome        = receivedRevenue - totalExpensesPaid;

  // ── Previous month calculations ───────────────────────────
  const prevReceived      = activeSubs.filter(s => s.payments?.[prevMonthKey]).reduce((a, s) => a + Number(s.monthlyValue), 0);
  const prevMonthExp      = expensesByMonth(prevMonth);
  const prevTotalExp      = prevMonthExp.reduce((a, e) => a + Number(e.amount), 0);
  const prevTotalExpPaid  = prevMonthExp.filter(e => e.paid).reduce((a, e) => a + Number(e.amount), 0);
  const prevIncome        = prevReceived - prevTotalExpPaid;

  // ── Trends ────────────────────────────────────────────────
  const trendReceived   = trendPct(receivedRevenue, prevReceived);
  const trendIncome     = trendPct(realIncome, prevIncome);
  const trendOpen       = trendPct(openRevenue, expectedRevenue - prevReceived);
  const trendExpTotal   = trendPct(totalExpenses, prevTotalExp);
  const trendExpPaid    = trendPct(totalExpensesPaid, prevTotalExpPaid);

  // ── Toggle payment ────────────────────────────────────────
  const togglePayment = async (sub: Subscription, monthDate: Date) => {
    const mKey   = format(monthDate, 'yyyy-MM');
    const isPaid = sub.payments
      ? sub.payments[mKey] === true
      : (mKey === currentMonthKey ? sub.paid === true : false);
    const newPay = { ...(sub.payments ?? {}), [mKey]: !isPaid };
    await updateSubscription(sub.id, { payments: newPay });
    toast.success(!isPaid ? 'Marcado como pago ✓' : 'Pagamento removido');
    loadData();
  };

  return (
    <TooltipProvider>
      <div className="space-y-7">

        {/* ── Header ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-start justify-between gap-3"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GreetIcon className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-muted-foreground">{greet}, Pedro &amp; Angra</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">Visão Geral</h1>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">{monthLabel}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground shrink-0">
            <Users className="w-3.5 h-3.5" />
            <span><b className="text-foreground">{activeSubs.length}</b> <span className="hidden sm:inline">assinaturas </span>ativas</span>
          </div>
        </motion.div>

        {/* ── KPI Grid — Receitas ─────────────────────────────── */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Receitas</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Previsto" value={fmt(expectedRevenue)}
              icon={TrendingUp} color="slate" delay={0.00}
              tooltip="Soma de todas as assinaturas ativas"
            />
            <KpiCard
              label="Recebido" value={fmt(receivedRevenue)}
              icon={DollarSign} color="emerald" delay={0.06}
              tooltip="Pagamentos recebidos neste mês"
              trend={trendReceived} prevLabel={prevMonthLabel}
            />
            <KpiCard
              label="Em Aberto" value={fmt(openRevenue)}
              icon={AlertCircle} color="rose" delay={0.12}
              tooltip="Total ainda pendente"
              trend={trendOpen !== null ? -trendOpen : null} prevLabel={prevMonthLabel}
            />
            <KpiCard
              label="Lucro Líquido" value={fmt(realIncome)}
              icon={Activity} color="emerald" delay={0.18}
              tooltip="Recebido menos despesas pagas"
              trend={trendIncome} prevLabel={prevMonthLabel}
            />
            <RevenueProgress
              received={receivedRevenue} expected={expectedRevenue}
              prevReceived={prevReceived} prevExpected={expectedRevenue}
              prevLabel={prevMonthLabel}
            />
          </div>
        </div>

        {/* ── KPI Grid — Despesas ──────────────────────────────── */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Despesas</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KpiCard
              label="Total Despesas" value={fmt(totalExpenses)}
              icon={CreditCard} color="blue" delay={0.00}
              tooltip="Soma de todas as despesas do mês"
              trend={trendExpTotal !== null ? -trendExpTotal : null} prevLabel={prevMonthLabel}
            />
            <KpiCard
              label="Despesas Pagas" value={fmt(totalExpensesPaid)}
              icon={Check} color="rose" delay={0.06}
              tooltip="Despesas já quitadas neste mês"
              trend={trendExpPaid !== null ? -trendExpPaid : null} prevLabel={prevMonthLabel}
            />
            <KpiCard
              label="Desp. Pendentes" value={fmt(totalExpensesPend)}
              icon={AlertCircle} color="slate" delay={0.12}
              tooltip="Despesas ainda não pagas"
            />
          </div>
        </div>

        {/* ── Payments Table ───────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Histórico de Recebimentos</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Comparando com <span className="text-foreground font-medium capitalize">{prevMonthLabel}</span>
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {format(today, 'MMM yyyy', { locale: ptBR })}
            </span>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {activeSubs.length === 0 && (
              <p className="text-center py-8 text-sm text-muted-foreground">Nenhuma assinatura ativa cadastrada.</p>
            )}
            {activeSubs.map((sub, i) => {
              const isPaidCurrent = isPaidCurrentMonth(sub);
              const isPaidPrev    = !!(sub.payments?.[prevMonthKey]);
              const cPhone        = getSubClientPhone(sub).replace(/\D/g, '');
              const canSend       = !isPaidCurrent && isTodayAfter10 && !!cPhone;
              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground text-[13px]">{getSubClientName(sub)}</p>
                      <p className="text-xs text-muted-foreground">Dia {sub.dueDay} · {fmt(sub.monthlyValue)}</p>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={isPaidCurrent ? 'paid' : 'pending'}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className={isPaidCurrent ? 'pill-success' : 'pill-danger'}
                      >
                        {isPaidCurrent ? '● Pago' : '● Pendente'}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="text-[11px] text-muted-foreground">
                      {format(prevMonth, 'MMM', { locale: ptBR })}: <span className={isPaidPrev ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>{isPaidPrev ? 'Pago' : 'Pendente'}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {canSend && <WhatsAppButton phone={cPhone} clientName={getSubClientName(sub)} dueDay={sub.dueDay} />}
                      <button
                        onClick={() => togglePayment(sub, today)}
                        title={isPaidCurrent ? 'Desmarcar' : 'Marcar como pago'}
                        className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all ${
                          isPaidCurrent
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
                            : 'bg-transparent border-border text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-500'
                        }`}
                      >
                        {isPaidCurrent
                          ? <Check className="w-4 h-4" strokeWidth={2.5} />
                          : <X     className="w-4 h-4" strokeWidth={2.5} />
                        }
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl overflow-hidden"
               style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="px-5 py-3.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                    <th className="px-5 py-3.5 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {format(prevMonth, 'MMM', { locale: ptBR })} ←
                    </th>
                    <th className="px-5 py-3.5 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {format(today, 'MMM', { locale: ptBR })} (atual)
                    </th>
                    <th className="px-5 py-3.5 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSubs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground text-sm">
                        Nenhuma assinatura ativa cadastrada.
                      </td>
                    </tr>
                  )}
                  {activeSubs.map((sub, i) => {
                    const isPaidCurrent = isPaidCurrentMonth(sub);
                    const isPaidPrev    = !!(sub.payments?.[prevMonthKey]);
                    const cPhone        = getSubClientPhone(sub).replace(/\D/g, '');
                    const canSend       = !isPaidCurrent && isTodayAfter10 && !!cPhone;

                    return (
                      <motion.tr
                        key={sub.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="group transition-colors hover:bg-white/[0.02]"
                        style={{ borderBottom: i < activeSubs.length - 1 ? '1px solid var(--border)' : 'none' }}
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground text-[13px]">{getSubClientName(sub)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Dia {sub.dueDay}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="tabular text-sm font-medium text-foreground">{fmt(sub.monthlyValue)}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={isPaidPrev ? 'pill-success' : 'pill-muted'}>
                            {isPaidPrev ? '● Pago' : '● Pendente'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={isPaidCurrent ? 'paid' : 'pending'}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                className={isPaidCurrent ? 'pill-success' : 'pill-danger'}
                              >
                                {isPaidCurrent ? '● Pago' : '● Pendente'}
                              </motion.span>
                            </AnimatePresence>
                            <button
                              onClick={() => togglePayment(sub, today)}
                              title={isPaidCurrent ? 'Desmarcar' : 'Marcar como pago'}
                              className={`w-7 h-7 flex items-center justify-center rounded-full border transition-all ${
                                isPaidCurrent
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
                                  : 'bg-transparent border-border text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-500'
                              }`}
                            >
                              {isPaidCurrent
                                ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                : <X     className="w-3.5 h-3.5" strokeWidth={2.5} />
                              }
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {canSend && (
                            <WhatsAppButton phone={cPhone} clientName={getSubClientName(sub)} dueDay={sub.dueDay} />
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </TooltipProvider>
  );
}
