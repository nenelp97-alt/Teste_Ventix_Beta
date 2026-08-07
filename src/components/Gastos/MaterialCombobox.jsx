import React, { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function MaterialCombobox({ materials = [], value, onChange, onNewMaterial }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = materials.find(m => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          {selected ? selected.nome : 'Selecionar material...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar material..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>Nenhum material encontrado.</CommandEmpty>
            <CommandGroup>
              {materials.map(m => (
                <CommandItem key={m.id} value={m.nome} onSelect={() => { onChange(m.id); setOpen(false); setSearch(''); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === m.id ? "opacity-100" : "opacity-0")} />
                  {m.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="border-t p-1">
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setOpen(false); onNewMaterial?.(search); }}>
              <Plus className="mr-2 h-4 w-4" /> {search ? `Criar "${search}"` : 'Novo Material'}
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}