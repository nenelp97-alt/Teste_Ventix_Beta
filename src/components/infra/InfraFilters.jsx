import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categoryLabels } from './infraConstants';

export default function InfraFilters({ filters, setFilters, units, suppliers }) {
  const update = (key, value) => setFilters({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={filters.period} onValueChange={v => update('period', v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Período" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo o período</SelectItem>
          <SelectItem value="3">Últimos 3 meses</SelectItem>
          <SelectItem value="6">Últimos 6 meses</SelectItem>
          <SelectItem value="12">Últimos 12 meses</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.unit} onValueChange={v => update('unit', v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Unidade" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as unidades</SelectItem>
          {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.category} onValueChange={v => update('category', v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {Object.entries(categoryLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.supplier} onValueChange={v => update('supplier', v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Fornecedor" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os fornecedores</SelectItem>
          {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}