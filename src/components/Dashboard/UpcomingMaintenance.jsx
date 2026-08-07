import React from 'react';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDate } from '@/lib/dateUtils';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const typeLabels = {
  preventive: { label: 'Preventiva', class: 'bg-primary/10 text-primary border-primary/20' },
  corrective: { label: 'Corretiva', class: 'bg-accent/10 text-accent border-accent/20' },
  emergency: { label: 'Emergência', class: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function UpcomingMaintenance({ maintenances, equipments }) {
  const equipMap = {};
  equipments.forEach(e => { equipMap[e.id] = e; });

  const upcoming = maintenances
    .filter(m => (m.status === 'scheduled' || m.status === 'in_progress') && m.type !== 'preventive')
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .slice(0, 6);

  if (upcoming.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="font-semibold text-lg mb-4">Próximas Manutenções</h3>
        <p className="text-muted-foreground text-sm text-center py-8">
          Nenhuma manutenção agendada
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="font-semibold text-lg mb-4">Próximas Manutenções</h3>
      <div className="space-y-3">
        {upcoming.map(m => {
          const equip = equipMap[m.equipment_id];
          const date = parseDate(m.scheduled_date);
          const overdue = isPast(date) && !isToday(date);
          const today = isToday(date);
          const typeInfo = typeLabels[m.type] || typeLabels.preventive;

          return (
            <div key={m.id} className={cn(
              "flex items-center gap-4 p-4 rounded-xl border transition-colors",
              overdue ? "bg-destructive/10 border-destructive/20" : "bg-muted/30 border-transparent hover:border-border"
            )}>
              <div className={cn(
                "w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold shrink-0",
                overdue ? "bg-destructive/10 text-destructive" : today ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <span className="text-base leading-none">{format(date, 'dd')}</span>
                <span className="uppercase text-[10px]">{format(date, 'MMM', { locale: ptBR })}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm truncate">{equip?.name || 'Equipamento'}</p>
                  {overdue && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{equip?.location || '—'}</span>
                </div>
              </div>
              <Badge variant="outline" className={cn("text-[10px] shrink-0 border", typeInfo.class)}>
                {typeInfo.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}