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
import { getClients, getSubscriptions, addSubscription, updateSubscription, deleteSubscription } from '@/lib/data-store';
import { Client, Subscription } from '@/lib/types';
import { Search, Plus, Edit2, CheckCircle2, MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      const now = new Date().getTime();
      await updateSubscription(sub.id, { payments: newPayments, paid: true, lastPaymentDate: now });
      toast.success('Marcado como pago!');
    }
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta assinatura?')) {
      await deleteSubscription(id);
      toast.success('Assinatura removida!');
      loadData();
    }
  };

  const handleSendReminder = (sub: Subscription) => {
    const phone = getSubClientPhone(sub);
    if (!phone) {
      toast.error('Assinatura sem telefone cadastrado.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.monthlyValue);
    const serviceText = sub.service ? ` referente a ${sub.service}` : '';
    
    const message = `Olá, tudo bem?\n\nPassando para lembrar que o vencimento da sua mensalidade${serviceText} está se aproximando (Dia ${sub.dueDay}).\nValor: ${formattedValue}\n\nPara facilitar, segue a nossa chave PIX:\n*62991803975*\nNubank\n\nQualquer dúvida, estamos à disposição. Tenha um ótimo dia!`;
    
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
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
        <div className="flex flex-col gap-1">
          <h2 className="text-4xl font-serif text-foreground tracking-tight">Assinaturas</h2>
          <p className="text-sm text-muted-foreground">Controle de clientes e pagamentos recorrentes.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="w-full sm:w-auto shadow-sm tracking-wide" onClick={() => handleOpenDialog()} />}>
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
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente..."
              className="pl-8 max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Serviço/Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Situação (Mês Atual)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                {filteredSubs.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                      Nenhuma assinatura encontrada.
                    </TableCell>
                  </motion.tr>
                ) : (
                  filteredSubs.map((sub) => {
                    const dueDate = setDate(today, sub.dueDay);
                    const isPaid = sub.payments?.[currentMonthKey] || sub.paid;
                    const isLate = sub.status === 'active' && !isPaid && isBefore(dueDate, today);
                    const cPhone = getSubClientPhone(sub);
                    
                    return (
                    <motion.tr 
                      key={sub.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <p className="font-medium whitespace-nowrap">{getSubClientName(sub)}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{cPhone || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{sub.service || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.monthlyValue)}</TableCell>
                      <TableCell className="whitespace-nowrap">Dia {sub.dueDay}</TableCell>
                      <TableCell className="whitespace-nowrap">
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
                      <TableCell className="text-right flex items-center justify-end gap-2 whitespace-nowrap">
                         {sub.status === 'active' && (
                           <Button 
                            variant={isPaid ? 'outline' : 'default'} 
                            size="sm" 
                            className={isPaid ? 'text-muted-foreground' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
                            onClick={() => markAsPaid(sub)}
                            title={isPaid ? 'Desmarcar pagamento' : 'Marcar como pago'}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1 md:mr-2" />
                            <span className="hidden sm:inline">{isPaid ? 'Desfazer' : 'Pagar'}</span>
                          </Button>
                         )}
                        <Button variant="ghost" size="icon" onClick={() => handleSendReminder(sub)} title="Enviar Lembrete WhatsApp">
                          <MessageCircle className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(sub)}>
                          <Edit2 className="h-4 w-4 text-blue-400" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(sub.id)}>
                          <Trash2 className="h-4 w-4 text-rose-400" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  )})
                )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
