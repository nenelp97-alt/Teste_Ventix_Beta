import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AirVent, Search, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
  operational: { label: 'Operacional', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  maintenance: { label: 'Em Manutenção', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  broken: { label: 'Quebrado', class: 'bg-red-50 text-red-700 border-red-200' },
  inactive: { label: 'Inativo', class: 'bg-slate-100 text-slate-500 border-slate-200' }
};

export default function EquipmentSelectionDialog({ open, onOpenChange, equipments = [], onRegisterMaintenance }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    equipments.filter(e =>
      e.status !== 'inactive' && (
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.location?.toLowerCase().includes(search.toLowerCase()) ||
        e.brand?.toLowerCase().includes(search.toLowerCase())
      )
    ), [equipments, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white text-slate-900 border border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <AirVent className="w-5 h-5 text-blue-600" />
            Selecionar Equipamento
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Selecione um equipamento para registrar uma manutenção corretiva.
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, local ou marca..."
            className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="col-span-2 text-center py-8">
              <AirVent className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Nenhum equipamento encontrado.</p>
            </div>
          ) : filtered.map((equip) => {
            const st = statusConfig[equip.status] || statusConfig.operational;
            return (
              <div key={equip.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <AirVent className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{equip.name}</p>
                      <p className="text-xs text-slate-500 truncate">{equip.location}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] border shrink-0 ml-1", st.class)}>{st.label}</Badge>
                </div>
                <Button
                  size="sm"
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => onRegisterMaintenance(equip)}
                >
                  <Wrench className="w-3 h-3 mr-1" /> Nova Corretiva
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}