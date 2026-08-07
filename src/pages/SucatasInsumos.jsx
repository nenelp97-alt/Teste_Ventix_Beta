import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Filter, DollarSign, Calendar, BarChart2 } from 'lucide-react';
import { base44 } from '@/api/apiClient';

export default function AnaliseInsumos() {
  const [insumoSelecionado, setInsumoSelecionado] = useState('');

  const { data: sucatas = [] } = useQuery({
    queryKey: ['sucatas-vendas'],
    queryFn: async () => {
      try {
        const res = await base44.entities.list('SucataVenda');
        if (res && res.length > 0) return res;
      } catch {}
      const localData = localStorage.getItem('ventix_sucatas_vendas');
      return localData ? JSON.parse(localData) : [];
    }
  });

  // Descobrir lista única de insumos/sucatas cadastrados
  const listaInsumos = [...new Set(sucatas.map(item => item.tipo_sucata || item.sucata || item.material || item.descricao).filter(Boolean))];

  // Filtrar as vendas pelo insumo escolhido e ordenar por data
  const vendasDoInsumo = sucatas
    .filter(item => {
      const nome = item.tipo_sucata || item.sucata || item.material || item.descricao;
      return insumoSelecionado ? nome === insumoSelecionado : true;
    })
    .sort((a, b) => new Date(a.data || a.created_at || 0) - new Date(b.data || b.created_at || 0));

  // Calcular variações de preço
  const precosComData = vendasDoInsumo.map(item => ({
    data: item.data || item.created_at || 'Data não informada',
    precoUnit: Number(item.valor_unit) || (Number(item.valor_total) / Number(item.quantidade)) || 0,
    quantidade: Number(item.quantidade) || 0,
    unidade: item.unid_medida || item.unidade || 'Kg'
  })).filter(i => i.precoUnit > 0);

  const ultimoPreco = precosComData[precosComData.length - 1]?.precoUnit || 0;
  const penultimoPreco = precosComData[precosComData.length - 2]?.precoUnit || 0;
  
  const diferencaPreco = penultimoPreco > 0 ? ultimoPreco - penultimoPreco : 0;
  const percentualVariacao = penultimoPreco > 0 ? (diferencaPreco / penultimoPreco) * 100 : 0;

  const fmtCurrency = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-8 space-y-6 bg-slate-50 text-slate-800 min-h-full font-mono">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Análise de Insumos</h1>
          <p className="text-xs text-slate-500 mt-1">Acompanhe o histórico de flutuação de preços e tendências de mercado.</p>
        </div>

        {/* Seletor de Insumo */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm w-full md:w-72">
          <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
          <select 
            value={insumoSelecionado} 
            onChange={(e) => setInsumoSelecionado(e.target.value)}
            className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none w-full cursor-pointer"
          >
            <option value="">Selecione um insumo...</option>
            {listaInsumos.map((insumo, idx) => (
              <option key={idx} value={insumo}>{insumo}</option>
            ))}
          </select>
        </div>
      </div>

      {!insumoSelecionado ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <BarChart2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">Nenhum insumo selecionado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Escolha um material no filtro acima para visualizar o histórico de variação de preços e comportamento das vendas.</p>
        </div>
      ) : (
        <>
          {/* Cards de Resumo do Insumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100"><DollarSign className="w-6 h-6" /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Último Preço Praticado</p>
                <h3 className="text-2xl font-bold text-slate-900">{fmtCurrency(ultimoPreco)}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`p-3 rounded-xl border ${diferencaPreco >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {diferencaPreco >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Variação vs. Venda Anterior</p>
                <h3 className={`text-2xl font-bold ${diferencaPreco >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {diferencaPreco >= 0 ? '+' : ''}{percentualVariacao.toFixed(1)}%
                </h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100"><Calendar className="w-6 h-6" /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total de Vendas Registradas</p>
                <h3 className="text-2xl font-bold text-slate-900">{precosComData.length}</h3>
              </div>
            </div>
          </div>

          {/* Histórico / Tabela de Flutuação */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm">Histórico de Preços: {insumoSelecionado}</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Quantidade</th>
                    <th className="pb-3">Valor Unitário</th>
                    <th className="pb-3 text-right">Tendência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {precosComData.map((item, index) => {
                    const precoAnterior = index > 0 ? precosComData[index - 1].precoUnit : item.precoUnit;
                    const subiu = item.precoUnit > precoAnterior;
                    const caiu = item.precoUnit < precoAnterior;

                    return (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="py-3 text-slate-700">{item.data}</td>
                        <td className="py-3 text-slate-700">{item.quantidade.toLocaleString('pt-BR')} {item.unidade}</td>
                        <td className="py-3 font-bold text-slate-900">{fmtCurrency(item.precoUnit)}</td>
                        <td className="py-3 text-right">
                          {index === 0 ? (
                            <span className="text-slate-400">-</span>
                          ) : subiu ? (
                            <span className="text-emerald-600 font-bold inline-flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Alta</span>
                          ) : caiu ? (
                            <span className="text-red-600 font-bold inline-flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Queda</span>
                          ) : (
                            <span className="text-slate-400">Estável</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}