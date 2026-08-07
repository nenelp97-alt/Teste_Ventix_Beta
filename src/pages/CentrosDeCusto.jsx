import React, { useState } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CentroCustoFormDialog from '@/components/centros/CentroCustoFormDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CentrosDeCusto() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: centros = [], isLoading } = useQuery({
    queryKey: ['centros-custo'],
    queryFn: () => base44.entities.CentroDeCusto.list(),
  });

  const { data: equipments = [] } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => base44.entities.Equipment.list(),
  });

  const createMut = useMutation({
    mutationFn: d => base44.entities.CentroDeCusto.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['centros-custo'] }); setDialogOpen(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CentroDeCusto.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['centros-custo'] }); setDialogOpen(false); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: id => base44.entities.CentroDeCusto.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['centros-custo'] }); setDeleteId(null); },
  });

  const handleSave = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  // Contar equipamentos por centro de custo
  const equipCountMap = {};
  equipments.forEach(e => {
    if (e.cost_center_id) {
      equipCountMap[e.cost_center_id] = (equipCountMap[e.cost_center_id] || 0) + 1;
    }
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centros de Custo</h1>
          <p className="text-muted-foreground mt-1">{centros.length} centros cadastrados</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Centro de Custo
        </Button>
      </div>

      {centros.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum centro de custo cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {centros.map(centro => (
            <div key={centro.id} className="bg-card rounded-2xl p-5 border border-border hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{centro.name}</p>
                    {centro.code && <p className="text-xs text-muted-foreground">Código: {centro.code}</p>}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                  {equipCountMap[centro.id] || 0} equip.
                </Badge>
              </div>

              {centro.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{centro.description}</p>
              )}

              {centro.locations?.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {centro.locations.map(loc => (
                    <span key={loc} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {loc}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(centro); setDialogOpen(true); }}>
                  <Pencil className="w-3 h-3 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(centro.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CentroCustoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        centro={editing}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir centro de custo?</AlertDialogTitle>
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
    </div>
  );
}