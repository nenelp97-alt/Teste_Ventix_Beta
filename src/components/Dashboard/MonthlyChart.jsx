import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDate } from '@/lib/dateUtils';

export default function MonthlyChart({ maintenances }) {
  const monthMap = {};

  maintenances.forEach(m => {
    if (!m.scheduled_date) return;
    const month = format(startOfMonth(parseDate(m.scheduled_date)), 'yyyy-MM');
    if (!monthMap[month]) monthMap[month] = { preventive: 0, corrective: 0, emergency: 0 };
    const t = m.type || 'preventive';
    monthMap[month][t] = (monthMap[month][t] || 0) + 1;
  });

  const data = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, counts]) => ({
      month: format(parseDate(month + '-01'), 'MMM', { locale: ptBR }),
      Preventiva: counts.preventive,
      Corretiva: counts.corrective,
      Emergência: counts.emergency,
    }));

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="font-semibold text-lg mb-4">Manutenções por Mês</h3>
        <p className="text-muted-foreground text-sm text-center py-8">Sem dados</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="font-semibold text-lg mb-4">Manutenções por Mês</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid hsl(var(--border))' }}
            />
            <Bar dataKey="Preventiva" fill="#10b981" radius={[4,4,0,0]} />
            <Bar dataKey="Corretiva" fill="#3b82f6" radius={[4,4,0,0]} />
            <Bar dataKey="Emergência" fill="#f97316" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}