import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Recycle, PieChart as PieIcon, FileText, 
  BarChart3, Target, Users 
} from 'lucide-react';

export default function SucatasSidebar() {
  const navigate = useNavigate();
  const currentPath = useLocation().pathname;

  return (
    <aside className="w-64 bg-[#070d1f] border-r border-slate-800 p-5 flex flex-col justify-between shrink-0 font-mono">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
            <Recycle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Gestão de Sucatas</h2>
            <p className="text-[11px] text-slate-400">Comercialização</p>
          </div>
        </div>

        <nav className="space-y-1.5 pt-2">
          <button
            onClick={() => navigate('/sucatas')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentPath === '/sucatas' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <PieIcon className="w-4 h-4" /> Dashboard Sucatas
          </button>

          <button
            onClick={() => navigate('/sucatas/vendas')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentPath === '/sucatas/vendas' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" /> Registro de Vendas
          </button>

          <button
            onClick={() => navigate('/sucatas/relatorios')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentPath === '/sucatas/relatorios' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Relatórios e Análises
          </button>

          <button
            onClick={() => navigate('/sucatas/metas')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentPath === '/sucatas/metas' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Target className="w-4 h-4" /> Metas de Vendas (Anual)
          </button>

          <button
            onClick={() => navigate('/sucatas/clientes')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentPath === '/sucatas/clientes' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" /> Clientes / Fornecedores
          </button>
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 px-1">
        Painel Operacional v2.0
      </div>
    </aside>
  );
}