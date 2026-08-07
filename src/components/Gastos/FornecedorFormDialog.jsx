import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/apiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { normalizeCnpj } from './gastoConstants';

export default function FornecedorFormDialog({ open, onOpenChange, onCreated, cnpjPreset }) {
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCnpj(cnpjPreset || '');
      setRazaoSocial('');
      setNomeFantasia('');
    }
  }, [open, cnpjPreset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cnpjNorm = normalizeCnpj(cnpj);
    if (cnpjNorm.length !== 14) {
      toast({ title: 'CNPJ inválido', description: 'O CNPJ deve conter 14 dígitos.', variant: 'destructive' });
      return;
    }
    if (!razaoSocial.trim()) {
      toast({ title: 'Razão social obrigatória', variant: 'destructive' });
      return;
    }
    const existing = await base44.entities.Fornecedor.filter({ cnpj: cnpjNorm });
    if (existing.length > 0) {
      toast({ title: 'Fornecedor já cadastrado', description: 'Este CNPJ já está registrado.' });
      onCreated?.(existing[0]);
      onOpenChange(false);
      return;
    }
    setSaving(true);
    try {
      const created = await base44.entities.Fornecedor.create({
        cnpj: cnpjNorm,
        razao_social: razaoSocial.trim(),
        nome_fantasia: nomeFantasia.trim(),
        ativo: true
      });
      toast({ title: 'Fornecedor cadastrado' });
      onCreated?.(created);
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Erro ao cadastrar fornecedor', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>CNPJ *</Label>
            <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <div className="space-y-2">
            <Label>Razão Social *</Label>
            <Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nome Fantasia</Label>
            <Input value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} />
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