import React, { useState } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AirVent, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { parseDate } from '@/lib/dateUtils';
import { differenceInDays } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import StatCard from '@/components/dashboard/StatCard';
import ExportButton from '@/components/dashboard/ExportButton';
import UpcomingMaintenance from '@/components/dashboard/UpcomingMaintenance';
import StatusChart from '@/components/dashboard/StatusChart';
import MonthlyChart from '@/components/dashboard/MonthlyChart';
import PendingMaintenanceDialog from '@/components/dashboard/PendingMaintenanceDialog';
import MaintenanceListDialog from '@/components/dashboard/MaintenanceListDialog';
import EquipmentSelectionDialog from '@/components/dashboard/EquipmentSelectionDialog';
import MaintenanceFormDialog from '@/components/maintenance/MaintenanceFormDialog';

const ALERT_DAYS = 15;

export default function Dashboard() {
  const [showPending, setShowPending] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showOverdue, setShowOverdue] = useState(false);
  const [showEquipments, setShowEquipments] = useState(false);
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [presetMaint, setPresetMaint] = useState(null);
  const queryClient = useQueryClient();

  const createMaintMut = useMutation({
    mutationFn: (data) => base44.entities.Maintenance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      setShowMaintForm(false);
      setShowPending(false);
      setShowEquipments(false);
      setPresetMaint(null);
      toast({ title: 'Manutenção registrada', description: 'Registro adicionado à aba Manutenções.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao registrar', description: error.message || 'Tente novamente.', variant: 'destructive' });
    }
  });

  const handleRegisterMaintenance = (equipment) => {
    setPresetMaint({ equipment_id: equipment.id, type: 'corrective' });
    setShowPending(false);
    setShowEquipments(false);
    setShowMaintForm(true);
  };

  const handleSaveMaintenance = (data) => {
    createMaintMut.mutate(data);
  };

  const { data: equipments = [], isLoading: loadingEquip } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const { data: maintenances = [], isLoading: loadingMaint } = useQuery({
    queryKey: ['maintenances'],
    queryFn: () => base44.entities.Maintenance.list()
  });

  const { data: centros = [] } = useQuery({
    queryKey: ['centros-custo'],
    queryFn: () => base44.entities.CentroDeCusto.list()
  });

  const isLoading = loadingEquip || loadingMaint;

  const totalEquip = equipments.length;
  const operational = equipments.filter((e) => e.status === 'operational').length;
  const pendingMaint = equipments.filter((e) => {
    if (!e.next_preventive_date || e.status === 'inactive') return false;
    const daysUntil = differenceInDays(parseDate(e.next_preventive_date), new Date());
    return daysUntil <= ALERT_DAYS;
  }).length;
  const completedList = maintenances.filter((m) => m.status === 'completed');
  const completedMaint = completedList.length;
  const overdueList = maintenances.filter((m) => {
    if (m.status !== 'scheduled') return false;
    const d = parseDate(m.scheduled_date);
    return d < new Date() && d.toDateString() !== new Date().toDateString();
  });
  const overdue = overdueList.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold tracking-tight text-3xl">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do sistema de climatização</p>
          <p className="mt-0.5 [font-family:'Albert_Sans',_sans-serif] text-xs text-[#000000]">Desenvolvido por: BRUNO SANTOS</p>
        </div>
        <ExportButton equipments={equipments} maintenances={maintenances} centros={centros} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Equipamentos" value={totalEquip} icon={AirVent} color="primary" subtitle={`${operational} operacionais`} onClick={() => setShowEquipments(true)} />
        <StatCard title="Manutenções Pendentes" value={pendingMaint} icon={Clock} color="secondary" onClick={() => setShowPending(true)} />
        <StatCard title="Concluídas" value={completedMaint} icon={CheckCircle2} color="accent" onClick={() => setShowCompleted(true)} />
        <StatCard title="Atrasadas" value={overdue} icon={AlertTriangle} color="destructive" onClick={() => setShowOverdue(true)} />
      </div>

      <PendingMaintenanceDialog open={showPending} onOpenChange={setShowPending} equipments={equipments} alertDays={ALERT_DAYS} onRegisterMaintenance={handleRegisterMaintenance} />
      <MaintenanceListDialog open={showCompleted} onOpenChange={setShowCompleted} title="Manutenções Concluídas" description="Histórico de manutenções já finalizadas." maintenances={completedList} equipments={equipments} variant="completed" />
      <MaintenanceListDialog open={showOverdue} onOpenChange={setShowOverdue} title="Manutenções Atrasadas" description="Manutenções agendadas com data vencida." maintenances={overdueList} equipments={equipments} variant="overdue" />
      <EquipmentSelectionDialog open={showEquipments} onOpenChange={setShowEquipments} equipments={equipments} onRegisterMaintenance={handleRegisterMaintenance} />
      <MaintenanceFormDialog open={showMaintForm} onOpenChange={setShowMaintForm} equipments={equipments} preset={presetMaint} onSave={handleSaveMaintenance} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart equipments={equipments} />
        <MonthlyChart maintenances={maintenances} />
      </div>

      {/* Upcoming */}
      <UpcomingMaintenance maintenances={maintenances} equipments={equipments} />
    </div>
  );
}