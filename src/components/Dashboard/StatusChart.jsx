import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const STATUS_CONFIG = {
  operational: { label: 'Operacional', color: '#10b981' },
  maintenance: { label: 'Em Manutenção', color: '#3b82f6' },
  broken: { label: 'Quebrado', color: '#f97316' },
  inactive: { label: 'Inativo', color: '#ef4444' },
};

export default function StatusChart({ equipments }) {
  const counts = {};
  equipments.forEach(e => {
    const s = e.status || 'operational';
    counts[s] = (counts[s] || 0) + 1;
  });

  const data = Object.entries(counts).map(([key, value]) => ({
    name: STATUS_CONFIG[key]?.label || key,
    value,
    color: STATUS_CONFIG[key]?.color || '#94a3b8',
  }));

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="font-semibold text-lg mb-4">Status dos Equipamentos</h3>
        <p className="text-muted-foreground text-sm text-center py-8">Sem dados</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="font-semibold text-lg mb-4">Status dos Equipamentos</h3>
      <div className="flex items-center gap-6">
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid hsl(var(--border))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}