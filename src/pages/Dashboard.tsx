'use client';

import { useEffect, useState } from 'react';
import { getClients, getSubscriptions, getExpenses, updateSubscription } from '@/lib/data-store';
import { Client, Expense, Subscription } from '@/lib/types';
import {
  TrendingUp, DollarSign, AlertCircle, CreditCard, Activity,
  Check, X, Info, Sun, Sunrise, Moon, Users,
} from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'motion/react';
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

// ── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;          // tailwind color class prefix e.g. "emerald" | "rose" | "orange" | "slate"
  tooltip?: string;
  delay?: number;
}

function KpiCard({ label, value, icon: Icon, color, tooltip, delay = 0 }: KpiCardProps) {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    orange:  { bg: 'rgba(255,106,0,0.1)',    text: '#FF6A00',  icon: 'rgba(255,106,0,0.15)'   },
    emerald: { bg: 'rgba(16,185,129,0.08)',  text: '#10B981',  icon: 'rgba(16,185,129,0.12)'  },
    rose:    { bg: 'rgba(239,68,68,0.08)',   text: '#EF4444',  icon: 'rgba(239,68,68,0.12)'   },
    slate:   { bg: 'rgba(92,106,126,0.08)',  text: '#8896A7',  icon: 'rgba(92,106,126,0.12)'  },
    blue:    { bg: 'rgba(59,130,246,0.08)',  text: '#3B82F6',  icon: 'rgba(59,130,246,0.12)'  },
  };
  const c = colorMap[color] ?? colorMap.slate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
    >
      <div
        className="rounded-xl p-5 card-interactive h-full"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: c.icon }}>
            <Icon className="w-4 h-4" style={{ color: c.text }} />
          </div>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger render={<button type="button" className="focus:outline-none" />}>
                <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">{tooltip}</p></TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="tabular text-xl font-semibold text-foreground leading-tight" style={{ color: c.text }}>{value}</p>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ── Revenue Progress ──────────────────────────────────────────────────────────

