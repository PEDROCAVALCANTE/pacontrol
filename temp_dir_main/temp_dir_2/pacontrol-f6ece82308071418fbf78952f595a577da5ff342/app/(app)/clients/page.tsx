'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getClients, addClient, updateClient, deleteClient } from '@/lib/data-store';
import { Client } from '@/lib/types';
import { Search, Plus, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  type SortKey = 'name' | 'responsible' | 'status';
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [responsible, setResponsible] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [value, setValue] = useState<number | ''>('');

  const loadClients = async () => {
    const data = await getClients();
    setClients(data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClients();
  }, []);

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setName(client.name);
      setPhone(client.phone);
      setResponsible(client.responsible);
      setStatus(client.status);
      setValue(client.value || '');
    } else {
      setEditingClient(null);
      setName('');
      setPhone('');
      setResponsible('');
      setStatus('active');
      setValue('');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalValue = value === '' ? undefined : Number(value);
    if (editingClient) {
      await updateClient(editingClient.id, { name, phone, responsible, status, value: finalValue });
      toast.success('Cliente atualizado com sucesso!');
    } else {
      await addClient({ name, phone, responsible, status, value: finalValue });
      toast.success('Cliente adicionado com sucesso!');
    }
    setIsDialogOpen(false);
    loadClients();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente? Isso também excluirá suas assinaturas.')) {
      await deleteClient(id);
      toast.success('Cliente removido!');
      loadClients();
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.responsible.toLowerCase().includes(search.toLowerCase())
  );

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction } = sortConfig;
    const aValue = a[key] || '';
    const bValue = b[key] || '';
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Clientes</h2>
          <p className="text-sm sm:text-base text-slate-400">Gerencie seus clientes e status.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-500 text-white w-full sm:w-auto" onClick={() => handleOpenDialog()} />}>
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa / Cliente</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsible">Responsável</Label>
                <Input id="responsible" value={responsible} onChange={e => setResponsible(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valor</Label>
                <Input id="value" type="number" step="0.01" value={value} onChange={e => setValue(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => v && setStatus(v as 'active' | 'inactive')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
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
              placeholder="Buscar por nome ou responsável..."
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
                <TableHead className="cursor-pointer select-none hover:text-white" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    Cliente {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer select-none hover:text-white" onClick={() => handleSort('responsible')}>
                  <div className="flex items-center gap-1">
                    Responsável {sortConfig?.key === 'responsible' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                  </div>
                </TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="cursor-pointer select-none hover:text-white" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    Status {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                  </div>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.responsible}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>
                      {client.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.value) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className={client.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : ''}>
                        {client.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(client)}>
                        <Edit2 className="h-4 w-4 text-blue-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)}>
                        <Trash2 className="h-4 w-4 text-rose-400" />
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
