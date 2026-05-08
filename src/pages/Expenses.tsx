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
import { Plus, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  // filter current month for the summary
  const today = new Date();
  const currentMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const currentMonthPaidTotal = expenses
    .filter(e => e.paid)
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const currentMonthPendingTotal = expenses
    .filter(e => !e.paid)
    .reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-4xl font-serif text-foreground tracking-tight">Despesas</h2>
          <p className="text-sm text-muted-foreground">Registre custos operacionais do seu negócio.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="w-full sm:w-auto shadow-sm tracking-wide" onClick={handleOpenDialog} />}>
            <Plus className="mr-2 h-4 w-4" /> Nova Despesa
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
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
           <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Despesas Pagas (Total)</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="text-2xl font-bold text-rose-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentMonthPaidTotal)}
              </div>
           </CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Despesas Pendentes (Total)</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="text-2xl font-bold text-amber-500">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentMonthPendingTotal)}
              </div>
           </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Histórico de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    Nenhuma despesa registrada.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`cursor-pointer ${expense.paid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}
                        onClick={() => handleTogglePaid(expense)}
                      >
                        {expense.paid ? (
                          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Paga</span>
                        ) : (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pendente</span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={expense.paid ? 'text-rose-400' : 'text-muted-foreground'}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-rose-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
