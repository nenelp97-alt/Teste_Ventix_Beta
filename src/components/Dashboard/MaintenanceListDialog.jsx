import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { differenceInDays, format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDate } from '@/lib/dateUtils';

const TYPE_LABELS = {
  preventive: 'Preventiva',
  corrective: 'Corretiva',
  emergency: 'Emergência'
};

export default function MaintenanceListDialog({ open, onOpenChange, title, description, maintenances, equipments, variant }) {
  const equipMap = useMemo(() => {
    const map = new Map();
    equipments.forEach(e => map.set(e.id, e));
    return map;
  }, [equipments]);

  const Icon = variant === 'completed' ? CheckCircle2 : AlertTriangle;
  const isCompleted = variant === 'completed';

  const sorted = [...maintenances].sort((a, b) => {
    const dateA = parseDate(isCompleted ? a.completed_date : a.scheduled_date);
    const dateB = parseDate(isCompleted ? b.completed_date : b.scheduled_date);
    return isCompleted ? dateB - dateA : dateA - dateB;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`} />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro.</p>
          ) : sorted.map((m) => {
            const equip = equipMap.get(m.equipment_id);
            const date = parseDate(isCompleted ? m.completed_date : m.scheduled_date);
            const daysDiff = isCompleted ? null : differenceInDays(new Date(), date);
            return (
              <div
                key={m.id}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm border ${
                  isCompleted 
                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                    : 'bg-destructive/10 border-destructive/20'
                }`}
              >
                <div className="min-w-0">
                  <span className="font-medium">{equip?.name || 'Equipamento removido'}</span>
                  {equip?.location && <span className="text-muted-foreground ml-2 text-xs">{equip.location}</span>}
                  <span className="ml-2 text-xs text-muted-foreground">{TYPE_LABELS[m.type] || m.type}</span>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className={`font-semibold text-xs ${
                    isCompleted 
                      ? 'text-emerald-700 dark:text-emerald-300 font-bold' 
                      : 'text-destructive font-bold'
                  }`}>
                    {isCompleted ? 'Concluída' : daysDiff > 0 ? `Atrasada ${daysDiff}d` : 'Hoje'}
                  </div>
                  {isValid(date) && (
                    <div className="text-muted-foreground text-xs">
                      {format(date, "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}