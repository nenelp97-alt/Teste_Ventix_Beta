import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  Wrench,
  Building2,
  TrendingUp,
  Wallet,
  Download,
  Edit2,
  Bug,
} from 'lucide-react';



import { base44 } from '@/api/apiClient';

const fmtCurrency = (val) =>
  Number(val || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

function CostCard({ title, value, subtext, icon: Icon, iconColor, iconBg, onEdit }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-card p-5 shadow-sm border border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bold text-foreground">{value}</h3>
          {onEdit && (
            <button onClick={onEdit} className="text-muted-foreground hover:text-foreground">
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>
        {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  );
}

export default function TicketMedio() {
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [monthlyBudget, setMonthlyBudget] = useState(5000);

  // Busca todas as manutenções cadastradas
  const { data: maintenances = [], isLoading } = useQuery({
    queryKey: ['maintenances'],
    queryFn: () => base44.entities.Maintenance.list(),
  });

  // Processamento ultra-abrangente sem travar no status
  const analysis = useMemo(() => {
    // Pegamos qualquer manutenção que tenha algum custo preenchido ou status concluído
    const validMaintenances = maintenances.filter((m) => {
      if (!m) return false;

      // Extrai qualquer campo numérico disponível
      const rawCost = m.cost ?? m.custo ?? m.price ?? m.value ?? m.valor ?? m.cost_value ?? 0;
      const cost = parseFloat(String(rawCost).replace(',', '.'));

      // Pega qualquer status
      const st = String(m.status || m.situacao || m.state || '').toLowerCase();

      // Aceita se tiver valor > 0 OU se o status for de conclusão
      const isCompleted =
        st.includes('concl') ||
        st.includes('realiz') ||
        st.includes('comp') ||
        st.includes('finaliz');

      return (cost > 0 || isCompleted);
    });

    const totalCost = validMaintenances.reduce((acc, m) => {
      const rawCost = m.cost ?? m.custo ?? m.price ?? m.value ?? m.valor ?? m.cost_value ?? 0;
      const cost = parseFloat(String(rawCost).replace(',', '.')) || 0;
      return acc + cost;
    }, 0);

    const osCount = validMaintenances.length;

    const blockRankingMap = {};
    validMaintenances.forEach((m) => {
      const blockName = m.block || m.bloco || m.centro_custo || m.equipment_name || 'Geral';
      const rawCost = m.cost ?? m.custo ?? m.price ?? m.value ?? m.valor ?? m.cost_value ?? 0;
      const cost = parseFloat(String(rawCost).replace(',', '.')) || 0;
      blockRankingMap[blockName] = (blockRankingMap[blockName] || 0) + cost;
    });

    const blockRanking = Object.entries(blockRankingMap).map(([name, cost]) => ({
      name,
      cost,
    }));

    const chartData = [
      { month: 'jul/26', ticketMedio: osCount > 0 ? totalCost / osCount : 0, totalGasto: totalCost }
    ];

    return {
      totalCost,
      osCount,
      centersCount: blockRanking.length,
      blockRanking,
      chartData,
    };
  }, [maintenances]);

  const remainingBudget = monthlyBudget - analysis.totalCost;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 lg:p-10 space-y-8">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Análise de Custos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ticket Médio, Centros de Custo e Fornecedores
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm border border-border hover:bg-muted">
            <Download className="h-4 w-4 text-muted-foreground" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <CostCard
          title="Gasto Total"
          value={fmtCurrency(analysis.totalCost)}
          icon={DollarSign}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />

        <CostCard
          title="Ordens de serviço"
          value={analysis.osCount}
          icon={Wrench}
          iconColor="text-secondary"
          iconBg="bg-secondary/10"
        />

        <CostCard
          title="Centros de Custo"
          value={analysis.centersCount}
          icon={Building2}
          iconColor="text-accent"
          iconBg="bg-accent/10"
        />

        <CostCard
          title="Bilheteria"
          value={fmtCurrency(0)}
          icon={TrendingUp}
          iconColor="text-secondary"
          iconBg="bg-secondary/10"
        />

        <CostCard
          title="Orçamento Mensal"
          value={fmtCurrency(monthlyBudget)}
          subtext={`Restam ${fmtCurrency(remainingBudget)} | Gasto: ${fmtCurrency(analysis.totalCost)}`}
          icon={Wallet}
          iconColor="text-accent"
          iconBg="bg-accent/10"
        />
      </div>

      {/* RANKING */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border min-h-[160px]">
        <h2 className="text-base font-bold text-foreground mb-4">
          Ranking de blocos
        </h2>

        {analysis.blockRanking.length === 0 ? (
          <p className="text-center text-sm font-medium text-muted-foreground py-6">
            Nenhum serviço concluído com custo registrado.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {analysis.blockRanking.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span className="text-sm font-semibold text-foreground">{item.name}</span>
                <span className="text-sm font-bold text-foreground">{fmtCurrency(item.cost)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAINEL DE DEPURAÇÃO (DEBUG) - APONTARÁ O MOTIVO EXATO */}
      <div className="rounded-2xl bg-muted p-6 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Bug className="h-5 w-5 text-accent" />
          <h3 className="text-base font-bold text-foreground">
            Painel de Diagnóstico do Banco de Dados
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Total de manutenções retornadas da API: <strong className="text-foreground">{maintenances.length}</strong>
        </p>

        {maintenances.length === 0 ? (
          <p className="text-xs font-semibold text-destructive">
            Nenhuma manutenção foi encontrada na API (`base44.entities.Maintenance.list()`).
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium text-foreground">
              Estrutura exata do objeto gravado na API:
            </p>
            <pre className="bg-muted text-foreground p-4 rounded-xl text-xs overflow-x-auto">
              {JSON.stringify(maintenances, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}