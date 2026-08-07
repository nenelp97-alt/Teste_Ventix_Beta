import React, { useState } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Wrench, Search, Filter, Camera, FolderOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseDate } from '@/lib/dateUtils';
import MaintenanceFormDialog from '@/components/maintenance/MaintenanceFormDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const typeConfig = {
  preventive: { label: 'Preventiva', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium' },
  corrective: { label: 'Corretiva', class: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold' },
  emergency: { label: 'Emergência', class: 'bg-destructive/15 text-destructive border-destructive/30 font-semibold' },
};

const statusConfig = {
  scheduled: { label: 'Agendada', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium' },
  in_progress: { label: 'Em Andamento', class: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold' },
  completed: { label: 'Concluída', class: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold' },
  cancelled: { label: 'Cancelada', class: 'bg-muted text-muted-foreground border-border font-medium' },
};

export default function Manutencoes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const queryClient = useQueryClient();

  const { data: maintenances = [], isLoading: loadingM } = useQuery({
    queryKey: ['maintenances'],
    queryFn: () => base44.entities.Maintenance.list('-scheduled_date'),
  });

  const { data: equipments = [], isLoading: loadingE } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => base44.entities.Equipment.list(),
  });

  const equipMap = {};
  equipments.forEach(e => { equipMap[e.id] = e; });

  const createMut = useMutation({
    mutationFn: d => base44.entities.Maintenance.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenances'] }); setDialogOpen(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Maintenance.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenances'] }); setDialogOpen(false); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: id => base44.entities.Maintenance.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenances'] }); setDeleteId(null); },
  });

  const handleSave = async (data) => {
    const isCompletingPreventive =
      data.type === 'preventive' &&
      data.status === 'completed' &&
      (editing?.status !== 'completed');

    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, data });

      if (isCompletingPreventive) {
        const equip = equipMap[data.equipment_id];
        const months = equip?.maintenance_interval_months;
        if (equip && months) {
          const baseDate = data.completed_date ? parseDate(data.completed_date) : new Date();
          const nextDate = addMonths(baseDate, months);
          const nextDateStr = format(nextDate, 'yyyy-MM-dd');

          await base44.entities.Maintenance.create({
            equipment_id: data.equipment_id,
            type: 'preventive',
            status: 'scheduled',
            scheduled_date: nextDateStr,
            description: `Manutenção preventiva automática (${equip.operation_mode === '24h' ? 'operação 24h' : 'meio período'})`,
          });

          await base44.entities.Equipment.update(equip.id, { next_preventive_date: nextDateStr });

          queryClient.invalidateQueries({ queryKey: ['maintenances'] });
          queryClient.invalidateQueries({ queryKey: ['equipments'] });
        }
      }
    } else {
      createMut.mutate(data);
    }
  };

  const filtered = maintenances.filter(m => {
    const equip = equipMap[m.equipment_id];
    const searchMatch = !search ||
      equip?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.technician?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase());
    const statusMatch = filterStatus === 'all' || m.status === filterStatus;
    const typeMatch = filterType === 'all' || m.type === filterType;
    return searchMatch && statusMatch && typeMatch;
  });

  const isLoading = loadingM || loadingE;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manutenções</h1>
          <p className="text-muted-foreground mt-1">{maintenances.length} registros</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nova Manutenção
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <Filter className="w-3 h-3 mr-2" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="scheduled">Agendada</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="preventive">Preventiva</SelectItem>
            <SelectItem value="corrective">Corretiva</SelectItem>
            <SelectItem value="emergency">Emergência</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Wrench className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma manutenção encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => {
            const equip = equipMap[m.equipment_id];
            const tc = typeConfig[m.type] || typeConfig.preventive;
            const sc = statusConfig[m.status] || statusConfig.scheduled;

            return (
              <div key={m.id} className="bg-card rounded-2xl p-5 border border-border hover:shadow-md transition-shadow group">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-sm">{equip?.name || 'Equipamento removido'}</p>
                      <Badge variant="outline" className={cn("text-[10px] border", tc.class)}>{tc.label}</Badge>
                      <Badge variant="outline" className={cn("text-[10px] border", sc.class)}>{sc.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {equip?.location && <span>📍 {equip.location}</span>}
                      <span>📅 {format(parseDate(m.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      {m.technician && <span>👤 {m.technician}</span>}
                      {m.cost && <span>💰 R$ {Number(m.cost).toFixed(2)}</span>}
                    </div>
                    {m.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{m.description}</p>
                    )}

                    {/* Evidências resumidas */}
                    {(() => {
                      const totalEvidencias = (m.evidence_photos?.length || 0) + (m.evidence_links?.length || 0);
                      const hasFolderUrl = !!m.evidence_folder_url;
                      if (!totalEvidencias && !hasFolderUrl) return null;
                      return (
                        <div className="mt-3 space-y-2">
                          {m.evidence_photos?.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {m.evidence_photos.slice(0, 4).map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt="" className="w-10 h-10 object-cover rounded-lg border border-border hover:scale-105 transition-transform" />
                                </a>
                              ))}
                              {m.evidence_photos.length > 4 && (
                                <span className="text-xs text-muted-foreground">+{m.evidence_photos.length - 4} fotos</span>
                              )}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {hasFolderUrl && (
                              <a href={m.evidence_folder_url} target="_blank" rel="noopener noreferrer">
                                <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-medium hover:bg-primary/20 transition-colors">
                                  <FolderOpen className="w-2.5 h-2.5" /> Abrir Pasta
                                </span>
                              </a>
                            )}
                            {m.evidence_links?.map((link, i) => (
                              <a key={i} href={link} target="_blank" rel="noopener noreferrer">
                                <span className="inline-flex items-center gap-1 text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full hover:bg-muted/80 transition-colors">
                                  <ExternalLink className="w-2.5 h-2.5" /> Evidência {i + 1}
                                </span>
                              </a>
                            ))}
                          </div>
                          {totalEvidencias > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Camera className="w-3 h-3" />
                              <span>{totalEvidencias} evidência{totalEvidencias !== 1 ? 's' : ''} registrada{totalEvidencias !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(m); setDialogOpen(true); }}>
                      <Pencil className="w-3 h-3 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(m.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MaintenanceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        maintenance={editing}
        equipments={equipments}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir manutenção?</AlertDialogTitle>
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