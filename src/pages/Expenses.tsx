'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentViewMonth.getMonth() && d.getFullYear() === currentViewMonth.getFullYear();
  });

  const monthPaidTotal = monthExpenses.filter(e => e.paid).reduce((acc, e) => acc + Number(e.amount), 0);
  const monthPendingTotal = monthExpenses.filter(e => !e.paid).reduce((acc, e) => acc + Number(e.amount), 0);

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
      <div className="flex items-center justify-between glass-panel p-4 rounded-[1.5rem] shadow-lg">
        <Button variant="outline" size="icon" onClick={() => setCurrentViewMonth(prev => subMonths(prev, 1))} className="bg-muted text-foreground hover:bg-muted/80">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Competência</span>
          <span className="text-lg font-bold text-primary uppercase">
            {format(currentViewMonth, 'MMM yyyy', { locale: ptBR }).replace('.', '')}
          </span>
        </div>
        <Button variant="outline" size="icon" onClick={() => setCurrentViewMonth(prev => addMonths(prev, 1))} className="bg-muted text-foreground hover:bg-muted/80">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Pago',     value: monthPaidTotal,    color: '#EF4444' },
          { label: 'Total Pendente', value: monthPendingTotal, color: '#F59E0B' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className="rounded-xl p-5 card-interactive" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">{item.label}</p>
              <p className="tabular text-xl font-semibold" style={{ color: item.color }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-0">
           <CardTitle className="text-sm font-semibold text-foreground">Histórico</CardTitle>
        </CardHeader>
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
                ) : (
                  monthExpenses.map((expense, index) => (
                    <motion.tr 
                      key={expense.id}
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: index * 0.05 }}
                      className="glass-panel hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_12px_40px_-8px_rgba(0,0,0,0.5)] hover:-translate-y-[2px] transition-all duration-300 [&>td:first-child]:rounded-l-xl [&>td:last-child]:rounded-r-xl [&>th:first-child]:rounded-l-xl [&>th:last-child]:rounded-r-xl"
                    >
                      <TableCell className="whitespace-nowrap">{format(new Date(expense.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{expense.description}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge 
                          variant="outline" 
                          className={`cursor-pointer ${expense.paid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}
                          onClick={() => handleTogglePaid(expense)}
                        >
                          {expense.paid ? (
                            <span className="flex items-center gap-1 whitespace-nowrap"><CheckCircle2 className="h-3 w-3" /> Paga</span>
                          ) : (
                            <span className="flex items-center gap-1 whitespace-nowrap"><Clock className="h-3 w-3" /> Pendente</span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        <span className={expense.paid ? 'text-rose-400' : 'text-muted-foreground'}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-rose-400" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
      </motion.div>
    </div>
  );
}
