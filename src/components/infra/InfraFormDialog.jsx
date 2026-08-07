import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import EvidenciasSection from '@/components/maintenance/EvidenciasSection';
import { categoryLabels, priorityLabels, fmt } from './infraConstants';

const defaultForm = {
  title: '', category: 'other', unit: '', sector: '', location: '',
  priority: 'medium', responsible: '', service_description: '',
  materials_description: '', supplier: '', service_cost: '',
  materials_cost: '', status: 'scheduled', scheduled_date: '',
  completed_date: '', notes: ''
};

export default function InfraFormDialog({ open, onOpenChange, maintenance, onSave }) {
  const [form, setForm] = useState(defaultForm);
  const [folderUrl, setFolderUrl] = useState('');
  const [links, setLinks] = useState([]);
  const [photos, setPhotos] = useState([]);
  const isEditing = !!maintenance;

  useEffect(() => {
    if (maintenance) {
      setForm({
        title: maintenance.title || '', category: maintenance.category || 'other',
        unit: maintenance.unit || '', sector: maintenance.sector || '',
        location: maintenance.location || '', priority: maintenance.priority || 'medium',
        responsible: maintenance.responsible || '', service_description: maintenance.service_description || '',
        materials_description: maintenance.materials_description || '', supplier: maintenance.supplier || '',
        service_cost: maintenance.service_cost || '', materials_cost: maintenance.materials_cost || '',
        status: maintenance.status || 'scheduled', scheduled_date: maintenance.scheduled_date || '',
        completed_date: maintenance.completed_date || '', notes: maintenance.notes || ''
      });
      setFolderUrl(maintenance.evidence_folder_url || '');
      setLinks(maintenance.evidence_links || []);
      setPhotos(maintenance.evidence_photos || []);
    } else {
      setForm(defaultForm);
      setFolderUrl('');
      setLinks([]);
      setPhotos([]);
    }
  }, [maintenance, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      service_cost: form.service_cost ? Number(form.service_cost) : undefined,
      materials_cost: form.materials_cost ? Number(form.materials_cost) : undefined,
      evidence_folder_url: folderUrl || undefined,
      evidence_links: links,
      evidence_photos: photos,
    });
  };

  const totalCost = (Number(form.service_cost) || 0) + (Number(form.materials_cost) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Manutenção' : 'Nova Manutenção de Infraestrutura'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Título / Problema *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Descreva o problema..." />
            </div>
            <div>
              <Label>Categoria *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unidade</Label>
              <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="Ex: Matriz, Filial..." />
            </div>
            <div>
              <Label>Setor</Label>
              <Input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} placeholder="Ex: Administrativo..." />
            </div>
            <div>
              <Label>Local</Label>
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ex: Sala 12..." />
            </div>
            <div>
              <Label>Responsável</Label>
              <Input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} />
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Agendada *</Label>
              <Input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} required />
            </div>
            <div>
              <Label>Data Conclusão</Label>
              <Input type="date" value={form.completed_date} onChange={e => setForm({ ...form, completed_date: e.target.value })} />
            </div>
            <div>
              <Label>Custo Serviço (R$)</Label>
              <Input type="number" step="0.01" value={form.service_cost} onChange={e => setForm({ ...form, service_cost: e.target.value })} />
            </div>
            <div>
              <Label>Custo Materiais (R$)</Label>
              <Input type="number" step="0.01" value={form.materials_cost} onChange={e => setForm({ ...form, materials_cost: e.target.value })} />
            </div>
            {totalCost > 0 && (
              <div className="col-span-2 text-sm text-muted-foreground">
                Custo total: <span className="font-bold text-foreground">{fmt(totalCost)}</span>
              </div>
            )}
            <div className="col-span-2">
              <Label>Serviço Realizado</Label>
              <Textarea value={form.service_description} onChange={e => setForm({ ...form, service_description: e.target.value })} rows={2} />
            </div>
            <div className="col-span-2">
              <Label>Materiais Utilizados</Label>
              <Textarea value={form.materials_description} onChange={e => setForm({ ...form, materials_description: e.target.value })} rows={2} />
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div className="col-span-2">
              <EvidenciasSection
                folderUrl={folderUrl} setFolderUrl={setFolderUrl}
                links={links} setLinks={setLinks}
                photos={photos} setPhotos={setPhotos}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{isEditing ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}