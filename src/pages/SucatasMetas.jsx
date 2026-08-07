import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Target, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SucatasMetas() {
  const [metaReceita, setMetaReceita] = useState(() => localStorage.getItem('sucatas_meta_receita') || '150000');
  const [metaPeso, setMetaPeso] = useState(() => localStorage.getItem('sucatas_meta_peso') || '50000');
  const [isEditing, setIsEditing] = useState(false);

  const { data: sucatas = [] } = useQuery({ queryKey: ['sucatas-vendas'], queryFn: () => JSON.parse(localStorage.getItem('ventix_sucatas_vendas') || '[]') });
  const totalReceita = sucatas.reduce((acc, item) => acc + (Number(item.valor_total) || (Number(item.quantidade) * Number(item.valor_unit)) || 0), 0);
  const totalKg = sucatas.filter(i => i.unid_medida === 'Kg').reduce((acc, i) => acc + Number(i.quantidade), 0);
  
  const fmtCurrency = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleSaveMetas = () => {
    localStorage.setItem('sucatas_meta_receita', metaReceita);
    localStorage.setItem('sucatas_meta_peso', metaPeso);
    setIsEditing(false);
  };

  const percReceita = Math.min(100, (totalReceita / Number(metaReceita || 1)) * 100);
  const percPeso = Math.min(100, (totalKg / Number(metaPeso || 1)) * 100);

  return (
    <div className="p-8 space-y-6 bg-[#0b132b] text-slate-100 min-h-full font-mono">
      <div className="flex justify-between items-center bg-[#070d1f] p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-white">Metas de Vendas de Sucata (Anual/Mensal)</h1>
          <p className="text-xs text-slate-400">Acompanhamento e definição de metas comerciais.</p>
        </div>
        <Button onClick={() => setIsEditing(true)} className="bg-slate-800 hover:bg-slate-700 text-white text-xs gap-2">
          <Settings className="w-4 h-4" /> Definir Metas
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#070d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400" /> Meta de Receita ({fmtCurrency(metaReceita)})</h3>
          <p className="text-xs text-slate-400">Realizado: <strong className="text-emerald-400">{fmtCurrency(totalReceita)}</strong> ({percReceita.toFixed(1)}%)</p>
          <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${percReceita}%` }} />
          </div>
        </div>

        <div className="bg-[#070d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2"><Target className="w-4 h-4 text-blue-400" /> Meta de Volume ({Number(metaPeso).toLocaleString('pt-BR')} Kg)</h3>
          <p className="text-xs text-slate-400">Realizado: <strong className="text-blue-400">{totalKg.toLocaleString('pt-BR')} Kg</strong> ({percPeso.toFixed(1)}%)</p>
          <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${percPeso}%` }} />
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#070d1f] border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-base font-bold text-white">Configurar Metas de Vendas</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400">Nova Meta de Receita (R$)</label>
                <Input type="number" value={metaReceita} onChange={(e) => setMetaReceita(e.target.value)} className="bg-slate-900 border-slate-800 text-xs text-white" />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Nova Meta de Volume (Kg)</label>
                <Input type="number" value={metaPeso} onChange={(e) => setMetaPeso(e.target.value)} className="bg-slate-900 border-slate-800 text-xs text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-xs text-slate-400">Cancelar</Button>
              <Button onClick={handleSaveMetas} className="bg-emerald-600 hover:bg-emerald-500 text-xs text-white">Salvar Metas</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}