import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign, Wrench, TrendingUp, Users, Clock, Activity, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { parseDate } from '@/lib/dateUtils';
import StatCard from '@/components/dashboard/StatCard';
import InfraFilters from '@/components/infra/InfraFilters';
import InfraCharts from '@/components/infra/InfraCharts';
import InfraRecentList from '@/components/infra/InfraRecentList';
import InfraFormDialog from '@/components/infra/InfraFormDialog';
import { fmt } from '@/components/infra/infraConstants';

const getTotal = (r) => (Number(r.service_cost) || 0) + (Number(r.materials_cost) || 0);

export default function InfraDashboard() {
  const [filters, setFilters] = useState({ period: 'all', unit: 'all', category: 'all', supplier: 'all' });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['infra-maintenances'],
    queryFn: () => base44.entities.InfrastructureMaintenance.list()
  });

  const saveMut = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.InfrastructureMaintenance.update(editing.id, data)
      : base44.entities.InfrastructureMaintenance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infra-maintenances'] });
      setShowForm(false);
      setEditing(null);
      toast({ title: editing ? 'Manutenção atualizada' : 'Manutenção registrada' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const units = useMemo(() => [...new Set(records.map(r => r.unit).filter(Boolean))].sort(), [records]);
  const suppliers = useMemo(() => [...new Set(records.map(r => r.supplier).filter(Boolean))].sort(), [records]);

  const filtered = useMemo(() => records.filter(r => {
    if (filters.unit !== 'all' && r.unit !== filters.unit) return false;
    if (filters.category !== 'all' && r.category !== filters.category) return false;
    if (filters.supplier !== 'all' && r.supplier !== filters.supplier) return false;
    if (filters.period !== 'all') {
      const months = parseInt(filters.period);
      const limit = new Date();
      limit.setMonth(limit.getMonth() - months);
      const d = parseDate(r.scheduled_date);
      if (d < limit) return false;
    }
    return true;
  }), [records, filters]);

  const kpis = useMemo(() => {
    const active = filtered.filter(r => r.status !== 'cancelled');
    const completed = active.filter(r => r.status === 'completed');
    const completedCost = completed.reduce((s, r) => s + getTotal(r), 0);
    return {
      totalCost: active.reduce((s, r) => s + getTotal(r), 0),
      totalManutencoes: active.length,
      ticketMedio: completed.length > 0 ? completedCost / completed.length : 0,
      fornecedores: new Set(active.map(r => r.supplier).filter(Boolean)).size,
      abertas: active.filter(r => r.status === 'scheduled').length,
      andamento: active.filter(r => r.status === 'in_progress').length,
      concluidas: active.filter(r => r.status === 'completed').length,
    };
  }, [filtered]);

  const handleEdit = (item) => { setEditing(item); setShowForm(true); };
  const handleNew = () => { setEditing(null); setShowForm(true); };
  const handleSave = (data) => saveMut.mutate(data);

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
          <h1 className="font-bold tracking-tight text-3xl">Manutenções de Infraestrutura</h1>
          <p className="text-muted-foreground mt-1">Gestão de manutenções prediais e infraestrutura</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" /> Nova Manutenção
        </Button>
      </div>

      <InfraFilters filters={filters} setFilters={setFilters} units={units} suppliers={suppliers} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Gasto Total" value={fmt(kpis.totalCost)} icon={DollarSign} color="primary" />
        <StatCard title="Manutenções" value={kpis.totalManutencoes} icon={Wrench} color="secondary" />
        <StatCard title="Ticket Médio" value={fmt(kpis.ticketMedio)} icon={TrendingUp} color="accent" />
        <StatCard title="Fornecedores" value={fmt(kpis.fornecedores)} icon={Users} color="destructive" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Abertas" value={kpis.abertas} icon={Clock} color="secondary" />
        <StatCard title="Em Andamento" value={kpis.andamento} icon={Activity} color="primary" />
        <StatCard title="Concluídas" value={kpis.concluidas} icon={CheckCircle2} color="accent" />
      </div>

      <InfraCharts data={filtered} />
      <InfraRecentList data={filtered} onEdit={handleEdit} />
      <InfraFormDialog open={showForm} onOpenChange={setShowForm} maintenance={editing} onSave={handleSave} />
    </div>
  );
}