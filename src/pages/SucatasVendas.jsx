import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Trash2, Search, FileText, Filter, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/apiClient';
import * as XLSX from 'xlsx';

export default function SucatasVendasList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAno, setFiltroAno] = useState('todos');
  const [filtroFornecedor, setFiltroFornecedor] = useState('todos');
  const [filtroInsumo, setFiltroInsumo] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isNovoInsumoModalOpen, setIsNovoInsumoModalOpen] = useState(false);
  const [novoInsumoNome, setNovoInsumoNome] = useState('');

  const [customInsumos, setCustomInsumos] = useState(() => {
    try {
      const saved = localStorage.getItem('ventix_custom_insumos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    nota_fiscal: '',
    data_nota_fiscal: '',
    fornecedor: '',
    tipo_sucata: 'Alumínio',
    quantidade: '',
    unid_medida: 'Kg',
    valor_unit: '',
  });

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

  const { data: clientesCadastrados = [] } = useQuery({
    queryKey: ['sucatas-clientes-completo'],
    queryFn: async () => {
      let resultados = [];
      try {
        const res = await base44.entities.list('SucataCliente');
        if (res && Array.isArray(res)) resultados = [...resultados, ...res];
      } catch {}

      try {
        const local1 = JSON.parse(localStorage.getItem('ventix_sucatas_clientes') || '[]');
        if (Array.isArray(local1)) resultados = [...resultados, ...local1];
      } catch {}

      try {
        const local2 = JSON.parse(localStorage.getItem('ventix_clientes_fornecedores') || '[]');
        if (Array.isArray(local2)) resultados = [...resultados, ...local2];
      } catch {}

      return resultados;
    },
    refetchInterval: 1000
  });

  const createMutation = useMutation({
    mutationFn: async (newData) => {
      try {
        await base44.entities.create('SucataVenda', newData);
      } catch {
        const current = JSON.parse(localStorage.getItem('ventix_sucatas_vendas') || '[]');
        localStorage.setItem('ventix_sucatas_vendas', JSON.stringify([newData, ...current]));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sucatas-vendas'] });
      setIsModalOpen(false);
      setFormData({
        data: new Date().toISOString().split('T')[0],
        nota_fiscal: '',
        data_nota_fiscal: '',
        fornecedor: '',
        tipo_sucata: 'Alumínio',
        quantidade: '',
        unid_medida: 'Kg',
        valor_unit: '',
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      try {
        await base44.entities.delete('SucataVenda', id);
      } catch {
        const current = JSON.parse(localStorage.getItem('ventix_sucatas_vendas') || '[]');
        const updated = current.filter((item, idx) => (item.id || idx) !== id);
        localStorage.setItem('ventix_sucatas_vendas', JSON.stringify(updated));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sucatas-vendas'] });
    }
  });

  const exportarTemplate = () => {
    try {
      const dadosExportar = sucatas && sucatas.length > 0 ? sucatas.map(item => ({
        Data: item.data || item.created_at || '',
        NotaFiscal: item.nota_fiscal || '',
        DataNF: item.data_nota_fiscal || '',
        Fornecedor: item.fornecedor || item.cliente || 'Não informado',
        Insumo: item.tipo_sucata || item.sucata || item.material || 'Outros',
        Quantidade: Number(item.quantidade) || 0,
        UnidadeMedida: item.unid_medida || item.unidade || 'Kg',
        ValorUnitario: Number(item.valor_unit) || 0,
        ValorTotal: Number(item.valor_total) || (Number(item.quantidade) * Number(item.valor_unit)) || 0
      })) : [
        { Data: '2026-08-06', NotaFiscal: '1234', DataNF: '2026-08-06', Fornecedor: 'Exemplo Comprador', Insumo: 'Alumínio', Quantidade: 100, UnidadeMedida: 'Kg', ValorUnitario: 2.50, ValorTotal: 250.00 }
      ];

      if (typeof XLSX === 'undefined') {
        alert('Biblioteca de exportação não encontrada.');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(dadosExportar);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Registro de Vendas");
      XLSX.writeFile(wb, "Relatorio_Vendas_Sucatas.xlsx");
    } catch (error) {
      console.error("Erro ao exportar planilha:", error);
      alert("Ocorreu um erro ao gerar a planilha.");
    }
  };

  const importarPlanilha = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onerror = () => {
      alert("Erro ao ler o arquivo selecionado.");
      e.target.value = '';
    };

    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) {
          throw new Error("Arquivo vazio ou inválido.");
        }

        const wb = XLSX.read(data, { type: 'binary' });
        if (!wb.SheetNames || wb.SheetNames.length === 0) {
          throw new Error("A planilha não contém abas válidas.");
        }

        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        
        if (!Array.isArray(json) || json.length === 0) {
          alert("A planilha está vazia ou no formato incorreto.");
          e.target.value = '';
          return;
        }
        
        let currentLocal = [];
        try {
          const savedLocal = localStorage.getItem('ventix_sucatas_vendas');
          if (savedLocal) currentLocal = JSON.parse(savedLocal);
          if (!Array.isArray(currentLocal)) currentLocal = [];
        } catch {
          currentLocal = [];
        }

        const novosRegistros = [];

        for (let index = 0; index < json.length; index++) {
          try {
            const item = json[index];
            if (!item || typeof item !== 'object') continue;

            const qtyRaw = item.Quantidade ?? item.quantidade ?? 0;
            const unitValRaw = item['Valor R$'] ?? item.ValorUnitario ?? item.valor_unit ?? item['Valor Unitário'] ?? 0;
            
            // Tratamento correto para números e decimais (mantendo o ponto ou substituindo vírgula por ponto)
            const parseNum = (val) => {
              if (typeof val === 'number') return val;
              if (!val) return 0;
              const strVal = String(val).trim().replace(',', '.');
              const num = Number(strVal);
              return isNaN(num) ? 0 : num;
            };

            const qty = parseNum(qtyRaw);
            const unitVal = parseNum(unitValRaw);
            
            let dataVenda = item.Data || item.data || new Date().toISOString().split('T')[0];
            if (typeof dataVenda === 'number') {
              const convertedDate = new Date((dataVenda - (25567 + 2)) * 86400 * 1000);
              dataVenda = convertedDate.toISOString().split('T')[0];
            } else {
              dataVenda = String(dataVenda).split('T')[0];
            }

            const novoItem = {
              id: 'imp_' + Date.now() + '_' + index,
              data: dataVenda,
              nota_fiscal: String(item['Nota fiscal'] || item.NotaFiscal || item.nota_fiscal || item['Nota Fiscal'] || ''),
              data_nota_fiscal: String(item.DataNF || item.data_nota_fiscal || ''),
              fornecedor: String(item['Fornecedor '] || item.Fornecedor || item.fornecedor || item.Comprador || 'Não informado').trim(),
              tipo_sucata: String(item['Tipo de sucata'] || item.Insumo || item.tipo_sucata || item.sucata || item.material || 'Alumínio'),
              quantidade: qty,
              unid_medida: String(item['Unid. de Medida'] || item.UnidadeMedida || item.unid_medida || item.unidade || 'Kg'),
              valor_unit: unitVal,
              valor_total: qty * unitVal
            };

            novosRegistros.push(novoItem);
          } catch (errLine) {
            console.warn("Ignorando linha corrompida:", errLine);
          }
        }

        if (novosRegistros.length === 0) {
          alert("Nenhum registro válido foi encontrado na planilha.");
          e.target.value = '';
          return;
        }

        for (const reg of novosRegistros) {
          try {
            await base44.entities.create('SucataVenda', reg);
          } catch {
            currentLocal.unshift(reg);
          }
        }

        try {
          localStorage.setItem('ventix_sucatas_vendas', JSON.stringify(currentLocal));
        } catch (errStorage) {
          console.error("Erro ao salvar no localStorage:", errStorage);
        }

        queryClient.invalidateQueries({ queryKey: ['sucatas-vendas'] });
        alert(`${novosRegistros.length} registros importados com sucesso!`);
      } catch (error) {
        console.error("Erro crítico na importação:", error);
        alert('Erro ao processar a planilha. Certifique-se de que é um arquivo Excel (.xlsx ou .xls) válido.');
      } finally {
        e.target.value = ''; 
      }
    };

    try {
      reader.readAsBinaryString(file);
    } catch (errRead) {
      console.error(errRead);
      alert("Não foi possível ler o arquivo.");
      e.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const parseNum = (val) => {
      if (!val) return 0;
      const cleanVal = String(val).replace(/\./g, '').replace(',', '.');
      const num = Number(cleanVal);
      return isNaN(num) ? 0 : num;
    };

    const qty = parseNum(formData.quantidade);
    const unitVal = parseNum(formData.valor_unit);

    const payload = {
      ...formData,
      id: Date.now().toString(),
      quantidade: qty,
      valor_unit: unitVal,
      valor_total: qty * unitVal
    };
    createMutation.mutate(payload);
  };

  const handleAddInsumo = (e) => {
    e.preventDefault();
    if (!novoInsumoNome.trim()) return;
    const updatedInsumos = [...customInsumos, novoInsumoNome.trim()];
    setCustomInsumos(updatedInsumos);
    try {
      localStorage.setItem('ventix_custom_insumos', JSON.stringify(updatedInsumos));
    } catch {}
    
    setFormData(prev => ({ ...prev, tipo_sucata: novoInsumoNome.trim() }));
    setNovoInsumoNome('');
    setIsNovoInsumoModalOpen(false);
  };

  const insumosPadrao = [
    'Alumínio', 'Cinta de Nylon', 'Óleo Usado', 'Plástico', 
    'Cobre', 'Ferro', 'Bateria', 'Papelão', 'Inox'
  ];

  const anosDisponiveis = [...new Set(sucatas.map(item => item?.data ? item.data.split('-')[0] : ''))].filter(Boolean).sort().reverse();
  
  const nomesFornecedoresBase = clientesCadastrados.map(c => {
    if (!c) return '';
    if (typeof c === 'string') return c;
    return c.nome || c.razao_social || c.fantasia || c.fornecedor || c.cliente || '';
  });

  const fornecedoresDisponiveis = [...new Set([
    ...nomesFornecedoresBase,
    ...sucatas.map(item => item?.fornecedor || item?.cliente)
  ])].filter(Boolean).sort();

  const insumosDisponiveis = [...new Set([
    ...insumosPadrao, 
    ...customInsumos, 
    ...sucatas.map(item => item?.tipo_sucata || item?.sucata || item?.material)
  ])].filter(Boolean).sort();

  const filteredSucatas = sucatas.filter(item => {
    if (!item) return false;
    const term = searchTerm.toLowerCase();
    const fornecedor = (item.fornecedor || item.cliente || '').toLowerCase();
    const material = (item.tipo_sucata || item.sucata || item.material || '').toLowerCase();
    const nf = (item.nota_fiscal || '').toLowerCase();
    const anoItem = item.data ? item.data.split('-')[0] : '';

    const matchesSearch = fornecedor.includes(term) || material.includes(term) || nf.includes(term);
    const matchesAno = filtroAno === 'todos' || anoItem === filtroAno;
    const matchesFornecedor = filtroFornecedor === 'todos' || (item.fornecedor || item.cliente) === filtroFornecedor;
    const matchesInsumo = filtroInsumo === 'todos' || (item.tipo_sucata || item.sucata || item.material) === filtroInsumo;

    return matchesSearch && matchesAno && matchesFornecedor && matchesInsumo;
  });

  const fmtCurrency = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-8 space-y-6 bg-slate-50 text-slate-800 min-h-full font-mono">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Registro de Vendas de Sucatas</h1>
          <p className="text-xs text-slate-500 mt-1">Gerencie todas as saídas e comercializações de materiais.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => {
            if (!formData.fornecedor && fornecedoresDisponiveis.length > 0) {
              setFormData(prev => ({ ...prev, fornecedor: fornecedoresDisponiveis[0] }));
            }
            setIsModalOpen(true);
          }} className="bg-emerald-600 hover:bg-emerald-500 text-xs text-white gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Nova Venda
          </Button>

          <Button 
            onClick={exportarTemplate} 
            variant="outline" 
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Exportar Planilha
          </Button>

          <label className="cursor-pointer">
            <span className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors">
              <Upload className="w-4 h-4 text-emerald-600" /> Importar Planilha
            </span>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={importarPlanilha} className="hidden" />
          </label>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <Input 
            placeholder="Pesquisar por comprador, nota fiscal ou tipo de sucata..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent text-xs text-slate-900 focus-visible:ring-0 placeholder:text-slate-400 shadow-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-600" /> Filtrar por Ano
            </label>
            <select 
              value={filtroAno} 
              onChange={(e) => setFiltroAno(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="todos">Todos os Anos</option>
              {anosDisponiveis.map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-600" /> Filtrar por Fornecedor
            </label>
            <select 
              value={filtroFornecedor} 
              onChange={(e) => setFiltroFornecedor(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="todos">Todos os Fornecedores</option>
              {fornecedoresDisponiveis.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-600" /> Filtrar por Insumo
            </label>
            <select 
              value={filtroInsumo} 
              onChange={(e) => setFiltroInsumo(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="todos">Todos os Insumos</option>
              {insumosDisponiveis.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Histórico de Transações</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <th className="p-4">Data Venda</th>
                <th className="p-4">Nota Fiscal / Data NF</th>
                <th className="p-4">Comprador / Fornecedor</th>
                <th className="p-4">Tipo de Sucata / Insumo</th>
                <th className="p-4">Quantidade</th>
                <th className="p-4">Valor Unit.</th>
                <th className="p-4">Valor Total</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSucatas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400 text-xs">
                    Nenhum registro encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSucatas.map((item, idx) => {
                  const itemId = item.id || idx;
                  const dataFormatada = item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '-';
                  const dataNfFormatada = item.data_nota_fiscal ? new Date(item.data_nota_fiscal).toLocaleDateString('pt-BR') : '';
                  const qtd = Number(item.quantidade) || 0;
                  const unidade = item.unid_medida || item.unidade || 'Kg';
                  const valUnit = Number(item.valor_unit) || 0;
                  const valTotal = Number(item.valor_total) || (qtd * valUnit);

                  return (
                    <tr key={itemId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 flex items-center gap-2 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {dataFormatada}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{item.nota_fiscal || '-'}</div>
                        {dataNfFormatada && <div className="text-[10px] text-slate-400">Emissão: {dataNfFormatada}</div>}
                      </td>
                      <td className="p-4 font-bold text-slate-900">{item.fornecedor || item.cliente || '-'}</td>
                      <td className="p-4 text-slate-700">{item.tipo_sucata || item.sucata || item.material || '-'}</td>
                      <td className="p-4 text-slate-700">{qtd.toLocaleString('pt-BR')} {unidade}</td>
                      <td className="p-4 text-slate-500">{fmtCurrency(valUnit)}</td>
                      <td className="p-4 font-bold text-emerald-600">{fmtCurrency(valTotal)}</td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteMutation.mutate(itemId)}
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Venda */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl text-slate-900 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> Registrar Nova Venda
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Data da Venda</label>
                <Input 
                  type="date" 
                  value={formData.data} 
                  onChange={(e) => setFormData({...formData, data: e.target.value})} 
                  className="bg-slate-50 border-slate-200 text-xs text-slate-900" 
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">Número da Nota Fiscal</label>
                  <Input 
                    placeholder="Ex: NF-12345" 
                    value={formData.nota_fiscal} 
                    onChange={(e) => setFormData({...formData, nota_fiscal: e.target.value})} 
                    className="bg-slate-50 border-slate-200 text-xs text-slate-900" 
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">Data da Nota Fiscal</label>
                  <Input 
                    type="date" 
                    value={formData.data_nota_fiscal} 
                    onChange={(e) => setFormData({...formData, data_nota_fiscal: e.target.value})} 
                    className="bg-slate-50 border-slate-200 text-xs text-slate-900" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Comprador / Fornecedor</label>
                <select 
                  value={formData.fornecedor} 
                  onChange={(e) => setFormData({...formData, fornecedor: e.target.value})}
                  className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  <option value="" disabled>
                    {fornecedoresDisponiveis.length > 0 ? "Selecione o Fornecedor cadastrado" : "Nenhum fornecedor cadastrado na aba"}
                  </option>
                  {fornecedoresDisponiveis.map(fornecedor => (
                    <option key={fornecedor} value={fornecedor}>{fornecedor}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-slate-500">Tipo de Sucata / Insumo</label>
                  <button 
                    type="button" 
                    onClick={() => setIsNovoInsumoModalOpen(true)}
                    className="text-[10px] text-emerald-600 hover:text-emerald-500 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Cadastrar Novo Insumo
                  </button>
                </div>
                <select 
                  value={formData.tipo_sucata} 
                  onChange={(e) => setFormData({...formData, tipo_sucata: e.target.value})}
                  className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  {insumosDisponiveis.map(insumo => (
                    <option key={insumo} value={insumo}>{insumo}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">Quantidade</label>
                  <Input 
                    type="text" 
                    placeholder="0" 
                    value={formData.quantidade} 
                    onChange={(e) => setFormData({...formData, quantidade: e.target.value})} 
                    className="bg-slate-50 border-slate-200 text-xs text-slate-900" 
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">Unidade de Medida</label>
                  <select 
                    value={formData.unid_medida} 
                    onChange={(e) => setFormData({...formData, unid_medida: e.target.value})}
                    className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Kg">Kg</option>
                    <option value="Unidade">Unidade</option>
                    <option value="Litro">Litro</option>
                    <option value="Ton">Ton</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Valor Unitário (R$)</label>
                <Input 
                  type="text" 
                  placeholder="0,00" 
                  value={formData.valor_unit} 
                  onChange={(e) => setFormData({...formData, valor_unit: e.target.value})} 
                  className="bg-slate-50 border-slate-200 text-xs text-slate-900" 
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-xs text-slate-500 hover:text-slate-900">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-xs text-white">
                  Salvar Venda
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal para Cadastrar Novo Insumo */}
      {isNovoInsumoModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-slate-900">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> Novo Tipo de Insumo / Sucata
            </h3>
            <form onSubmit={handleAddInsumo} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Nome do Insumo</label>
                <Input 
                  placeholder="Ex: Papelão Especial, Chumbo..." 
                  value={novoInsumoNome} 
                  onChange={(e) => setNovoInsumoNome(e.target.value)} 
                  className="bg-slate-50 border-slate-200 text-xs text-slate-900" 
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <Button type="button" variant="ghost" onClick={() => setIsNovoInsumoModalOpen(false)} className="text-xs text-slate-500 hover:text-slate-900">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-xs text-white">
                  Adicionar Insumo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}