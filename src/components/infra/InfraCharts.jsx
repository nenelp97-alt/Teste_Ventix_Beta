import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDate } from '@/lib/dateUtils';
import { categoryLabels, CHART_COLORS, fmt } from './infraConstants';

const EmptyChart = () => (
  <div className="h-[250px] flex items-center justify-center">
    <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
  </div>
);

const getTotal = (r) => (Number(r.service_cost) || 0) + (Number(r.materials_cost) || 0);

export default function InfraCharts({ data }) {
  const evolution = useMemo(() => {
    const acc = {};
    data.forEach(r => {
      if (!r.scheduled_date) return;
      const d = parseDate(r.scheduled_date);
      const key = format(startOfMonth(d), 'yyyy-MM');
      acc[key] = (acc[key] || 0) + getTotal(r);
    });
    return Object.entries(acc)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, valor]) => ({ mes: format(parseDate(key + '-01'), 'MMM/yy', { locale: ptBR }), valor }));
  }, [data]);

  const byCategory = useMemo(() => {
    const acc = {};
    data.forEach(r => {
      const cat = r.category || 'other';
      acc[cat] = (acc[cat] || 0) + getTotal(r);
    });
    return Object.entries(acc)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, valor]) => ({ categoria: categoryLabels[cat] || cat, valor }));
  }, [data]);

  const bySupplier = useMemo(() => {
    const acc = {};
    data.forEach(r => {
      const sup = r.supplier || 'Sem fornecedor';
      acc[sup] = (acc[sup] || 0) + getTotal(r);
    });
    return Object.entries(acc)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([fornecedor, valor]) => ({ fornecedor, valor }));
  }, [data]);

  const costSplit = useMemo(() => {
    let servicos = 0, materiais = 0;
    data.forEach(r => { servicos += Number(r.service_cost) || 0; materiais += Number(r.materials_cost) || 0; });
    return [{ name: 'Serviços', value: servicos }, { name: 'Materiais', value: materiais }];
  }, [data]);

  const cardClass = "bg-card rounded-2xl p-6 border border-border shadow-sm";
  const titleClass = "font-semibold mb-4 text-sm";
  const tooltipStyle = { borderRadius: '12px', fontSize: '12px' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className={cardClass}>
        <h3 className={titleClass}>Evolução dos Gastos</h3>
        {evolution.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="mes" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmt(v)} contentStyle={tooltipStyle} />
              <Bar dataKey="valor" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={cardClass}>
        <h3 className={titleClass}>Gastos por Categoria</h3>
        {byCategory.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" fontSize={11} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="categoria" fontSize={11} width={80} />
              <Tooltip formatter={v => fmt(v)} contentStyle={tooltipStyle} />
              <Bar dataKey="valor" fill="hsl(var(--foreground))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={cardClass}>
        <h3 className={titleClass}>Top Fornecedores</h3>
        {bySupplier.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bySupplier} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" fontSize={11} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="fornecedor" fontSize={11} width={100} />
              <Tooltip formatter={v => fmt(v)} contentStyle={tooltipStyle} />
              <Bar dataKey="valor" fill="hsl(var(--foreground))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={cardClass}>
        <h3 className={titleClass}>Serviços vs Materiais</h3>
        {costSplit.every(c => c.value === 0) ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={costSplit} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70} label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {costSplit.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} contentStyle={tooltipStyle} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}