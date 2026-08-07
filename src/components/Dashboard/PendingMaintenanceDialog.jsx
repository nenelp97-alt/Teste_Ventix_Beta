import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Clock, CheckCircle2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { differenceInDays, format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDate } from '@/lib/dateUtils';

export default function PendingMaintenanceDialog({ open, onOpenChange, equipments, alertDays, onRegisterMaintenance }) {
  const today = new Date();

  const pending = equipments
    .filter(e => e.next_preventive_date && e.status !== 'inactive')
    .map(e => {
      const nextDate = parseDate(e.next_preventive_date);
      if (!isValid(nextDate)) return null;
      const daysUntil = differenceInDays(nextDate, today);
      return { equipment: e, nextDate, daysUntil };
    })
    .filter(a => a !== null && a.daysUntil <= alertDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Manutenções Pendentes
          </DialogTitle>
          <DialogDescription>
            Equipamentos com preventiva nos próximos {alertDays} dias ou atrasada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {pending.length === 0 ? (
            <div className="flex items-center gap-2 text-accent py-6 justify-center">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Nenhuma manutenção pendente.</span>
            </div>
          ) : pending.map(({ equipment, nextDate, daysUntil }) => (
            <div
              key={equipment.id}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
                daysUntil < 0 ? 'bg-destructive/10 border border-destructive/20' : 'bg-primary/10 border border-primary/20'
              }`}
            >
              <div className="min-w-0">
                <span className="font-medium">{equipment.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">{equipment.location}</span>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className={`font-semibold text-xs ${daysUntil < 0 ? 'text-destructive' : 'text-primary'}`}>
                  {daysUntil < 0 ? `Atrasada ${Math.abs(daysUntil)}d` : daysUntil === 0 ? 'Hoje!' : `Em ${daysUntil}d`}
                </div>
                <div className="text-muted-foreground text-xs">
                  {format(nextDate, "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 ml-3 h-7 text-xs"
                onClick={() => onRegisterMaintenance(equipment)}
              >
                <Wrench className="w-3 h-3 mr-1" /> Registrar
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}