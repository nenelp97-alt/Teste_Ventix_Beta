import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function toCSV(headers, rows) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = headers.map(h => escape(h.label)).join(';');
  const body = rows.map(row => headers.map(h => escape(row[h.key])).join(';')).join('\n');
  return '\uFEFF' + header + '\n' + body; // BOM for Excel UTF-8
}

function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const equipHeaders = [
  { key: 'name', label: 'Nome' },
  { key: 'brand', label: 'Marca' },
  { key: 'model', label: 'Modelo' },
  { key: 'capacity_btu', label: 'BTUs' },
  { key: 'location', label: 'Localização' },
  { key: 'installation_date', label: 'Data Instalação' },
  { key: 'status', label: 'Status' },
  { key: 'notes', label: 'Observações' },
];

const maintHeaders = [
  { key: 'equipment_name', label: 'Equipamento' },
  { key: 'equipment_location', label: 'Localização' },
  { key: 'type', label: 'Tipo' },
  { key: 'status', label: 'Status' },
  { key: 'scheduled_date', label: 'Data Agendada' },
  { key: 'completed_date', label: 'Data Conclusão' },
  { key: 'technician', label: 'Técnico' },
  { key: 'cost', label: 'Custo (R$)' },
  { key: 'description', label: 'Descrição' },
  { key: 'notes', label: 'Observações' },
];

const statusLabels = {
  operational: 'Operacional', maintenance: 'Em Manutenção', broken: 'Quebrado', inactive: 'Inativo',
  scheduled: 'Agendada', in_progress: 'Em Andamento', completed: 'Concluída', cancelled: 'Cancelada',
  preventive: 'Preventiva', corrective: 'Corretiva', emergency: 'Emergência',
};

export default function ExportButton({ equipments, maintenances, centros = [] }) {
  const equipMap = {};
  equipments.forEach(e => { equipMap[e.id] = e; });

  const centroMap = {};
  centros.forEach(c => { centroMap[c.id] = c; });

  const handleExportEquip = () => {
    const rows = equipments.map(e => ({ ...e, status: statusLabels[e.status] || e.status }));
    downloadCSV('equipamentos.csv', toCSV(equipHeaders, rows));
  };

  const handleExportMaint = () => {
    const rows = maintenances.map(m => {
      const eq = equipMap[m.equipment_id] || {};
      return {
        ...m,
        equipment_name: eq.name || '',
        equipment_location: eq.location || '',
        type: statusLabels[m.type] || m.type,
        status: statusLabels[m.status] || m.status,
      };
    });
    downloadCSV('manutencoes.csv', toCSV(maintHeaders, rows));
  };

  const handleExportAll = () => {
    handleExportEquip();
    setTimeout(handleExportMaint, 300);
  };

  const handleExportRelatorioMensal = () => {
    // Agrupa manutenções concluídas por mês e centro de custo
    const completed = maintenances.filter(m => m.status === 'completed' && m.scheduled_date);

    // Mapa: "YYYY-MM|centro_id" -> { mes, centro, total_custo, qtd, tecnicos: Set }
    const grupos = {};
    completed.forEach(m => {
      const eq = equipMap[m.equipment_id] || {};
      const centroId = eq.cost_center_id || 'sem_centro';
      const centro = centroMap[centroId] || { name: 'Sem Centro de Custo', code: '' };
      const mes = m.scheduled_date.substring(0, 7); // YYYY-MM
      const key = `${mes}|${centroId}`;
      if (!grupos[key]) {
        grupos[key] = { mes, centro_nome: centro.name, centro_codigo: centro.code || '', total_custo: 0, qtd: 0, tecnicos: new Set() };
      }
      grupos[key].total_custo += Number(m.cost || 0);
      grupos[key].qtd += 1;
      if (m.technician) grupos[key].tecnicos.add(m.technician);
    });

    const headers = [
      { key: 'mes_label', label: 'Mês/Ano' },
      { key: 'centro_codigo', label: 'Código CC' },
      { key: 'centro_nome', label: 'Centro de Custo' },
      { key: 'qtd', label: 'Qtd. Manutenções' },
      { key: 'total_custo', label: 'Total Gasto (R$)' },
      { key: 'fornecedores', label: 'Fornecedores/Técnicos' },
    ];

    const rows = Object.values(grupos)
      .sort((a, b) => a.mes.localeCompare(b.mes) || a.centro_nome.localeCompare(b.centro_nome))
      .map(g => ({
        mes_label: format(new Date(g.mes + '-02'), "MMMM 'de' yyyy", { locale: ptBR }),
        centro_codigo: g.centro_codigo,
        centro_nome: g.centro_nome,
        qtd: g.qtd,
        total_custo: g.total_custo.toFixed(2).replace('.', ','),
        fornecedores: [...g.tecnicos].join(', ') || '—',
      }));

    const now = format(new Date(), 'yyyy-MM-dd');
    downloadCSV(`relatorio-mensal-${now}.csv`, toCSV(headers, rows));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar Excel
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Exportar para CSV (Excel)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportEquip}>📋 Equipamentos</DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportMaint}>🔧 Manutenções</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportAll}>⬇️ Ambos os arquivos</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportRelatorioMensal}>📊 Relatório Mensal por CC</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}