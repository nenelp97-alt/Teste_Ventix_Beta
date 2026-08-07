import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import EvidenciasSection from './EvidenciasSection';

const defaultForm = {
  equipment_id: '', type: 'preventive', status: 'scheduled',
  scheduled_date: '', completed_date: '', description: '',
  technician: '', cost: '', notes: ''
};

export default function MaintenanceFormDialog({ open, onOpenChange, maintenance, equipments, onSave, preset }) {
  const [form, setForm] = useState(defaultForm);
  const [folderUrl, setFolderUrl] = useState('');
  const [links, setLinks] = useState([]);
  const [photos, setPhotos] = useState([]);
  const isEditing = !!maintenance;

  useEffect(() => {
    if (maintenance) {
      setForm({
        equipment_id: maintenance.equipment_id || '',
        type: maintenance.type || 'preventive',
        status: maintenance.status || 'scheduled',
        scheduled_date: maintenance.scheduled_date || '',
        completed_date: maintenance.completed_date || '',
        description: maintenance.description || '',
        technician: maintenance.technician || '',
        cost: maintenance.cost || '',
        notes: maintenance.notes || '',
      });
      setFolderUrl(maintenance.evidence_folder_url || '');
      setLinks(maintenance.evidence_links || []);
      setPhotos(maintenance.evidence_photos || []);
    } else if (preset) {
      setForm({ ...defaultForm, ...preset });
      setFolderUrl('');
      setLinks([]);
      setPhotos([]);
    } else {
      setForm(defaultForm);
      setFolderUrl('');
      setLinks([]);
      setPhotos([]);
    }
  }, [maintenance, preset, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      cost: form.cost ? Number(form.cost) : undefined,
      evidence_folder_url: folderUrl || undefined,
      evidence_links: links,
      evidence_photos: photos,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Manutenção' : 'Nova Manutenção'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Equipamento *</Label>
              <Select value={form.equipment_id} onValueChange={v => setForm({...form, equipment_id: v})} required>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {equipments.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name} — {e.location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventiva</SelectItem>
                  <SelectItem value="corrective">Corretiva</SelectItem>
                  <SelectItem value="emergency">Emergência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
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
              <Input type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} required />
            </div>
            <div>
              <Label>Data Conclusão</Label>
              <Input type="date" value={form.completed_date} onChange={e => setForm({...form, completed_date: e.target.value})} />
            </div>
            <div>
              <Label>Técnico</Label>
              <Input value={form.technician} onChange={e => setForm({...form, technician: e.target.value})} />
            </div>
            <div>
              <Label>Custo (R$)</Label>
              <Input type="number" step="0.01" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />
            </div>
            <div className="col-span-2">
              <Label>Descrição do Serviço</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} />
            </div>

            {/* Seção de Evidências */}
            <EvidenciasSection
              folderUrl={folderUrl}
              setFolderUrl={setFolderUrl}
              links={links}
              setLinks={setLinks}
              photos={photos}
              setPhotos={setPhotos}
            />
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