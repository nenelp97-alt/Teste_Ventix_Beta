import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function SucatasRelatorios() {
  const { data: sucatas = [] } = useQuery({ queryKey: ['sucatas-vendas'], queryFn: () => JSON.parse(localStorage.getItem('ventix_sucatas_vendas') || '[]') });
  const totalReceita = sucatas.reduce((acc, item) => acc + (Number(item.valor_total) || (Number(item.quantidade) * Number(item.valor_unit)) || 0), 0);
  const totalKg = sucatas.filter(i => i.unid_medida === 'Kg').reduce((acc, i) => acc + Number(i.quantidade), 0);
  const fmtCurrency = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-8 space-y-6 bg-[#0b132b] text-slate-100 min-h-full font-mono">
      <div className="flex justify-between items-center bg-[#070d1f] p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-white">Relatórios e Análises (Analytics)</h1>
          <p className="text-xs text-slate-400">Indicadores consolidados de desempenho e eficiência comercial.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#070d1f] p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" /> Faturamento Acumulado</h3>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs flex justify-between">
            <span className="text-slate-400">Total Arrecadado:</span>
            <span className="text-emerald-400 font-bold">{fmtCurrency(totalReceita)}</span>
          </div>
        </div>
        <div className="bg-[#070d1f] p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" /> Volume Geral</h3>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs flex justify-between">
            <span className="text-slate-400">Total em Peso:</span>
            <span className="text-blue-400 font-bold">{totalKg.toLocaleString('pt-BR')} Kg</span>
          </div>
        </div>
      </div>
    </div>
  );
}