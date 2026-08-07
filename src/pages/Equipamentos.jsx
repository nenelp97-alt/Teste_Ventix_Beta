import React, { useState } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, AirVent, Search, CalendarClock, AlertTriangle } from 'lucide-react';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EquipmentFormDialog from '@/components/equipament/EquipmentFormDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from
'@/components/ui/alert-dialog';

const statusConfig = {
  operational: { label: 'Operacional', class: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold' },
  maintenance: { label: 'Em Manutenção', class: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-semibold' },
  broken: { label: 'Quebrado', class: 'bg-destructive/15 text-destructive border-destructive/30 font-semibold' },
  inactive: { label: 'Inativo', class: 'bg-muted text-muted-foreground border-border font-medium' }
};

export default function Equipamentos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Equipment.create(d),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['equipments'] });setDialogOpen(false);}
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipment.update(id, data),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['equipments'] });setDialogOpen(false);setEditing(null);}
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Equipment.delete(id),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['equipments'] });setDeleteId(null);}
  });

  const handleSave = (data) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const filtered = equipments.filter((e) =>
  e.name?.toLowerCase().includes(search.toLowerCase()) ||
  e.location?.toLowerCase().includes(search.toLowerCase()) ||
  e.brand?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>);

  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CONTROLE DE MANUTENÇÕES - AR CONDICIONADOS TERCA </h1>
          <p className="text-muted-foreground mt-1">{equipments.length} equipamentos cadastrados</p>
        </div>
        <Button onClick={() => {setEditing(null);setDialogOpen(true);}}>
          <Plus className="w-4 h-4 mr-2" /> Novo Equipamento
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar equipamentos..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)} />
        
      </div>

      {filtered.length === 0 ?
      <div className="text-center py-16">
          <AirVent className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum equipamento encontrado</p>
        </div> :

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((equip) => {
          const st = statusConfig[equip.status] || statusConfig.operational;
          return (
            <div key={equip.id} className="bg-card rounded-2xl p-5 border border-border hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <AirVent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{equip.name}</p>
                      <p className="text-xs text-muted-foreground">{equip.location}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] border", st.class)}>{st.label}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                  {equip.brand && <div><span className="font-medium text-foreground">Marca:</span> {equip.brand}</div>}
                  {equip.model && <div><span className="font-medium text-foreground">Cód. Patrimônio:</span> {equip.model}</div>}
                  {equip.capacity_btu && <div><span className="font-medium text-foreground">BTUs:</span> {equip.capacity_btu.toLocaleString()}</div>}
                  {equip.operation_mode && <div><span className="font-medium text-foreground">Regime:</span> {equip.operation_mode === '24h' ? '24 horas' : 'Meio período'}</div>}
                  {equip.last_maintenance_date && <div><span className="font-medium text-foreground">Última manutenção:</span> {format(parseISO(equip.last_maintenance_date), 'dd/MM/yyyy', { locale: ptBR })}</div>}
                </div>

                {/* Próxima preventiva */}
                {equip.next_preventive_date && (() => {
                const next = parseISO(equip.next_preventive_date);
                const days = isValid(next) ? differenceInDays(next, new Date()) : null;
                const isOverdue = days !== null && days < 0;
                const isSoon = days !== null && days >= 0 && days <= 30;
                return (
                  <div className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-3 text-xs ${
                  isOverdue ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                  isSoon ? 'bg-primary/10 text-primary border border-primary/20' :
                  'bg-muted text-muted-foreground border border-border'}`
                  }>
                      {isOverdue ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <CalendarClock className="w-3.5 h-3.5 shrink-0" />}
                      <span>
                        <span className="font-medium">Próxima preventiva: </span>
                        {isValid(next) ? format(next, "dd/MM/yyyy", { locale: ptBR }) : '—'}
                        {days !== null &&
                      <span className="ml-1 font-semibold">
                            {isOverdue ? ` (atrasada ${Math.abs(days)}d)` : days === 0 ? ' (hoje!)' : ` (em ${days}d)`}
                          </span>
                      }
                      </span>
                    </div>);

              })()}

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => {setEditing(equip);setDialogOpen(true);}}>
                    <Pencil className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(equip.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>);

        })}
        </div>
      }

      <EquipmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        equipment={editing}
        onSave={handleSave} />
      

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipamento?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMut.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

}