import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Pencil, Trash2, DollarSign, FileText, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import StatCard from '@/components/dashboard/StatCard';
import GastoFormSheet from '@/components/gastos/GastoFormSheet';
import GastoDetailSheet from '@/components/gastos/GastoDetailSheet';
import { moduloLabels, categoriaLabels, origemLabels, origemColors, fmt, formatCnpj } from '@/components/gastos/gastoConstants';
import { parseDate } from '@/lib/dateUtils';

export default function RegistroGastos() {
  const [showForm, setShowForm] = useState(false);
  const [editingGasto, setEditingGasto] = useState(null);
  const [detailGasto, setDetailGasto] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [search, setSearch] = useState('');
  const [fModulo, setFModulo] = useState('all');
  const [fCategoria, setFCategoria] = useState('all');
  const [fOrigem, setFOrigem] = useState('all');
  const [fPeriod, setFPeriod] = useState('all');

  const queryClient = useQueryClient();

  const { data: gastos = [], isLoading } = useQuery({
    queryKey: ['gastos'],
    queryFn: () => base44.entities.Gasto.list('-data')
  });

  const fornecedorIds = useMemo(() => [...new Set(gastos.map(g => g.fornecedor_id).filter(Boolean))], [gastos]);

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['gastos-fornecedores', fornecedorIds.join(',')],
    queryFn: async () => {
      if (fornecedorIds.length === 0) return [];
      return Promise.all(fornecedorIds.map(id => base44.entities.Fornecedor.get(id).catch(() => null)));
    },
    enabled: fornecedorIds.length > 0
  });

  const fornecedorMap = useMemo(() => {
    const map = {};
    fornecedores.filter(Boolean).forEach(f => { map[f.id] = f; });
    return map;
  }, [fornecedores]);

  const filtered = useMemo(() => {
    return gastos.filter(g => {
      if (fModulo !== 'all' && g.modulo !== fModulo) return false;
      if (fCategoria !== 'all' && g.categoria !== fCategoria) return false;
      if (fOrigem !== 'all' && g.origem !== fOrigem) return false;
      if (fPeriod !== 'all') {
        const months = parseInt(fPeriod);
        const limit = new Date();
        limit.setMonth(limit.getMonth() - months);
        const d = parseDate(g.data);
        if (d < limit) return false;
      }
      if (search) {
        const forn = fornecedorMap[g.fornecedor_id];
        const s = search.toLowerCase();
        const cnpjNorm = search.replace(/\D/g, '');
        const matchForn = forn && (
          (forn.razao_social || '').toLowerCase().includes(s) ||
          (forn.nome_fantasia || '').toLowerCase().includes(s) ||
          (cnpjNorm.length > 0 && (forn.cnpj || '').includes(cnpjNorm))
        );
        const matchLocal = (g.local || '').toLowerCase().includes(s);
        if (!matchForn && !matchLocal) return false;
      }
      return true;
    });
  }, [gastos, fornecedorMap, search, fModulo, fCategoria, fOrigem, fPeriod]);

  const totalGeral = useMemo(() => filtered.reduce((s, g) => s + (Number(g.valor_total) || 0), 0), [filtered]);
  const totalItens = filtered.length;
  const ticketMedio = totalItens > 0 ? totalGeral / totalItens : 0;
  const fornecedoresUnicos = useMemo(() => new Set(filtered.map(g => g.fornecedor_id).filter(Boolean)).size, [filtered]);

  const handleNew = () => { setEditingGasto(null); setShowForm(true); };
  const handleEdit = (gasto) => { setShowDetail(false); setDetailGasto(null); setEditingGasto(gasto); setShowForm(true); };
  const handleView = (gasto) => { setDetailGasto(gasto); setShowDetail(true); };
  const handleSaved = () => { queryClient.invalidateQueries({ queryKey: ['gastos'] }); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await base44.entities.GastoItem.deleteMany({ gasto_id: deleteTarget.id });
      await base44.entities.Gasto.delete(deleteTarget.id);
      toast({ title: 'Gasto excluído' });
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
    } catch (err) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    }
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold tracking-tight text-3xl">Registro de Gastos</h1>
          <p className="text-muted-foreground mt-1">Controle de despesas de manutenção e infraestrutura</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" /> Registrar Gasto
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Gasto Total" value={fmt(totalGeral)} icon={DollarSign} color="primary" />
        <StatCard title="Lançamentos" value={totalItens} icon={FileText} color="secondary" />
        <StatCard title="Ticket Médio" value={fmt(ticketMedio)} icon={TrendingUp} color="accent" />
        <StatCard title="Fornecedores" value={fornecedoresUnicos} icon={Users} color="destructive" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <Input placeholder="Buscar por fornecedor ou local..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={fModulo} onValueChange={setFModulo}>
          <SelectTrigger><SelectValue placeholder="Módulo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            {Object.entries(moduloLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fCategoria} onValueChange={setFCategoria}>
          <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {Object.entries(categoriaLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fOrigem} onValueChange={setFOrigem}>
          <SelectTrigger><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {Object.entries(origemLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="md:w-52">
        <Select value={fPeriod} onValueChange={setFPeriod}>
          <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o período</SelectItem>
            <SelectItem value="1">Último mês</SelectItem>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum gasto registrado. Clique em "Registrar Gasto" para começar.
                </TableCell>
              </TableRow>
            ) : filtered.map(g => {
              const forn = fornecedorMap[g.fornecedor_id];
              return (
                <TableRow key={g.id} className="cursor-pointer" onClick={() => handleView(g)}>
                  <TableCell>{g.data ? new Date(g.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</TableCell>
                  <TableCell>
                    <p className="font-medium">{forn?.razao_social || '—'}</p>
                    {forn?.cnpj && <p className="text-xs text-muted-foreground">{formatCnpj(forn.cnpj)}</p>}
                  </TableCell>
                  <TableCell><Badge variant="outline">{moduloLabels[g.modulo]}</Badge></TableCell>
                  <TableCell>{categoriaLabels[g.categoria]}</TableCell>
                  <TableCell>{g.local || '—'}</TableCell>
                  <TableCell><Badge variant="outline" className={origemColors[g.origem]}>{origemLabels[g.origem]}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{fmt(g.valor_total)}</TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleView(g)}><Eye className="w-4 h-4" /></Button>
                      {g.origem === 'MANUAL' && (
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(g)}><Pencil className="w-4 h-4" /></Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(g)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <GastoFormSheet
        open={showForm}
        onOpenChange={setShowForm}
        editingGasto={editingGasto}
        onSaved={handleSaved}
      />

      <GastoDetailSheet
        open={showDetail}
        onOpenChange={setShowDetail}
        gasto={detailGasto}
        onEdit={handleEdit}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>Deseja realmente excluir este gasto? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}