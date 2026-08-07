import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/apiClient';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Search, UserPlus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { moduloLabels, tipoLabels, categoriaLabels, fmt, normalizeCnpj, formatCnpj } from './gastoConstants';
import FornecedorFormDialog from './FornecedorFormDialog';
import MaterialFormDialog from './MaterialFormDialog';
import MaterialCombobox from './MaterialCombobox';

const emptyItem = () => ({
  id: null,
  material_id: '',
  descricao_original: '',
  quantidade: 1,
  unidade_medida: '',
  valor_unitario: 0,
  valor_total: 0
});

const todayStr = () => new Date().toISOString().split('T')[0];

export default function GastoFormSheet({ open, onOpenChange, editingGasto, onSaved }) {
  const [modulo, setModulo] = useState('infraestrutura');
  const [data, setData] = useState(todayStr());
  const [categoria, setCategoria] = useState('other');
  const [tipo, setTipo] = useState('material');
  const [local, setLocal] = useState('');
  const [unidade, setUnidade] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [fornecedor, setFornecedor] = useState(null);
  const [cnpjSearch, setCnpjSearch] = useState('');
  const [searched, setSearched] = useState(false);
  const [showFornecedorForm, setShowFornecedorForm] = useState(false);

  const [items, setItems] = useState([emptyItem()]);
  const [deletedItemIds, setDeletedItemIds] = useState([]);

  const [materials, setMaterials] = useState([]);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialPresetName, setMaterialPresetName] = useState('');
  const [newMaterialItemIndex, setNewMaterialItemIndex] = useState(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      base44.entities.Material.list().then(setMaterials).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setDeletedItemIds([]);
    setFornecedor(null);
    setCnpjSearch('');
    setSearched(false);

    if (editingGasto) {
      setModulo(editingGasto.modulo || 'infraestrutura');
      setData(editingGasto.data || todayStr());
      setCategoria(editingGasto.categoria || 'other');
      setTipo(editingGasto.tipo || 'material');
      setLocal(editingGasto.local || '');
      setUnidade(editingGasto.unidade || '');
      setObservacoes(editingGasto.observacoes || '');

      if (editingGasto.fornecedor_id) {
        base44.entities.Fornecedor.get(editingGasto.fornecedor_id).then(f => {
          setFornecedor(f);
          setCnpjSearch(f.cnpj || '');
        }).catch(() => {});
      }

      base44.entities.GastoItem.filter({ gasto_id: editingGasto.id }).then(gastoItems => {
        if (gastoItems.length > 0) {
          setItems(gastoItems.map(i => ({
            id: i.id,
            material_id: i.material_id || '',
            descricao_original: i.descricao_original || '',
            quantidade: Number(i.quantidade) || 0,
            unidade_medida: i.unidade_medida || '',
            valor_unitario: Number(i.valor_unitario) || 0,
            valor_total: Number(i.valor_total) || 0
          })));
        } else {
          setItems([emptyItem()]);
        }
      }).catch(() => setItems([emptyItem()]));
    } else {
      setModulo('infraestrutura');
      setData(todayStr());
      setCategoria('other');
      setTipo('material');
      setLocal('');
      setUnidade('');
      setObservacoes('');
      setItems([emptyItem()]);
    }
  }, [open, editingGasto]);

  const valorTotalGasto = useMemo(() =>
    items.reduce((s, i) => s + (Number(i.valor_total) || 0), 0), [items]);

  const handleSearchFornecedor = async () => {
    const cnpjNorm = normalizeCnpj(cnpjSearch);
    if (cnpjNorm.length < 14) {
      toast({ title: 'CNPJ inválido', description: 'Digite um CNPJ com 14 dígitos.', variant: 'destructive' });
      return;
    }
    const results = await base44.entities.Fornecedor.filter({ cnpj: cnpjNorm });
    setSearched(true);
    if (results.length > 0) {
      setFornecedor(results[0]);
    } else {
      setFornecedor(null);
    }
  };

  const handleFornecedorCreated = (created) => {
    setFornecedor(created);
    setCnpjSearch(created.cnpj || '');
    setSearched(true);
  };

  const updateItem = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'quantidade' || field === 'valor_unitario') {
        const q = Number(next[index].quantidade) || 0;
        const vu = Number(next[index].valor_unitario) || 0;
        next[index].valor_total = q * vu;
      }
      return next;
    });
  };

  const handleMaterialSelect = (index, materialId) => {
    const material = materials.find(m => m.id === materialId);
    setItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        material_id: materialId,
        descricao_original: next[index].descricao_original || (material?.nome || ''),
        unidade_medida: next[index].unidade_medida || (material?.unidade_medida || '')
      };
      return next;
    });
  };

  const handleNewMaterial = (index, searchName = '') => {
    setNewMaterialItemIndex(index);
    setMaterialPresetName(searchName);
    setShowMaterialForm(true);
  };

  const handleMaterialCreated = (created) => {
    setMaterials(prev => [...prev, created]);
    if (newMaterialItemIndex !== null) {
      handleMaterialSelect(newMaterialItemIndex, created.id);
    }
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);

  const removeItem = (index) => {
    setItems(prev => {
      const removed = prev[index];
      if (removed.id) {
        setDeletedItemIds(prev2 => [...prev2, removed.id]);
      }
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [emptyItem()];
    });
  };

  const handleSave = async () => {
    if (!fornecedor) {
      toast({ title: 'Fornecedor obrigatório', description: 'Selecione ou cadastre um fornecedor.', variant: 'destructive' });
      return;
    }
    const validItems = items.filter(i => i.descricao_original.trim() && Number(i.quantidade) > 0);
    if (validItems.length === 0) {
      toast({ title: 'Adicione pelo menos um item', description: 'Cada item precisa de descrição e quantidade.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const gastoData = {
        fornecedor_id: fornecedor.id,
        nota_fiscal_id: null,
        modulo,
        categoria,
        tipo,
        local,
        unidade,
        data,
        valor_total: valorTotalGasto,
        origem: 'MANUAL',
        observacoes
      };

      let savedGasto;
      if (editingGasto) {
        savedGasto = await base44.entities.Gasto.update(editingGasto.id, gastoData);
        for (const itemId of deletedItemIds) {
          await base44.entities.GastoItem.delete(itemId);
        }
        for (const item of validItems) {
          const itemData = {
            gasto_id: savedGasto.id,
            material_id: item.material_id || null,
            descricao_original: item.descricao_original.trim(),
            quantidade: Number(item.quantidade),
            unidade_medida: item.unidade_medida,
            valor_unitario: Number(item.valor_unitario),
            valor_total: Number(item.valor_total)
          };
          if (item.id) {
            await base44.entities.GastoItem.update(item.id, itemData);
          } else {
            await base44.entities.GastoItem.create(itemData);
          }
        }
      } else {
        savedGasto = await base44.entities.Gasto.create(gastoData);
        const itemsData = validItems.map(item => ({
          gasto_id: savedGasto.id,
          material_id: item.material_id || null,
          descricao_original: item.descricao_original.trim(),
          quantidade: Number(item.quantidade),
          unidade_medida: item.unidade_medida,
          valor_unitario: Number(item.valor_unitario),
          valor_total: Number(item.valor_total)
        }));
        await base44.entities.GastoItem.bulkCreate(itemsData);
      }

      toast({ title: editingGasto ? 'Gasto atualizado' : 'Gasto registrado' });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Erro ao salvar gasto', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>{editingGasto ? 'Editar Gasto' : 'Registrar Gasto'}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pb-4">
            {/* Classificação */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Classificação</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Módulo *</Label>
                  <Select value={modulo} onValueChange={setModulo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(moduloLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Data *</Label>
                  <Input type="date" value={data} onChange={e => setData(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoriaLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(tipoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Local</Label>
                  <Input value={local} onChange={e => setLocal(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Unidade</Label>
                  <Input value={unidade} onChange={e => setUnidade(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Fornecedor */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Fornecedor</h3>
              {fornecedor ? (
                <div className="rounded-lg border p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{fornecedor.razao_social}</p>
                      {fornecedor.nome_fantasia && <p className="text-sm text-muted-foreground">{fornecedor.nome_fantasia}</p>}
                      <p className="text-xs text-muted-foreground mt-1">CNPJ: {formatCnpj(fornecedor.cnpj)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setFornecedor(null); setCnpjSearch(''); setSearched(false); }}>Trocar</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={cnpjSearch}
                      onChange={e => { setCnpjSearch(e.target.value); setSearched(false); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearchFornecedor(); } }}
                      placeholder="Digite o CNPJ (com ou sem máscara)"
                    />
                    <Button type="button" variant="default" onClick={handleSearchFornecedor}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {searched && !fornecedor && (
                    <div className="rounded-lg border border-border bg-muted p-3 text-sm">
                      <p className="text-muted-foreground">Fornecedor não encontrado.</p>
                      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setShowFornecedorForm(true)}>
                        <UserPlus className="w-4 h-4 mr-1" /> Cadastrar novo fornecedor
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Itens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Itens do Gasto</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Item
                </Button>
              </div>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Material</Label>
                        <MaterialCombobox
                          materials={materials}
                          value={item.material_id}
                          onChange={(mid) => handleMaterialSelect(index, mid)}
                          onNewMaterial={(searchName) => handleNewMaterial(index, searchName)}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="mt-5" onClick={() => removeItem(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Descrição *</Label>
                      <Input
                        value={item.descricao_original}
                        onChange={e => updateItem(index, 'descricao_original', e.target.value)}
                        placeholder="Descrição original do item"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Qtd</Label>
                        <Input type="number" step="0.01" value={item.quantidade} onChange={e => updateItem(index, 'quantidade', e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Un.</Label>
                        <Input value={item.unidade_medida} onChange={e => updateItem(index, 'unidade_medida', e.target.value)} className="h-8 text-sm" placeholder="un" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Vl. Unit.</Label>
                        <Input type="number" step="0.01" value={item.valor_unitario} onChange={e => updateItem(index, 'valor_unitario', e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Vl. Total</Label>
                        <div className="h-8 flex items-center text-sm font-medium">{fmt(item.valor_total)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} />
            </div>

            {/* Resumo */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <h3 className="text-sm font-semibold">Resumo</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">Fornecedor:</span>
                <span className="font-medium">{fornecedor?.razao_social || '—'}</span>
                <span className="text-muted-foreground">CNPJ:</span>
                <span className="font-medium">{fornecedor ? formatCnpj(fornecedor.cnpj) : '—'}</span>
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">{data ? new Date(data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                <span className="text-muted-foreground">Módulo:</span>
                <span className="font-medium">{moduloLabels[modulo]}</span>
                <span className="text-muted-foreground">Categoria:</span>
                <span className="font-medium">{categoriaLabels[categoria]}</span>
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium">{tipoLabels[tipo]}</span>
                <span className="text-muted-foreground">Local:</span>
                <span className="font-medium">{local || '—'}</span>
                <span className="text-muted-foreground">Itens:</span>
                <span className="font-medium">{items.filter(i => i.descricao_original.trim()).length}</span>
              </div>
              <div className="border-t pt-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Total Geral:</span>
                <span className="text-lg font-bold text-primary">{fmt(valorTotalGasto)}</span>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t pt-4 flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : (editingGasto ? 'Atualizar Gasto' : 'Registrar Gasto')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <FornecedorFormDialog
        open={showFornecedorForm}
        onOpenChange={setShowFornecedorForm}
        onCreated={handleFornecedorCreated}
        cnpjPreset={normalizeCnpj(cnpjSearch)}
      />
      <MaterialFormDialog
        open={showMaterialForm}
        onOpenChange={setShowMaterialForm}
        onCreated={handleMaterialCreated}
        nomePreset={materialPresetName}
      />
    </>
  );
}