function RevenueProgress({ received, expected }: { received: number; expected: number }) {
  const pct = expected > 0 ? Math.min(100, Math.round((received / expected) * 100)) : 0;
  const open = expected - received;

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
            <span style={{ color: '#10B981' }}>{pct}%</span> recebido
          </p>
        </div>
        <span className="text-2xl font-bold tabular" style={{ color: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444' }}>
          {pct}%
        </span>
      </div>

      {/* Track */}
      <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: pct >= 80
              ? 'linear-gradient(90deg, #10B981, #34D399)'
              : pct >= 50
              ? 'linear-gradient(90deg, #F59E0B, #FCD34D)'
              : 'linear-gradient(90deg, #EF4444, #F87171)',
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-2.5">
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

  const today          = startOfDay(new Date());
  const currentMonthKey = format(today, 'yyyy-MM');
  const monthLabel     = format(today, "MMMM 'de' yyyy", { locale: ptBR });
  const isTodayAfter10 = today.getDate() > 10;

  const getSubClientName  = (sub: Subscription) =>
    sub.clientName ?? clients.find(c => c.id === sub.clientId)?.name ?? 'Desconhecido';
  const getSubClientPhone = (sub: Subscription) =>
    sub.clientPhone ?? clients.find(c => c.id === sub.clientId)?.phone ?? '';

  // ── Calculations ────────────────────────────────
  const activeSubs     = subs.filter(s => s.status === 'active');
  const expectedRevenue = activeSubs.reduce((a, s) => a + Number(s.monthlyValue), 0);
  const receivedRevenue = activeSubs
    .filter(s => s.payments?.[currentMonthKey] || s.paid)
    .reduce((a, s) => a + Number(s.monthlyValue), 0);
  const openRevenue    = expectedRevenue - receivedRevenue;
  const totalExpenses  = expenses.filter(e => e.paid).reduce((a, e) => a + Number(e.amount), 0);
  const realIncome     = receivedRevenue - totalExpenses;

  const togglePayment = async (sub: Subscription, monthDate: Date) => {
    const mKey    = format(monthDate, 'yyyy-MM');
    const isPaid  = sub.payments?.[mKey] || (mKey === currentMonthKey ? sub.paid : false);
    const newPay  = { ...(sub.payments ?? {}), [mKey]: !isPaid };
    const legacy  = mKey === currentMonthKey ? { paid: !isPaid } : {};
    await updateSubscription(sub.id, { payments: newPay, ...legacy });
    toast.success(!isPaid ? 'Marcado como pago ✓' : 'Pagamento removido');
    loadData();
  };

  return (
    <TooltipProvider>
      <div className="space-y-7">

        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GreetIcon className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-muted-foreground">{greet}, Pedro &amp; Angra</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Visão Geral</h1>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">{monthLabel}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span><b className="text-foreground">{activeSubs.length}</b> assinaturas ativas</span>
          </div>
        </motion.div>

        {/* ── KPI Grid + Progress ────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-1">
            <KpiCard label="Previsto"    value={fmt(expectedRevenue)} icon={TrendingUp}   color="slate"   tooltip="Soma de todas as assinaturas ativas"            delay={0.00} />
          </div>
          <div className="lg:col-span-1">
            <KpiCard label="Recebido"    value={fmt(receivedRevenue)} icon={DollarSign}   color="emerald" tooltip="Pagamentos recebidos neste mês"                  delay={0.06} />
          </div>
          <div className="lg:col-span-1">
            <KpiCard label="Em Aberto"   value={fmt(openRevenue)}     icon={AlertCircle}  color="rose"    tooltip="Total ainda pendente de recebimento"             delay={0.12} />
          </div>
          <div className="lg:col-span-1">
            <KpiCard label="Despesas"    value={fmt(totalExpenses)}   icon={CreditCard}   color="blue"    tooltip="Total de despesas pagas cadastradas"              delay={0.18} />
          </div>
          <div className="lg:col-span-1">
            <KpiCard label="Lucro Líquido" value={fmt(realIncome)}    icon={Activity}     color="emerald" tooltip="Recebido menos despesas pagas"                   delay={0.24} />
          </div>
          <div className="lg:col-span-1">
            <RevenueProgress received={receivedRevenue} expected={expectedRevenue} />
          </div>
        </div>

        {/* ── Payments Table ─────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Histórico de Recebimentos</h2>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {format(today, 'MMM yyyy', { locale: ptBR })}
            </span>
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="px-5 py-3.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                    <th className="px-5 py-3.5 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pago?</th>
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
                    const isPaid  = !!(sub.payments?.[currentMonthKey] || sub.paid);
                    const cPhone  = getSubClientPhone(sub).replace(/\D/g, '');
                    const canSend = !isPaid && isTodayAfter10 && !!cPhone;

                    return (
                      <motion.tr
                        key={sub.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="group transition-colors hover:bg-white/[0.02]"
                        style={{ borderBottom: i < activeSubs.length - 1 ? '1px solid var(--border)' : 'none' }}
                      >
                        {/* Cliente */}
                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground text-[13px]">{getSubClientName(sub)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Dia {sub.dueDay}</p>
                        </td>
                        {/* Valor */}
                        <td className="px-5 py-4">
                          <span className="tabular text-sm font-medium text-foreground">{fmt(sub.monthlyValue)}</span>
                        </td>
                        {/* Status pill */}
                        <td className="px-5 py-4 text-center">
                          <span className={isPaid ? 'pill-success' : 'pill-danger'}>
                            {isPaid ? '● Pago' : '● Pendente'}
                          </span>
                        </td>
                        {/* Toggle */}
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => togglePayment(sub, today)}
                            title={isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                            className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full border transition-all ${
                              isPaid
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
                                : 'bg-transparent border-border text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-500'
                            }`}
                          >
                            {isPaid
                              ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                              : <X     className="w-3.5 h-3.5" strokeWidth={2.5} />
                            }
                          </button>
                        </td>
                        {/* WhatsApp */}
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
