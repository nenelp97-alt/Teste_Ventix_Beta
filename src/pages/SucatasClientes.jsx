import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, Users, Building2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/apiClient';

export default function SucatasClientes() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nome: '', tipo: 'Fornecedor', cnpj: '', telefone: '' });

  const { data: clientes = [] } = useQuery({
    queryKey: ['sucatas-clientes'],
    queryFn: async () => {
      try { const res = await base44.entities.list('SucataCliente'); if (res?.length) return res; } catch {}
      return JSON.parse(localStorage.getItem('ventix_sucatas_clientes') || '[]');
    }
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({ nome: '', tipo: 'Fornecedor', cnpj: '', telefone: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingId(c.id);
    setForm({ 
      nome: c.nome || '', 
      tipo: c.tipo || 'Fornecedor', 
      cnpj: c.cnpj || '', 
      telefone: c.telefone || '' 
    });
    setIsOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) {
        const payload = { ...data, id: editingId };
        try { return await base44.entities.update('SucataCliente', editingId, payload); }
        catch {
          const current = JSON.parse(localStorage.getItem('ventix_sucatas_clientes') || '[]');
          const updated = current.map(item => item.id === editingId ? payload : item);
          localStorage.setItem('ventix_sucatas_clientes', JSON.stringify(updated));
        }
      } else {
        const payload = { ...data, id: Date.now().toString() };
        try { return await base44.entities.create('SucataCliente', payload); }
        catch {
          const current = JSON.parse(localStorage.getItem('ventix_sucatas_clientes') || '[]');
          localStorage.setItem('ventix_sucatas_clientes', JSON.stringify([payload, ...current]));
        }
      }
    },
    onSuccess: () => { 
      queryClient.invalidateQueries(['sucatas-clientes']); 
      setIsOpen(false); 
      setEditingId(null);
      setForm({ nome: '', tipo: 'Fornecedor', cnpj: '', telefone: '' }); 
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Deseja realmente excluir este cadastro?')) {
      try {
        base44.entities.delete('SucataCliente', id);
      } catch {}
      const current = JSON.parse(localStorage.getItem('ventix_sucatas_clientes') || '[]');
      const updated = current.filter(item => item.id !== id);
      localStorage.setItem('ventix_sucatas_clientes', JSON.stringify(updated));
      queryClient.invalidateQueries(['sucatas-clientes']);
    }
  };

  const filteredClientes = clientes.filter(c => 
    (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cnpj || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 bg-slate-50 text-slate-800 min-h-full font-mono">
      {/* Header Superior */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Cadastro de Clientes / Fornecedores
          </h1>
          <p className="text-xs text-slate-500 mt-1">Gerencie sua base de parceiros comerciais e contatos.</p>
        </div>
        <Button onClick={handleOpenNew} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Novo Cadastro
        </Button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <Input 
          type="text" 
          placeholder="Pesquisar por nome ou CNPJ..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white border-slate-200 text-xs text-slate-900 shadow-sm"
        />
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClientes.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-sm">
            Nenhum cadastro encontrado.
          </div>
        ) : (
          filteredClientes.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm relative group hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold mb-2 ${
                    c.tipo === 'Cliente' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                    c.tipo === 'Fornecedor' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    'bg-purple-50 text-purple-700 border border-purple-100'
                  }`}>
                    {c.tipo || 'Parceiro'}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">{c.nome}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenEdit(c)} 
                    className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors p-1.5 rounded-lg"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(c.id)} 
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors p-1.5 rounded-lg"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <p className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span><strong>CNPJ:</strong> {c.cnpj || 'Não informado'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span><strong>Tel:</strong> {c.telefone || 'Não informado'}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                {editingId ? 'Editar Cliente ou Fornecedor' : 'Novo Cliente ou Fornecedor'}
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Nome / Empresa</label>
                <Input placeholder="Ex: Comercial de Resíduos SP" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="bg-slate-50 border-slate-200 text-xs text-slate-900" />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Tipo de Parceiro</label>
                <select 
                  value={form.tipo} 
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Fornecedor">Fornecedor</option>
                  <option value="Comprador">Comprador</option>
                  <option value="Ambos">Ambos</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">CNPJ</label>
                <Input placeholder="00.000.000/0000-00" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className="bg-slate-50 border-slate-200 text-xs text-slate-900" />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Telefone / Contato</label>
                <Input placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="bg-slate-50 border-slate-200 text-xs text-slate-900" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-xs text-slate-500 hover:text-slate-900">Cancelar</Button>
              <Button onClick={() => mutation.mutate(form)} className="bg-emerald-600 hover:bg-emerald-500 text-xs text-white">
                {editingId ? 'Salvar Alterações' : 'Salvar Parceiro'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}