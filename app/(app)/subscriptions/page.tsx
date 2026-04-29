'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getClients, getSubscriptions, addSubscription, updateSubscription } from '@/lib/data-store';
import { Client, Subscription } from '@/lib/types';
import { Search, Plus, Edit2, CheckCircle2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { setDate, isBefore, startOfDay, format } from 'date-fns';

export default function SubscriptionsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Merged form fields
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [service, setService] = useState('');
  const [monthlyValue, setMonthlyValue] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const loadData = async () => {
    const [c, s] = await Promise.all([getClients(), getSubscriptions()]);
    setClients(c);
    setSubs(s);
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleOpenDialog = (sub?: Subscription) => {
    if (sub) {
      setEditingSub(sub);
      setClientName(getSubClientName(sub));
      setClientPhone(getSubClientPhone(sub));
      setService(sub.service || '');
      setMonthlyValue(sub.monthlyValue.toString());
      setDueDay(sub.dueDay.toString());
      setStatus(sub.status);
    } else {
      setEditingSub(null);
      setClientName('');
      setClientPhone('');
      setService('');
      setMonthlyValue('');
      setDueDay('');
      setStatus('active');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error('Informe o nome do cliente.');
      return;
    }
    
    const value = parseFloat(monthlyValue);
    const day = parseInt(dueDay, 10);
    
    if (isNaN(value) || value <= 0) return toast.error('Valor inválido');
    if (isNaN(day) || day < 1 || day > 31) return toast.error('Dia inválido (1-31)');

    const subData = { 
      clientName, 
      clientPhone, 
      service,
      monthlyValue: value, 
      dueDay: day, 
      status 
    };

    if (editingSub) {
      await updateSubscription(editingSub.id, subData);
      toast.success('Assinatura atualizada!');
    } else {
      await addSubscription({ ...subData, payments: {} });
      toast.success('Assinatura criada!');
    }
    setIsDialogOpen(false);
    loadData();
  };

  const today = startOfDay(new Date());
  const currentMonthKey = format(today, 'yyyy-MM');

  const markAsPaid = async (sub: Subscription) => {
    const isPaid = sub.payments?.[currentMonthKey] || sub.paid;
    const newPayments = { ...(sub.payments || {}) };
    
    if (isPaid) {
      newPayments[currentMonthKey] = false;
      // also clear legacy
      await updateSubscription(sub.id, { payments: newPayments, paid: false });
      toast.success('Marcado como pendente.');
    } else {
      newPayments[currentMonthKey] = true;
      await updateSubscription(sub.id, { payments: newPayments, paid: true, lastPaymentDate: Date.now() });
      toast.success('Marcado como pago!');
    }
    loadData();
  };

  const filteredSubs = subs.filter(s => {
    const name = getSubClientName(s).toLowerCase();
    return name.includes(search.toLowerCase());
  }).sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
    return a.dueDay - b.dueDay;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Assinaturas</h2>
          <p className="text-sm sm:text-base text-slate-400">Controle de clientes e pagamentos recorrentes.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-500 text-white w-full sm:w-auto" onClick={() => handleOpenDialog()} />}>
            <Plus className="mr-2 h-4 w-4" /> Nova Assinatura
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSub ? 'Editar Assinatura' : 'Nova Assinatura'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: João Silva" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Telefone (WhatsApp)</Label>
                  <Input id="clientPhone" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Serviço/Produto</Label>
                  <Input id="service" value={service} onChange={e => setService(e.target.value)} placeholder="Ex: Manutenção Mensal" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor Mensal (R$)</Label>
                  <Input id="value" type="number" step="0.01" value={monthlyValue} onChange={e => setMonthlyValue(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day">Dia de Vencimento</Label>
                  <Input id="day" type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => v && setStatus(v as 'active' | 'inactive')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por cliente..."
              className="pl-8 max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Situação (Mês Atual)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    Nenhuma assinatura encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubs.map((sub) => {
                  const dueDate = setDate(today, sub.dueDay);
                  const isPaid = sub.payments?.[currentMonthKey] || sub.paid;
                  const isLate = sub.status === 'active' && !isPaid && isBefore(dueDate, today);
                  const cPhone = getSubClientPhone(sub).replace(/\D/g, '');
                  
                  return (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <p className="font-medium">{getSubClientName(sub)}</p>
                      {sub.service && <p className="text-xs text-slate-500">{sub.service}</p>}
                    </TableCell>
                    <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.monthlyValue)}</TableCell>
                    <TableCell>Dia {sub.dueDay}</TableCell>
                    <TableCell>
                      {sub.status === 'inactive' ? (
                        <Badge variant="outline">Inativa</Badge>
                      ) : isPaid ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-none">Pago</Badge>
                      ) : isLate ? (
                        <Badge className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-none">Atrasado</Badge>
                      ) : (
                        <Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-none">Aberto</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                       {sub.status === 'active' && (
                         <Button 
                          variant={isPaid ? 'outline' : 'default'} 
                          size="sm" 
                          className={isPaid ? 'text-slate-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
                          onClick={() => markAsPaid(sub)}
                          title={isPaid ? 'Desmarcar pagamento' : 'Marcar como pago'}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {isPaid ? 'Desfazer' : 'Pagar'}
                        </Button>
                       )}
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(sub)}>
                        <Edit2 className="h-4 w-4 text-blue-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )})
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
