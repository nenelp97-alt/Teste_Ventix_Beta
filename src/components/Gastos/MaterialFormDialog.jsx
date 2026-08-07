import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/apiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { categoriaLabels } from './gastoConstants';

export default function MaterialFormDialog({ open, onOpenChange, onCreated, nomePreset }) {
  const [form, setForm] = useState({ nome: '', codigo_produto: '', codigo_barras: '', unidade_medida: '', categoria: 'other' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ nome: nomePreset || '', codigo_produto: '', codigo_barras: '', unidade_medida: '', categoria: 'other' });
    }
  }, [open, nomePreset]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    if (form.codigo_produto) {
      const byCode = await base44.entities.Material.filter({ codigo_produto: form.codigo_produto });
      if (byCode.length > 0) {
        toast({ title: 'Material já cadastrado', description: 'Já existe um material com este código de produto.' });
        onCreated?.(byCode[0]);
        onOpenChange(false);
        return;
      }
    }
    if (form.codigo_barras) {
      const byBarcode = await base44.entities.Material.filter({ codigo_barras: form.codigo_barras });
      if (byBarcode.length > 0) {
        toast({ title: 'Material já cadastrado', description: 'Já existe um material com este código de barras.' });
        onCreated?.(byBarcode[0]);
        onOpenChange(false);
        return;
      }
    }
    const normName = form.nome.trim().toLowerCase();
    const all = await base44.entities.Material.list();
    const byName = all.find(m => (m.nome || '').trim().toLowerCase() === normName);
    if (byName) {
      toast({ title: 'Material já cadastrado', description: 'Já existe um material com este nome.' });
      onCreated?.(byName);
      onOpenChange(false);
      return;
    }
    setSaving(true);
    try {
      const created = await base44.entities.Material.create({
        ...form,
        nome: form.nome.trim(),
        ativo: true
      });
      toast({ title: 'Material cadastrado' });
      onCreated?.(created);
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Erro ao cadastrar material', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Material</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => handleChange('nome', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Código do Produto</Label>
              <Input value={form.codigo_produto} onChange={e => handleChange('codigo_produto', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Código de Barras</Label>
              <Input value={form.codigo_barras} onChange={e => handleChange('codigo_barras', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Unidade de Medida</Label>
              <Input value={form.unidade_medida} onChange={e => handleChange('unidade_medida', e.target.value)} placeholder="un, m, kg, cx..." />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={v => handleChange('categoria', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoriaLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}