import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarClock, Building2, Plus, X, Check } from 'lucide-react';
import { parseDate } from '@/lib/dateUtils';

const OPERATION_MODES = {
  '24h': { label: '24 horas (preventiva a cada 6 meses)', months: 6 },
  'half_day': { label: 'Meio período (preventiva anual)', months: 12 },
};

const defaultForm = {
  name: '', brand: '', model: '', capacity_btu: '',
  location: '', cost_center_id: '', installation_date: '', last_maintenance_date: '',
  status: 'operational', operation_mode: '', notes: ''
};

export default function EquipmentFormDialog({ open, onOpenChange, equipment, onSave }) {
  const [form, setForm] = useState(defaultForm);
  const [creatingCentro, setCreatingCentro] = useState(false);
  const [newCentroName, setNewCentroName] = useState('');
  const [newCentroCode, setNewCentroCode] = useState('');
  const [savingCentro, setSavingCentro] = useState(false);
  const isEditing = !!equipment;
  const queryClient = useQueryClient();

  const { data: centros = [] } = useQuery({
    queryKey: ['centros-custo'],
    queryFn: () => base44.entities.CentroDeCusto.list(),
  });

  // Mapa de localização -> centro de custo
  const locationToCentroMap = {};
  centros.forEach(c => {
    (c.locations || []).forEach(loc => {
      locationToCentroMap[loc] = c.id;
    });
  });

  useEffect(() => {
    if (equipment) {
      setForm({
        name: equipment.name || '',
        brand: equipment.brand || '',
        model: equipment.model || '',
        capacity_btu: equipment.capacity_btu || '',
        location: equipment.location || '',
        cost_center_id: equipment.cost_center_id || '',
        installation_date: equipment.installation_date || '',
        last_maintenance_date: equipment.last_maintenance_date || '',
        status: equipment.status || 'operational',
        operation_mode: equipment.operation_mode || '',
        notes: equipment.notes || '',
      });
    } else {
      setForm(defaultForm);
    }
    setCreatingCentro(false);
    setNewCentroName('');
    setNewCentroCode('');
  }, [equipment, open]);

  // Auto-preencher centro de custo quando localização muda
  const handleLocationChange = (location) => {
    const autoCentro = locationToCentroMap[location] || form.cost_center_id;
    setForm(f => ({ ...f, location, cost_center_id: autoCentro }));
  };

  // Criar novo centro de custo inline
  const handleCreateCentro = async () => {
    if (!newCentroName.trim()) return;
    setSavingCentro(true);
    const created = await base44.entities.CentroDeCusto.create({
      name: newCentroName.trim(),
      code: newCentroCode.trim() || undefined,
      locations: form.location ? [form.location] : [],
    });
    await queryClient.invalidateQueries({ queryKey: ['centros-custo'] });
    setForm(f => ({ ...f, cost_center_id: created.id }));
    setCreatingCentro(false);
    setNewCentroName('');
    setNewCentroCode('');
    setSavingCentro(false);
  };

  const getNextPreventiveDate = () => {
    if (!form.operation_mode) return null;
    const months = OPERATION_MODES[form.operation_mode]?.months;
    if (!months) return null;
    const baseDate = form.last_maintenance_date || form.installation_date;
    const base = baseDate ? parseDate(baseDate) : new Date();
    return addMonths(base, months);
  };

  const nextDate = getNextPreventiveDate();
  const selectedCentro = centros.find(c => c.id === form.cost_center_id);

  const handleSubmit = (e) => {
    e.preventDefault();
    const months = form.operation_mode ? OPERATION_MODES[form.operation_mode]?.months : undefined;
    onSave({
      ...form,
      capacity_btu: form.capacity_btu ? Number(form.capacity_btu) : undefined,
      maintenance_interval_months: months,
      next_preventive_date: nextDate ? format(nextDate, 'yyyy-MM-dd') : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome / Identificação *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <Label>Marca</Label>
              <Input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
            </div>
            <div>
              <Label>Código de Patrimônio</Label>
              <Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
            </div>
            <div>
              <Label>BTUs</Label>
              <Input type="number" value={form.capacity_btu} onChange={e => setForm({...form, capacity_btu: e.target.value})} />
            </div>
            <div>
              <Label>Localização *</Label>
              <Input value={form.location} onChange={e => handleLocationChange(e.target.value)} required />
            </div>

            {/* Centro de Custo */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <Label>Centro de Custo</Label>
                {!creatingCentro && (
                  <button
                    type="button"
                    onClick={() => setCreatingCentro(true)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Criar novo
                  </button>
                )}
              </div>

              {creatingCentro ? (
                <div className="border border-primary/30 rounded-xl p-3 bg-primary/5 space-y-2">
                  <p className="text-xs font-medium text-primary">Novo Centro de Custo</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Nome *</Label>
                      <Input
                        value={newCentroName}
                        onChange={e => setNewCentroName(e.target.value)}
                        placeholder="Ex: Administração"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Código</Label>
                      <Input
                        value={newCentroCode}
                        onChange={e => setNewCentroCode(e.target.value)}
                        placeholder="Ex: CC-001"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {form.location ? `A localização "${form.location}" será vinculada automaticamente.` : 'Preencha a localização para vincular automaticamente.'}
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" className="h-7 text-xs gap-1" onClick={handleCreateCentro} disabled={!newCentroName.trim() || savingCentro}>
                      <Check className="w-3 h-3" /> {savingCentro ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setCreatingCentro(false)}>
                      <X className="w-3 h-3" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Select value={form.cost_center_id} onValueChange={v => setForm({...form, cost_center_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um centro de custo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhum</SelectItem>
                      {centros.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.code ? `[${c.code}] ` : ''}{c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCentro && (
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-primary">
                      <Building2 className="w-3 h-3" />
                      <span>Vinculado a: <strong>{selectedCentro.name}</strong></span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <Label>Data de Instalação</Label>
              <Input type="date" value={form.installation_date} onChange={e => setForm({...form, installation_date: e.target.value})} />
            </div>
            <div>
              <Label>Data da Última Manutenção</Label>
              <Input type="date" value={form.last_maintenance_date} onChange={e => setForm({...form, last_maintenance_date: e.target.value})} />
            </div>
            <div>
              <Label>Regime de Operação</Label>
              <Select value={form.operation_mode} onValueChange={v => setForm({...form, operation_mode: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(OPERATION_MODES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operacional</SelectItem>
                  <SelectItem value="maintenance">Em Manutenção</SelectItem>
                  <SelectItem value="broken">Quebrado</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {nextDate && (
              <div className="col-span-2 flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <CalendarClock className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Próxima manutenção preventiva</p>
                  <p className="font-semibold text-sm text-primary">
                    {format(nextDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{isEditing ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}