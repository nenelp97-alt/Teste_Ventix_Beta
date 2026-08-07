import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend } from
'recharts';
import { DollarSign, Wrench, TrendingUp, User, Star, Download, Building2, Hash, Percent, Wallet, AlertTriangle, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDate } from '@/lib/dateUtils';

const COLORS = Array(10).fill('hsl(var(--foreground))');
const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function HistoricoDash() {
  const [centroCustoFiltro, setCentroCustoFiltro] = useState('all');
  const [mesSelecionado, setMesSelecionado] = useState('all');
  const [orcamentoMensal, setOrcamentoMensal] = useState(() => {
    const saved = localStorage.getItem('orcamentoMensal');
    return saved ? Number(saved) : 5000;
  });
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const { data: maintenances = [], isLoading: loadingM } = useQuery({
    queryKey: ['maintenances-ticket'],
    queryFn: () => base44.entities.Maintenance.list()
  });

  const { data: equipments = [], isLoading: loadingE } = useQuery({
    queryKey: ['equipments-ticket'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const { data: centros = [], isLoading: loadingC } = useQuery({
    queryKey: ['centros-custo'],
    queryFn: () => base44.entities.CentroDeCusto.list()
  });

  const isLoading = loadingM || loadingE || loadingC;

  // Mapas
  const equipMap = useMemo(() => {
    const m = {};
    equipments.forEach((e) => {m[e.id] = e;});
    return m;
  }, [equipments]);

  const centroMap = useMemo(() => {
    const m = {};
    centros.forEach((c) => {m[c.id] = c;});
    return m;
  }, [centros]);

  // Enriquecer manutenções com dados do equipamento e centro de custo
  const enriched = useMemo(() => maintenances.
  filter((m) => m.status === 'completed' && m.cost > 0).
  map((m) => {
    const eq = equipMap[m.equipment_id] || {};
    const centro = centroMap[eq.cost_center_id] || null;
    return {
      ...m,
      location: eq.location || 'N/A',
      equip_name: eq.name || 'N/A',
      cost_center_id: eq.cost_center_id || null,
      cost_center_name: centro ? centro.code ? `[${centro.code}] ${centro.name}` : centro.name : 'Sem Centro de Custo'
    };
  }), [maintenances, equipMap, centroMap]);

  // Meses disponíveis (apenas com dados)
  const availableMonths = useMemo(() => {
    const months = new Set();
    enriched.forEach((m) => {
      if (m.completed_date) {
        months.add(format(startOfMonth(parseDate(m.completed_date)), 'yyyy-MM'));
      }
    });
    return [...months].sort().reverse();
  }, [enriched]);

  // Gasto do mês atual (para orçamento)
  const currentMonthKey = format(startOfMonth(new Date()), 'yyyy-MM');
  const gastoMesAtual = enriched
    .filter(m => m.completed_date && format(startOfMonth(parseDate(m.completed_date)), 'yyyy-MM') === currentMonthKey)
    .reduce((s, m) => s + (Number(m.cost) || 0), 0);

  // Filtrar por centro de custo e mês
  const filtered = useMemo(() => enriched.filter((m) => {
    if (centroCustoFiltro !== 'all' && m.cost_center_id !== centroCustoFiltro) return false;
    if (mesSelecionado !== 'all') {
      if (!m.completed_date) return false;
      const mesKey = format(startOfMonth(parseDate(m.completed_date)), 'yyyy-MM');
      if (mesKey !== mesSelecionado) return false;
    }
    return true;
  }), [enriched, centroCustoFiltro, mesSelecionado]);

  // KPIs principais
  const totalGasto = filtered.reduce((s, m) => s + (Number(m.cost) || 0), 0);
  const totalServicos = filtered.length;
  const ticketMedio = totalServicos > 0 ? totalGasto / totalServicos : 0;

  // Fornecedor mais demandado
  const fornecedorStats = useMemo(() => {
    const acc = {};
    filtered.forEach((m) => {
      const f = m.technician || 'Sem fornecedor';
      if (!acc[f]) acc[f] = { nome: f, qtd: 0, total: 0 };
      acc[f].qtd += 1;
      acc[f].total += Number(m.cost) || 0;
    });
    return Object.values(acc).sort((a, b) => b.qtd - a.qtd);
  }, [filtered]);

  const topFornecedor = fornecedorStats[0] || null;

  // Gastos mensais por fornecedor
  const gastosMensaisFornecedor = useMemo(() => {
    const mapa = {};
    filtered.forEach((m) => {
      if (!m.completed_date) return;
      const data = parseDate(m.completed_date);
      const mesKey = format(startOfMonth(data), 'yyyy-MM');
      const forn = m.technician || 'Sem fornecedor';
      if (!mapa[mesKey]) mapa[mesKey] = {};
      mapa[mesKey][forn] = (mapa[mesKey][forn] || 0) + (Number(m.cost) || 0);
    });
    return Object.entries(mapa).
    sort(([a], [b]) => a.localeCompare(b)).
    map(([mes, fns]) => ({
      mes: format(parseDate(mes + '-01'), 'MMM/yy', { locale: ptBR }),
      ...fns
    }));
  }, [filtered]);

  const allFornecedores = useMemo(() => {
    const s = new Set();
    gastosMensaisFornecedor.forEach((row) => {
      Object.keys(row).forEach((k) => {if (k !== 'mes') s.add(k);});
    });
    return [...s];
  }, [gastosMensaisFornecedor]);

  // Gastos por mês (geral)
  const gastosPorMes = useMemo(() => {
    const acc = {};
    filtered.forEach((m) => {
      if (!m.completed_date) return;
      const data = parseDate(m.completed_date);
      const mesKey = format(startOfMonth(data), 'yyyy-MM');
      if (!acc[mesKey]) acc[mesKey] = { valor: 0, qtd: 0 };
      acc[mesKey].valor += Number(m.cost) || 0;
      acc[mesKey].qtd += 1;
    });
    return Object.entries(acc).
    sort(([a], [b]) => a.localeCompare(b)).
    map(([mes, v]) => ({
      mes: format(parseDate(mes + '-01'), 'MMM/yy', { locale: ptBR }),
      valor: v.valor,
      ticket: v.qtd > 0 ? v.valor / v.qtd : 0,
      qtd: v.qtd
    }));
  }, [filtered]);

  // KPIs por Centro de Custo
  const kpisPorCentro = useMemo(() => {
    const acc = {};
    // Inclui todos os centros cadastrados, mesmo sem OS
    centros.forEach((c) => {
      const nome = c.code ? `[${c.code}] ${c.name}` : c.name;
      acc[c.id] = { id: c.id, nome, total: 0, qtd: 0 };
    });
    // Agrupa as OS
    enriched.forEach((m) => {
      const key = m.cost_center_id || '__sem_cc__';
      if (key === '__sem_cc__') {
        if (!acc[key]) acc[key] = { id: key, nome: 'Sem Centro de Custo', total: 0, qtd: 0 };
      }
      if (acc[key]) {
        acc[key].total += Number(m.cost) || 0;
        acc[key].qtd += 1;
      }
    });
    const totalGeral = Object.values(acc).reduce((s, v) => s + v.total, 0);
    return Object.values(acc).
    map((v) => ({
      ...v,
      ticket: v.qtd > 0 ? v.total / v.qtd : 0,
      percent: totalGeral > 0 ? v.total / totalGeral * 100 : 0
    })).
    filter((v) => v.qtd > 0).
    sort((a, b) => b.total - a.total);
  }, [enriched, centros]);

  const exportCSV = () => {
    const headers = ['Equipamento', 'Local', 'Centro de Custo', 'Técnico/Fornecedor', 'Tipo', 'Status', 'Data Agendada', 'Data Conclusão', 'Custo (R$)', 'Descrição', 'Observações'];
    const rows = filtered.map((m) => [
    m.equip_name, m.location, m.cost_center_name,
    m.technician || '', m.type || '', m.status || '',
    m.scheduled_date || '', m.completed_date || '',
    (Number(m.cost) || 0).toFixed(2).replace('.', ','),
    m.description || '', m.notes || '']
    );
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = '\uFEFF' + [headers, ...rows].map((r) => r.map(escape).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;a.download = 'manutencoes_por_centro_custo.csv';a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Análise de Custos</h1>
          <p className="text-muted-foreground mt-1">Ticket médio, centros de custo e fornecedores</p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <Button variant="outline" className="gap-2 shrink-0" onClick={exportCSV}>
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
          <Select value={centroCustoFiltro} onValueChange={setCentroCustoFiltro}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Centro de Custo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Centros</SelectItem>
              {centros.map((c) =>
              <SelectItem key={c.id} value={c.id}>
                  {c.code ? `[${c.code}] ` : ''}{c.name}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Mês" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {availableMonths.map(mes => (
                <SelectItem key={mes} value={mes}>
                  {format(parseDate(mes + '-01'), 'MMMM/yy', { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
        { label: 'Total Gasto', value: fmt(totalGasto), icon: DollarSign, color: 'bg-primary/10 text-primary' },
        { label: 'Ordens de Serviço', value: totalServicos, icon: Wrench, color: 'bg-primary/10 text-primary' },
        { label: 'Centros de Custo', value: kpisPorCentro.length, icon: Building2, color: 'bg-accent/10 text-accent' },
        { label: 'Ticket Médio', value: fmt(ticketMedio), icon: TrendingUp, color: 'bg-secondary/10 text-secondary' }].
        map((kpi, i) =>
        <div key={i} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                <p className="text-xl font-bold mt-1">{kpi.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}
        {/* Orçamento Mensal */}
        {(() => {
          const overspent = gastoMesAtual > orcamentoMensal;
          const excesso = gastoMesAtual - orcamentoMensal;
          const restante = orcamentoMensal - gastoMesAtual;
          const handleSaveBudget = () => {
            const val = Number(budgetInput.replace(',', '.'));
            if (!isNaN(val) && val > 0) {
              setOrcamentoMensal(val);
              localStorage.setItem('orcamentoMensal', String(val));
            }
            setEditingBudget(false);
          };
          return (
            <div className={`bg-card rounded-2xl p-5 border shadow-sm ${overspent ? 'border-destructive' : 'border-border'}`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Orçamento Mensal</p>
                  {editingBudget ? (
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="text"
                        value={budgetInput}
                        onChange={e => setBudgetInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveBudget()}
                        className="h-7 w-20 text-sm"
                        autoFocus
                      />
                      <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleSaveBudget}>
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className={`text-xl font-bold ${overspent ? 'text-destructive' : 'text-secondary'}`}>
                        {fmt(orcamentoMensal)}
                      </p>
                      <button onClick={() => { setEditingBudget(true); setBudgetInput(String(orcamentoMensal)); }}>
                        <Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  )}
                  <p className={`text-xs mt-1 ${overspent ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    {overspent ? `Excedido em ${fmt(excesso)}` : `Restam ${fmt(restante)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">Gasto: {fmt(gastoMesAtual)}</p>
                </div>
                <div className={`p-2.5 rounded-xl shrink-0 ${overspent ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10 text-secondary'}`}>
                  {overspent ? <AlertTriangle className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Indicadores por Centro de Custo */}
      {kpisPorCentro.length > 0 &&
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Indicadores por Centro de Custo
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left pb-3 pr-4 font-medium">Centro de Custo</th>
                  <th className="text-right pb-3 px-4 font-medium">
                    <span className="flex items-center justify-end gap-1"><DollarSign className="w-3 h-3" /> Custo Total</span>
                  </th>
                  <th className="text-right pb-3 px-4 font-medium">
                    <span className="flex items-center justify-end gap-1"><Hash className="w-3 h-3" /> Qtd OS</span>
                  </th>
                  <th className="text-right pb-3 px-4 font-medium">
                    <span className="flex items-center justify-end gap-1"><TrendingUp className="w-3 h-3" /> Ticket Médio</span>
                  </th>
                  <th className="text-right pb-3 pl-4 font-medium">
                    <span className="flex items-center justify-end gap-1"><Percent className="w-3 h-3" /> % Custos</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {kpisPorCentro.map((c, i) =>
              <tr key={c.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="font-medium">{c.nome}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">{fmt(c.total)}</td>
                    <td className="py-3 px-4 text-right">{c.qtd}</td>
                    <td className="py-3 px-4 text-right">{fmt(c.ticket)}</td>
                    <td className="py-3 pl-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full hidden sm:block">
                          <div className="h-full rounded-full" style={{ width: `${c.percent}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                        <span>{c.percent.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }

      {/* Gráfico pizza por centro de custo */}
      {kpisPorCentro.length > 0 &&
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <h3 className="font-semibold mb-4 text-sm">Distribuição de Custos por Centro</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kpisPorCentro} dataKey="total" nameKey="nome" cx="50%" cy="45%" outerRadius={70} label={({ percent }) => `${(percent <= 1 ? percent * 100 : percent).toFixed(1)}%`} labelLine={false}>
                    {kpisPorCentro.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ticket médio por centro de custo */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <h3 className="font-semibold text-base mb-4">Ticket Médio por Centro de Custo</h3>
            {kpisPorCentro.length === 0 ?
          <p className="text-sm text-muted-foreground text-center py-8">Sem dados.</p> :

          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {kpisPorCentro.map((c, i) => {
              const maxTicket = kpisPorCentro[0]?.ticket || 1;
              return (
                <div key={c.id} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-primary/10 text-primary shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate">{c.nome}</span>
                          <span className="text-muted-foreground shrink-0 ml-2 text-xs">{fmt(c.ticket)} · {c.qtd} OS</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${c.ticket / maxTicket * 100}%` }} />
                        </div>
                      </div>
                    </div>);

            })}
              </div>
          }
          </div>
        </div>
      }

      {/* Fornecedor destaque + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {topFornecedor &&
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Star className="w-4 h-4 text-secondary fill-current" /> Fornecedor #1
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-base">{topFornecedor.nome}</p>
                <p className="text-xs text-muted-foreground">{topFornecedor.qtd} atendimentos</p>
              </div>
            </div>
            <div className="mt-2 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Total recebido</p>
              <p className="text-lg font-bold text-primary">{fmt(topFornecedor.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">Ticket médio: {fmt(topFornecedor.total / topFornecedor.qtd)}</p>
            </div>
          </div>
        }

        <div className={`${topFornecedor ? 'lg:col-span-2' : 'lg:col-span-3'} bg-card rounded-2xl p-6 border border-border shadow-sm`}>
          <h3 className="font-semibold text-base mb-4">Ranking de Fornecedores</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {fornecedorStats.length === 0 ?
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum serviço concluído com custo registrado.</p> :
            fornecedorStats.map((f, i) =>
            <div key={f.nome} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate">{f.nome}</span>
                    <span className="text-muted-foreground shrink-0 ml-2 text-xs">{f.qtd} atend. · {fmt(f.total)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${fornecedorStats[0]?.qtd > 0 ? f.qtd / fornecedorStats[0].qtd * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gastos mensais por fornecedor */}
      {gastosMensaisFornecedor.length > 0 &&
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="font-semibold text-base mb-4">Valores Pagos por Fornecedor / Mês</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gastosMensaisFornecedor} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 18% 90%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v, name) => [fmt(v), name]} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                {allFornecedores.map((f, i) =>
              <Bar key={f} dataKey={f} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} stackId="a" />
              )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      }

      {/* Evolução do ticket médio */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h3 className="font-semibold text-base mb-4">Evolução do Ticket Médio (R$)</h3>
        {gastosPorMes.length === 0 ?
        <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período.</p> :

        <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gastosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 18% 90%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="ticket" stroke="hsl(210 90% 50%)" strokeWidth={2} dot={{ r: 4 }} name="Ticket Médio" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        }
      </div>
    </div>);

}