import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';

const defaultForm = { name: '', code: '', description: '', locations: [] };

export default function CentroCustoFormDialog({ open, onOpenChange, centro, onSave }) {
  const [form, setForm] = useState(defaultForm);
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    if (centro) {
      setForm({
        name: centro.name || '',
        code: centro.code || '',
        description: centro.description || '',
        locations: centro.locations || [],
      });
    } else {
      setForm(defaultForm);
    }
    setNewLocation('');
  }, [centro, open]);

  const addLocation = () => {
    const loc = newLocation.trim();
    if (loc && !form.locations.includes(loc)) {
      setForm(f => ({ ...f, locations: [...f.locations, loc] }));
    }
    setNewLocation('');
  };

  const removeLocation = (loc) => {
    setForm(f => ({ ...f, locations: f.locations.filter(l => l !== loc) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{centro ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label>Código</Label>
            <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Ex: CC-001" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>Localizações vinculadas</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLocation(); } }}
                placeholder="Ex: Sala 101"
              />
              <Button type="button" variant="outline" size="icon" onClick={addLocation}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.locations.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.locations.map(loc => (
                  <span key={loc} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                    {loc}
                    <button type="button" onClick={() => removeLocation(loc)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{centro ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}