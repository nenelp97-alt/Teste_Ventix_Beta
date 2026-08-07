import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusLabels, statusColors, categoryLabels, priorityLabels, priorityColors, fmt } from './infraConstants';

const getTotal = (r) => (Number(r.service_cost) || 0) + (Number(r.materials_cost) || 0);

export default function InfraRecentList({ data, onEdit }) {
  const recent = [...data]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 8);

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
      <h3 className="font-semibold mb-4 text-sm">Manutenções Recentes</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma manutenção registrada.</p>
      ) : (
        <div className="space-y-2">
          {recent.map(item => (
            <div key={item.id} className="flex items-center justify-between rounded-xl px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {categoryLabels[item.category] || item.category} • {item.unit || '—'} • {item.supplier || 'Sem fornecedor'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Badge variant="outline" className={cn("text-xs hidden sm:inline-flex", priorityColors[item.priority])}>
                  {priorityLabels[item.priority]}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", statusColors[item.status])}>
                  {statusLabels[item.status]}
                </Badge>
                <span className="text-sm font-semibold">{fmt(getTotal(item))}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(item)}>
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}