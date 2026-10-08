'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getExpenses, addExpense, deleteExpense, updateExpense } from '@/lib/data-store';
import { Expense } from '@/lib/types';
import { Plus, Trash2, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { PageHeader } from '@/components/PageHeader';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentViewMonth, setCurrentViewMonth] = useState(startOfMonth(new Date()));

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDateInput] = useState(''); // yyyy-mm-dd format for native date input

  const loadData = async () => {
    const data = await getExpenses();
    setExpenses(data.sort((a,b) => b.date - a.date));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleOpenDialog = () => {
    setDescription('');
    setAmount('');
    setDateInput(format(new Date(), 'yyyy-MM-dd'));
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return toast.error('Valor inválido');
    
    // Parse date (native input returns UTC midnight string, but users input local context)
    const [year, month, day] = date.split('-');
    const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();

    await addExpense({ description, amount: value, date: parsedDate, paid: false });
    toast.success('Despesa adicionada como pendente!');
    setIsDialogOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta despesa?')) {
      await deleteExpense(id);
      toast.success('Despesa removida!');
      loadData();
    }
  };

  const handleTogglePaid = async (expense: Expense) => {
    const newPaidStatus = !expense.paid;
    await updateExpense(expense.id, { paid: newPaidStatus });
    toast.success(newPaidStatus ? 'Despesa marcada como paga!' : 'Despesa marcada como pendente.');
    loadData();
  };

  const filterByMonth = (month: Date) => expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
  });

  const prevMonth = subMonths(currentViewMonth, 1);
  const monthExpenses = filterByMonth(currentViewMonth);
  const prevMonthExpenses = filterByMonth(prevMonth);

  const monthTotal = monthExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const monthPaidTotal = monthExpenses.filter(e => e.paid).reduce((acc, e) => acc + Number(e.amount), 0);
  const monthPendingTotal = monthExpenses.filter(e => !e.paid).reduce((acc, e) => acc + Number(e.amount), 0);

  const prevMonthTotal = prevMonthExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const prevMonthPaidTotal = prevMonthExpenses.filter(e => e.paid).reduce((acc, e) => acc + Number(e.amount), 0);

  const totalDiff = prevMonthTotal > 0 ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100 : null;
  const paidDiff  = prevMonthPaidTotal > 0 ? ((monthPaidTotal - prevMonthPaidTotal) / prevMonthPaidTotal) * 100 : null;

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const prevLabel = format(prevMonth, 'MMM', { locale: ptBR }).replace('.', '');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Despesas"
        subtitle="Registre custos operacionais do seu negócio."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button size="sm" onClick={handleOpenDialog} />}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova Despesa
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Despesa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" type="date" value={date} onChange={e => setDateInput(e.target.value)} required />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      {/* Month Navigation */}
      <div className="flex items-center justify-between panel-raised p-4 max-w-xs mx-auto sm:max-w-none sm:mx-0">
        <Button variant="outline" size="icon" onClick={() => setCurrentViewMonth(prev => subMonths(prev, 1))} className="bg-muted text-foreground hover:bg-muted/80 shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Competência</span>
          <span className="text-lg font-bold text-primary uppercase">
            {format(currentViewMonth, 'MMM yyyy', { locale: ptBR }).replace('.', '')}
          </span>
        </div>
        <Button variant="outline" size="icon" onClick={() => setCurrentViewMonth(prev => addMonths(prev, 1))} className="bg-muted text-foreground hover:bg-muted/80 shrink-0">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="panel-raised overflow-hidden"
      >
        <div className="grid grid-cols-3 divide-x divide-border">
          {[
            { label: 'Total', value: monthTotal, prev: prevMonthTotal, diff: totalDiff, color: 'var(--foreground)' },
            { label: 'Pago', value: monthPaidTotal, prev: prevMonthPaidTotal, diff: paidDiff, color: 'var(--success)' },
            { label: 'Pendente', value: monthPendingTotal, prev: null, diff: null, color: 'var(--warning)' },
          ].map(item => (
            <div key={item.label} className="px-3 py-4 sm:px-5 sm:py-5">
              <p className="label-xs">{item.label}</p>
              <p className="tabular text-[17px] sm:text-[22px] font-semibold leading-tight mt-1.5" style={{ color: item.color }}>
                {fmt(item.value)}
              </p>
              <div className="h-4 mt-1">
                {item.diff !== null && item.prev !== null ? (
                  <span className="tabular text-[11px] font-semibold"
                        style={{ color: item.diff > 0 ? 'var(--danger)' : item.diff < 0 ? 'var(--success)' : 'var(--muted-foreground)' }}>
                    {item.diff > 0 ? '+' : ''}{item.diff.toFixed(0)}% <span className="font-normal text-muted-foreground">vs {prevLabel}</span>
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="panel-raised overflow-hidden">
          <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-border">
            <p className="text-[14px] font-semibold text-foreground">Histórico</p>
          </div>

          {/* Mobile: lista de linhas, sem card dentro de card */}
          <div className="sm:hidden divide-y divide-border">
            {monthExpenses.length === 0 ? (
              <p className="text-center py-10 text-[13px] text-muted-foreground px-4">
                Nenhuma despesa em {format(currentViewMonth, 'MMMM yyyy', { locale: ptBR })}.
              </p>
            ) : monthExpenses.map(expense => (
              <div key={expense.id} className="row-hover px-4 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-foreground truncate">{expense.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11.5px] text-muted-foreground tabular">
                      {format(new Date(expense.date), 'dd/MM')}
                    </span>
                    <button onClick={() => handleTogglePaid(expense)} className={expense.paid ? 'pill-success' : 'pill-warning'}>
                      {expense.paid
                        ? <><CheckCircle2 className="h-3 w-3" /> Paga</>
                        : <><Clock className="h-3 w-3" /> Pendente</>
                      }
                    </button>
                  </div>
                </div>
                <span className="tabular text-[13px] font-medium text-foreground shrink-0">{fmt(expense.amount)}</span>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(expense.id)}>
                  <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
                </Button>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Data</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Descrição</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Status</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Valor</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthExpenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            Nenhuma despesa em {format(currentViewMonth, 'MMMM yyyy', { locale: ptBR })}.
                          </TableCell>
                        </TableRow>
                      ) : monthExpenses.map((expense, index) => (
                        <motion.tr
                          key={expense.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <TableCell className="whitespace-nowrap">{format(new Date(expense.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="font-medium whitespace-nowrap">{expense.description}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={`cursor-pointer ${expense.paid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}
                              onClick={() => handleTogglePaid(expense)}
                            >
                              {expense.paid
                                ? <span className="flex items-center gap-1 whitespace-nowrap"><CheckCircle2 className="h-3 w-3" /> Paga</span>
                                : <span className="flex items-center gap-1 whitespace-nowrap"><Clock className="h-3 w-3" /> Pendente</span>
                              }
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap">
                            <span className={expense.paid ? 'text-rose-400' : 'text-muted-foreground'}>
                              {fmt(expense.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-rose-400" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
