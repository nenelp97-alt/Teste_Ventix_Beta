import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  FileText, 
  Target, 
  Settings, 
  Trophy, 
  Award, 
  Calendar,
  Weight,
  Package,
  Droplet,
  Sparkles,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/apiClient';

export default function SucatasDashboard() {
  const [metaReceita, setMetaReceita] = useState(() => localStorage.getItem('sucatas_meta_receita') || '150000');
  const [metaPeso, setMetaPeso] = useState(() => localStorage.getItem('sucatas_meta_peso') || '50000');
  const [metaUnidade, setMetaUnidade] = useState(() => localStorage.getItem('sucatas_meta_unidade') || '1000');
  const [metaLitro, setMetaLitro] = useState(() => localStorage.getItem('sucatas_meta_litro') || '5000');
  const [isEditingMetas, setIsEditingMetas] = useState(false);

  // Estados para o Filtro por Período
  const currentDate = new Date();
  const [filtroMes, setFiltroMes] = useState(String(currentDate.getMonth() + 1)); // '1' a '12' ou 'todos'
  const [filtroAno, setFiltroAno] = useState(String(currentDate.getFullYear())); // Ex: '2026' ou 'todos'

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

  const parseNum = (val) => {
    if (!val) return 0;
    const str = String(val).trim();
    if (str.includes(',') && str.includes('.')) {
      const clean = str.replace(/\./g, '').replace(',', '.');
      const num = Number(clean);
      return isNaN(num) ? 0 : num;
    }
    if (str.includes(',')) {
      const clean = str.replace(',', '.');
      const num = Number(clean);
      return isNaN(num) ? 0 : num;
    }
    const num = Number(str);
    return isNaN(num) ? 0 : num;
  };

  // Filtragem dos registros com base no Mês e Ano selecionados
  const sucatasFiltradas = sucatas.filter(item => {
    if (!item) return false;
    const dataStr = item.data || item.created_at || item.data_venda || item.dataCriacao;
    if (!dataStr) return filtroMes === 'todos' && filtroAno === 'todos';

    const itemDate = new Date(dataStr);
    if (isNaN(itemDate.getTime())) return true;

    const itemAno = String(itemDate.getFullYear());
    const itemMes = String(itemDate.getMonth() + 1);

    const matchAno = filtroAno === 'todos' || itemAno === filtroAno;
    const matchMes = filtroMes === 'todos' || itemMes === filtroMes;

    return matchAno && matchMes;
  });

  const totalReceita = sucatasFiltradas.reduce((acc, item) => acc + (Number(item.valor_total) || (Number(item.quantidade) * Number(item.valor_unit)) || 0), 0);
  
  const totalKg = sucatasFiltradas
    .filter(item => {
      const u = (item.unid_medida || item.unidade || 'Kg').toLowerCase();
      return u === 'kg' || u === 'kgs' || u === 'quilo' || u === 'quilos';
    })
    .reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0);

  const totalUnidade = sucatasFiltradas
    .filter(item => {
      const u = (item.unid_medida || item.unidade || '').toLowerCase();
      return u.includes('unid') || u === 'un' || u === 'pç' || u === 'peça';
    })
    .reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0);

  const totalLitro = sucatasFiltradas
    .filter(item => {
      const u = (item.unid_medida || item.unidade || '').toLowerCase();
      return u.includes('litro') || u === 'l';
    })
    .reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0);

  const fmtCurrency = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const fmtMetaDisplay = (val, suffix = '') => {
    const raw = String(val || '').trim();
    if (!raw) return `0 ${suffix}`;
    const num = parseNum(raw);
    return `${num.toLocaleString('pt-BR', { minimumFractionDigits: raw.includes(',') ? 2 : 0, maximumFractionDigits: 2 })} ${suffix}`;
  };

  const fornecedoresMap = {};
  sucatasFiltradas.forEach(item => {
    const nomeFornecedor = item.fornecedor || item.cliente || item.nome_fornecedor || 'Não Identificado';
    const valorItem = Number(item.valor_total) || (Number(item.quantidade) * Number(item.valor_unit)) || 0;
    const qtdItem = Number(item.quantidade) || 0;

    if (!fornecedoresMap[nomeFornecedor]) {
      fornecedoresMap[nomeFornecedor] = { nome: nomeFornecedor, receita: 0, totalTransacoes: 0, volume: 0 };
    }
    fornecedoresMap[nomeFornecedor].receita += valorItem;
    fornecedoresMap[nomeFornecedor].totalTransacoes += 1;
    fornecedoresMap[nomeFornecedor].volume += qtdItem;
  });

  const rankingFornecedores = Object.values(fornecedoresMap)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 3);

  const sucatasMap = {};
  sucatasFiltradas.forEach(item => {
    const nomeSucata = item.tipo_sucata || item.sucata || item.material || item.descricao || 'Outros';
    const valorItem = Number(item.valor_total) || (Number(item.quantidade) * Number(item.valor_unit)) || 0;
    const qtdItem = Number(item.quantidade) || 0;
    const unidadeMedida = item.unid_medida || item.unidade || 'Kg';

    if (!sucatasMap[nomeSucata]) {
      sucatasMap[nomeSucata] = { nome: nomeSucata, receita: 0, quantidade: 0, unidade: unidadeMedida };
    }
    sucatasMap[nomeSucata].receita += valorItem;
    sucatasMap[nomeSucata].quantidade += qtdItem;
  });

  const rankingSucatas = Object.values(sucatasMap)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 3);

  const handleSaveMetas = () => {
    localStorage.setItem('sucatas_meta_receita', metaReceita);
    localStorage.setItem('sucatas_meta_peso', metaPeso);
    localStorage.setItem('sucatas_meta_unidade', metaUnidade);
    localStorage.setItem('sucatas_meta_litro', metaLitro);
    setIsEditingMetas(false);
  };

  const percReceita = Math.min(100, (totalReceita / Math.max(1, parseNum(metaReceita))) * 100);
  const percPeso = Math.min(100, (totalKg / Math.max(1, parseNum(metaPeso))) * 100);
  const percUnidade = Math.min(100, (totalUnidade / Math.max(1, parseNum(metaUnidade))) * 100);
  const percLitro = Math.min(100, (totalLitro / Math.max(1, parseNum(metaLitro))) * 100);

  const valorMetaReceitaNum = parseNum(metaReceita);

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-800 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#10B981] selection:text-white relative overflow-x-hidden p-6 lg:p-10 space-y-8">
      
      {/* Textura geométrica sutil SVG (< 3% opacidade) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230F172A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

      <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-8 relative z-10">

        {/* HEADER PREMIUM (CAMUFLADO AO FUNDO) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-transparent p-2 md:p-4">
          <div>
            <nav className="flex items-center gap-2 text-xs font-medium text-[#64748B] mb-1">
              <span>Painel</span>
              <span>/</span>
              <span>Comercialização</span>
              <span>/</span>
              <span className="text-[#0F172A] font-semibold">Painel</span>
            </nav>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-bold text-[#0F172A] tracking-tight">Painel de Sucatas</h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#10B981] border border-emerald-500/20">
                <Sparkles className="w-3 h-3" /> Ao vivo
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">Visão geral do sistema de comercialização e sucatas. Desenvolvido por: BRUNO SANTOS</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Seletor de Mês e Ano */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-[#64748B]">
                <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
              </div>
              <select 
                value={filtroMes} 
                onChange={(e) => setFiltroMes(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#0F172A] focus:outline-none cursor-pointer pr-1"
              >
                <option value="todos">Todos os Meses</option>
                <option value="1">Janeiro</option>
                <option value="2">Fevereiro</option>
                <option value="3">Março</option>
                <option value="4">Abril</option>
                <option value="5">Maio</option>
                <option value="6">Junho</option>
                <option value="7">Julho</option>
                <option value="8">Agosto</option>
                <option value="9">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
              <div className="h-4 w-[1px] bg-[#E5E7EB]" />
              <select 
                value={filtroAno} 
                onChange={(e) => setFiltroAno(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#0F172A] focus:outline-none cursor-pointer pr-1"
              >
                <option value="todos">Todos os Anos</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>
            </div>

            <Button 
              onClick={() => setIsEditingMetas(true)}
              size="sm"
              className="bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E5E7EB] text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 px-3.5 py-2"
            >
              <Settings className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Configurar Metas</span>
            </Button>
          </div>
        </div>

        {/* BLOCO 1: Resumo Financeiro (03 Cards Principais) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Resumo Financeiro</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Receita Total */}
            <div className="bg-gradient-to-b from-white to-[#FBFCFD] border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_10px_30px_rgba(15,23,42,.05)] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 relative group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-[#10B981]" />
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Receita Total (Período)</span>
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                    {fmtCurrency(totalReceita)}
                  </h3>
                </div>
                <div className="w-[50px] h-[50px] rounded-2xl bg-emerald-50 border border-emerald-500/20 flex items-center justify-center text-[#10B981] shadow-inner">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
                <span className="flex items-center gap-1 text-[#10B981] font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" /> {percReceita.toFixed(1)}%
                </span>
                <span>da meta estabelecida</span>
              </div>
            </div>

            {/* Card 2: Meta de Faturamento */}
            <div 
              onClick={() => setIsEditingMetas(true)}
              className="bg-gradient-to-b from-white to-[#FBFCFD] border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_10px_30px_rgba(15,23,42,.05)] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 relative group overflow-hidden cursor-pointer"
              title="Clique para editar a meta de faturamento"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Meta de Faturamento</span>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                    {valorMetaReceitaNum > 0 && !isNaN(valorMetaReceitaNum) ? fmtCurrency(valorMetaReceitaNum) : metaReceita}
                  </h3>
                </div>
                <div className="w-[50px] h-[50px] rounded-2xl bg-blue-50 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-105 transition-transform">
                  <Target className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-semibold text-slate-700">Planejamento ativo</span>
                <span className="text-blue-600 font-medium">Configurar</span>
              </div>
            </div>

            {/* Card 3: Total de Registros */}
            <div className="bg-gradient-to-b from-white to-[#FBFCFD] border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_10px_30px_rgba(15,23,42,.05)] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 relative group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-indigo-600" />
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total de Registros (Período)</span>
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                    {sucatasFiltradas.length}
                  </h3>
                </div>
                <div className="w-[50px] h-[50px] rounded-2xl bg-purple-50 border border-purple-500/20 flex items-center justify-center text-purple-600 shadow-inner">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-semibold text-purple-600">Transações efetuadas</span>
                <span>Atualizado agora</span>
              </div>
            </div>

          </div>
        </section>

        {/* BLOCO 2: Metas (Receita, Kg, Unidades, Litros) */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Metas e Desempenho Operacional</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Meta de Receita */}
            <div className="bg-gradient-to-b from-white to-[#FBFCFD] border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_10px_30px_rgba(15,23,42,.05)] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-500/20 flex items-center justify-center text-[#10B981]">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">Meta de Receita</h4>
                    <p className="text-xs text-[#64748B]">Acompanhamento de faturamento</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#10B981] bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-500/20">
                  {valorMetaReceitaNum > 0 && !isNaN(valorMetaReceitaNum) ? fmtCurrency(valorMetaReceitaNum) : metaReceita}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#64748B]">Realizado: <strong className="text-[#0F172A]">{fmtCurrency(totalReceita)}</strong></span>
                  <span className="text-[#10B981] font-bold">({percReceita.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-sm" 
                    style={{ width: `${percReceita}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Meta de Volume (Kg) */}
            <div className="bg-gradient-to-b from-white to-[#FBFCFD] border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_10px_30px_rgba(15,23,42,.05)] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-500/20 flex items-center justify-center text-blue-600">
                    <Weight className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">Meta de Volume (Kg)</h4>
                    <p className="text-xs text-[#64748B]">Peso total comercializado</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-500/20">
                  {fmtMetaDisplay(metaPeso, 'kg')}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#64748B]">Realizado: <strong className="text-[#0F172A]">{totalKg.toLocaleString('pt-BR')} Kg</strong></span>
                  <span className="text-blue-600 font-bold">({percPeso.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-sm" 
                    style={{ width: `${percPeso}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Meta de Volume (Unidades) */}
            <div className="bg-gradient-to-b from-white to-[#FBFCFD] border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_10px_30px_rgba(15,23,42,.05)] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-500/20 flex items-center justify-center text-amber-600">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">Meta de Volume (Unidades)</h4>
                    <p className="text-xs text-[#64748B]">Contagem de peças e itens</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-xl border border-amber-500/20">
                  {fmtMetaDisplay(metaUnidade, 'Unid')}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#64748B]">Realizado: <strong className="text-[#0F172A]">{totalUnidade.toLocaleString('pt-BR')} Unid</strong></span>
                  <span className="text-amber-600 font-bold">({percUnidade.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-500 shadow-sm" 
                    style={{ width: `${percUnidade}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Meta de Volume (Litros) */}
            <div className="bg-gradient-to-b from-white to-[#FBFCFD] border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_10px_30px_rgba(15,23,42,.05)] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-500/20 flex items-center justify-center text-purple-600">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">Meta de Volume (Litros)</h4>
                    <p className="text-xs text-[#64748B]">Volume de líquidos e fluidos</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-xl border border-purple-500/20">
                  {fmtMetaDisplay(metaLitro, 'Litros')}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#64748B]">Realizado: <strong className="text-[#0F172A]">{totalLitro.toLocaleString('pt-BR')} Litros</strong></span>
                  <span className="text-purple-600 font-bold">({percLitro.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 shadow-sm" 
                    style={{ width: `${percLitro}%` }}
                  />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* BLOCO 3: Indicadores (Top Fornecedores & Top Sucatas) */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Indicadores de Desempenho e Ranking</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* TOP 3 FORNECEDORES */}
            <div className="bg-gradient-to-b from-white to-[#FBFCFD] border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_10px_30px_rgba(15,23,42,.05)] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-inner">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">Top 3 Fornecedores (Por Receita)</h4>
                    <p className="text-xs text-[#64748B]">Principais parceiros comerciais no período</p>
                  </div>
                </div>

                {rankingFornecedores.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#64748B] italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    Nenhum fornecedor registrado neste período.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rankingFornecedores.map((f, index) => (
                      <div key={index} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-slate-100/80 transition-all">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-amber-100 text-amber-700' : 
                            index === 1 ? 'bg-slate-200 text-slate-700' : 
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {index + 1}º
                          </span>
                          <div>
                            <span className="text-xs font-bold text-[#0F172A] block">{f.nome}</span>
                            <span className="text-[10px] text-[#64748B]">{f.totalTransacoes} transação(ões)</span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-[#10B981]">
                          {fmtCurrency(f.receita)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Ranking baseado em transações</span>
                <span className="font-semibold text-[#0F172A]">Atualizado</span>
              </div>
            </div>

            {/* TOP 3 SUCATAS MAIS LUCRATIVAS */}
            <div className="bg-gradient-to-b from-white to-[#FBFCFD] border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_10px_30px_rgba(15,23,42,.05)] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-500/20 flex items-center justify-center text-[#10B981] shadow-inner">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">Top 3 Sucatas Mais Lucrativas</h4>
                    <p className="text-xs text-[#64748B]">Itens com maior rentabilidade no período</p>
                  </div>
                </div>

                {rankingSucatas.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#64748B] italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    Nenhuma sucata registrada neste período.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rankingSucatas.map((s, index) => (
                      <div key={index} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-slate-100/80 transition-all">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-emerald-100 text-emerald-700' : 
                            index === 1 ? 'bg-slate-200 text-slate-700' : 
                            'bg-teal-100 text-teal-700'
                          }`}>
                            {index + 1}º
                          </span>
                          <div>
                            <span className="text-xs font-bold text-[#0F172A] block">{s.nome}</span>
                            <span className="text-[10px] text-[#64748B]">Vol: {s.quantidade.toLocaleString('pt-BR')} {s.unidade}</span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-[#10B981]">
                          {fmtCurrency(s.receita)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Análise de rentabilidade</span>
                <span className="font-semibold text-[#0F172A]">Tempo real</span>
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* MODAL DE CONFIGURAR METAS */}
      {isEditingMetas && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-8 shadow-2xl font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 border border-slate-100 animate-in fade-in duration-200">
            
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#10B981]" /> Configurar Metas de Vendas
                </h3>
                <p className="text-xs text-[#64748B]">Defina os alvos de desempenho do sistema</p>
              </div>
              <button 
                onClick={() => setIsEditingMetas(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-black font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Nova Meta de Faturamento / Receita (R$)</label>
                <Input 
                  type="text" 
                  value={metaReceita} 
                  onChange={(e) => setMetaReceita(e.target.value)} 
                  className="bg-[#F5F7FB] border-[#E5E7EB] rounded-xl h-11 text-xs font-semibold text-[#0F172A]" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Nova Meta de Volume (Kg)</label>
                <Input 
                  type="text" 
                  value={metaPeso} 
                  onChange={(e) => setMetaPeso(e.target.value)} 
                  className="bg-[#F5F7FB] border-[#E5E7EB] rounded-xl h-11 text-xs font-semibold text-[#0F172A]" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Nova Meta de Volume (Unidades)</label>
                <Input 
                  type="text" 
                  value={metaUnidade} 
                  onChange={(e) => setMetaUnidade(e.target.value)} 
                  className="bg-[#F5F7FB] border-[#E5E7EB] rounded-xl h-11 text-xs font-semibold text-[#0F172A]" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Nova Meta de Volume (Litros)</label>
                <Input 
                  type="text" 
                  value={metaLitro} 
                  onChange={(e) => setMetaLitro(e.target.value)} 
                  className="bg-[#F5F7FB] border-[#E5E7EB] rounded-xl h-11 text-xs font-semibold text-[#0F172A]" 
                />
              </div>
            </div>

            <div className="pt-6 mt-6 flex items-center justify-end gap-3 border-t border-slate-100">
              <Button 
                variant="outline"
                onClick={() => setIsEditingMetas(false)}
                className="rounded-xl h-11 px-5 border-[#E5E7EB] text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveMetas}
                className="bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl h-11 px-6 text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
              >
                Salvar Metas
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}