'use client';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClients, getSubscriptions, getExpenses, updateSubscription } from '@/lib/data-store';
import { Client, Expense, Subscription } from '@/lib/types';
import { Check, ArrowRight, Sun, Sunrise, Moon, TrendingUp, TrendingDown } from 'lucide-react';
import { format, startOfDay, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { DashboardSkeleton } from '@/components/Skeleton';
import { daysLateFor, sendWhatsApp, subClientName, subClientPhone, thankYouMessage } from '@/lib/whatsapp';

const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function useGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: 'Bom dia', Icon: Sunrise };
  if (h >= 12 && h < 18) return { text: 'Boa tarde', Icon: Sun };
  return { text: 'Boa noite', Icon: Moon };
}

function trendPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// ── Número da faixa superior ─────────────────────────────────────────────────

function Metric({ label, value, hint, tone = 'default', delta }: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'success' | 'danger';
  delta?: number | null;
}) {
  const color = tone === 'success' ? 'var(--success)' : tone === 'danger' ? 'var(--danger)' : 'var(--foreground)';
  return (
    <div className="px-5 py-4 sm:px-6 sm:py-5">
      <p className="label-xs">{label}</p>
      <p className="tabular text-[19px] sm:text-[26px] font-semibold leading-tight mt-1.5" style={{ color }}>
        {value}
      </p>
      <div className="flex items-center gap-1.5 mt-1 h-4">
        {delta !== undefined && delta !== null && (
          <>
            {delta >= 0
              ? <TrendingUp className="w-3 h-3" style={{ color: 'var(--success)' }} />
              : <TrendingDown className="w-3 h-3" style={{ color: 'var(--danger)' }} />}
            <span className="tabular text-[11px] font-semibold"
                  style={{ color: delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {delta >= 0 ? '+' : ''}{delta}%
            </span>
          </>
        )}
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

// ── Linha de cliente ─────────────────────────────────────────────────────────

function ClientRow({ name, dueDay, value, phone, lateDays, paying, onPay }: {
  name: string;
  dueDay: number;
  value: number;
  phone: string;
  lateDays: number;
  paying: boolean;
  onPay: () => void;
}) {
  const status = lateDays > 0
    ? { text: `${lateDays}d em atraso`, color: 'var(--danger)' }
    : lateDays === 0
      ? { text: 'vence hoje', color: 'var(--warning)' }
      : { text: `dia ${dueDay}`, color: 'var(--muted-foreground)' };

  return (
    <div className="row-hover flex items-center gap-3 px-4 sm:px-6 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-foreground truncate">{name}</p>
        <p className="text-[11.5px] mt-0.5" style={{ color: status.color }}>{status.text}</p>
      </div>

      <span className="tabular text-[13px] font-medium text-foreground shrink-0">{brl(value)}</span>

      <div className="flex items-center gap-1.5 shrink-0">
        {phone && lateDays >= 0 && (
          <WhatsAppButton phone={phone} clientName={name} dueDay={dueDay} value={value} />
        )}
        <button
          onClick={onPay}
          disabled={paying}
          title="Marcar como pago"
          className="inline-flex items-center justify-center w-8 h-8 rounded-[10px] border border-border
                     text-muted-foreground transition-colors hover:text-[var(--success)]
                     hover:border-[var(--success)] disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
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

  const today = startOfDay(new Date());
  const monthKey = format(today, 'yyyy-MM');
  const prevMonth = subMonths(today, 1);
  const prevKey = format(prevMonth, 'yyyy-MM');
  const prevLabel = format(prevMonth, 'MMM', { locale: ptBR }).replace('.', '');
  const monthLabel = format(today, "MMMM 'de' yyyy", { locale: ptBR });

  const isPaid = (s: Subscription, key: string) =>
    s.payments ? s.payments[key] === true : (key === monthKey ? s.paid === true : false);

  const expensesOf = (month: Date) => {
    const m = month.getMonth(), y = month.getFullYear();
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === m && d.getFullYear() === y;
    });
  };

  const active = subs.filter(s => s.status === 'active');
  const expected = active.reduce((a, s) => a + Number(s.monthlyValue), 0);
  const received = active.filter(s => isPaid(s, monthKey)).reduce((a, s) => a + Number(s.monthlyValue), 0);
  const open = expected - received;

  const monthExp = expensesOf(today);
  const expTotal = monthExp.reduce((a, e) => a + Number(e.amount), 0);
  const expPaid = monthExp.filter(e => e.paid).reduce((a, e) => a + Number(e.amount), 0);
  const expPending = expTotal - expPaid;
  const profit = received - expPaid;

  const prevReceived = active.filter(s => isPaid(s, prevKey)).reduce((a, s) => a + Number(s.monthlyValue), 0);
  const prevExpPaid = expensesOf(prevMonth).filter(e => e.paid).reduce((a, e) => a + Number(e.amount), 0);
  const prevProfit = prevReceived - prevExpPaid;

  const pct = expected > 0 ? Math.min(100, Math.round((received / expected) * 100)) : 0;
  const prevPct = expected > 0 ? Math.min(100, Math.round((prevReceived / expected) * 100)) : 0;

  const unpaid = active.filter(s => !isPaid(s, monthKey));
  const withLate = unpaid.map(s => ({ sub: s, late: daysLateFor(s.dueDay) }));
  const toCharge = withLate.filter(x => x.late >= 0).sort((a, b) => b.late - a.late);
  const upcoming = withLate.filter(x => x.late < 0).sort((a, b) => a.sub.dueDay - b.sub.dueDay);
  const paidCount = active.length - unpaid.length;

  const markPaid = async (sub: Subscription) => {
    if (payingId) return;
    setPayingId(sub.id);
    try {
      const payments = { ...(sub.payments ?? {}), [monthKey]: true };
      await updateSubscription(sub.id, { payments, lastPaymentDate: Date.now() });
      toast.success('Pagamento confirmado');

      const phone = subClientPhone(sub, clients);
      if (phone) {
        const name = subClientName(sub, clients);
        sendWhatsApp(phone, thankYouMessage(name, sub.monthlyValue, today))
          .then(() => toast.success(`Obrigado enviado para ${name}`))
          .catch(err => toast.error(`Obrigado não enviado: ${err instanceof Error ? err.message : 'erro'}`));
      }
      await loadData();
    } catch {
      toast.error('Erro ao confirmar pagamento.');
    } finally {
      setPayingId(null);
    }
  };

  const barColor = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Cabeçalho */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2">
          <GreetIcon className="w-3.5 h-3.5 text-primary" />
          <span className="text-[13px] text-muted-foreground">{greet}, Pedro e Angra</span>
        </div>
        <div className="flex items-end justify-between gap-4 mt-1">
          <h1 className="text-[26px] sm:text-[32px] font-semibold text-foreground capitalize leading-none">
            {monthLabel}
          </h1>
          <span className="text-[11.5px] text-muted-foreground shrink-0 pb-1">
            <b className="tabular text-foreground">{active.length}</b> ativas
            {paidCount > 0 && <> · <b className="tabular text-foreground">{paidCount}</b> pagas</>}
          </span>
        </div>
      </motion.header>

      {/* Números do mês + coleta */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="panel-raised overflow-hidden"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
          <Metric
            label="Recebido" value={brl(received)} tone="success"
            delta={trendPct(received, prevReceived)} hint={`vs ${prevLabel}`}
          />
          <Metric
            label="Em aberto" value={brl(open)} tone={open > 0 ? 'danger' : 'default'}
            hint={unpaid.length > 0 ? `${unpaid.length} cliente${unpaid.length > 1 ? 's' : ''}` : 'tudo pago'}
          />
          <Metric
            label="Lucro" value={brl(profit)}
            delta={trendPct(profit, prevProfit)} hint={`vs ${prevLabel}`}
          />
          <Metric
            label="Despesas" value={brl(expTotal)}
            hint={expPending > 0 ? `${brl(expPending)} pendente` : 'tudo quitado'}
          />
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-border">
          <div className="flex items-baseline justify-between mb-2">
            <p className="label-xs">Coleta do mês</p>
            <p className="text-[11.5px] text-muted-foreground">
              <span className="tabular font-semibold text-foreground">{brl(received)}</span> de{' '}
              <span className="tabular">{brl(expected)}</span>
            </p>
          </div>
          <div className="relative h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: barColor }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="tabular text-[11px] font-semibold" style={{ color: barColor }}>{pct}%</span>
            {prevPct > 0 && (
              <span className="text-[11px] text-muted-foreground">
                <span className="tabular">{prevPct}%</span> em {prevLabel}
              </span>
            )}
          </div>
        </div>
      </motion.section>

      {/* Cobrar hoje */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h2 className="text-[15px] font-semibold text-foreground">
            Cobrar hoje {toCharge.length > 0 && <span className="tabular text-muted-foreground font-medium">({toCharge.length})</span>}
          </h2>
          <Link to="/subscriptions" className="text-[12px] text-primary font-medium inline-flex items-center gap-1 hover:underline">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="panel divide-y divide-border overflow-hidden">
          {toCharge.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[13.5px] font-medium text-foreground">Nada a cobrar hoje.</p>
              <p className="text-[12px] text-muted-foreground mt-1">
                {unpaid.length === 0 ? 'Todas as assinaturas do mês estão pagas.' : 'Os próximos vencimentos aparecem abaixo.'}
              </p>
            </div>
          ) : toCharge.map(({ sub, late }) => (
            <ClientRow
              key={sub.id}
              name={subClientName(sub, clients)}
              dueDay={sub.dueDay}
              value={Number(sub.monthlyValue)}
              phone={subClientPhone(sub, clients)}
              lateDays={late}
              paying={payingId === sub.id}
              onPay={() => markPaid(sub)}
            />
          ))}
        </div>
      </motion.section>

      {/* Próximos vencimentos */}
      {upcoming.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-[15px] font-semibold text-foreground mb-3 px-1">
            Próximos vencimentos <span className="tabular text-muted-foreground font-medium">({upcoming.length})</span>
          </h2>
          <div className="panel divide-y divide-border overflow-hidden">
            {upcoming.map(({ sub, late }) => (
              <ClientRow
                key={sub.id}
                name={subClientName(sub, clients)}
                dueDay={sub.dueDay}
                value={Number(sub.monthlyValue)}
                phone={subClientPhone(sub, clients)}
                lateDays={late}
                paying={payingId === sub.id}
                onPay={() => markPaid(sub)}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Despesas */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Link to="/expenses" className="panel row-hover flex items-center justify-between px-5 sm:px-6 py-4">
          <div>
            <p className="label-xs">Despesas do mês</p>
            <p className="tabular text-[17px] font-semibold text-foreground mt-1">{brl(expTotal)}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[11.5px] text-muted-foreground">pagas</p>
              <p className="tabular text-[13px] font-medium text-foreground">{brl(expPaid)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11.5px] text-muted-foreground">pendentes</p>
              <p className="tabular text-[13px] font-medium" style={{ color: expPending > 0 ? 'var(--warning)' : 'var(--foreground)' }}>
                {brl(expPending)}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>
      </motion.section>

    </div>
  );
}
