import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/apiClient';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { moduloLabels, tipoLabels, categoriaLabels, origemLabels, origemColors, fmt, formatCnpj } from './gastoConstants';

export default function GastoDetailSheet({ open, onOpenChange, gasto, onEdit }) {
  const [fornecedor, setFornecedor] = useState(null);
  const [items, setItems] = useState([]);
  const [materials, setMaterials] = useState({});

  useEffect(() => {
    if (!open || !gasto) return;
    setFornecedor(null);
    setItems([]);
    setMaterials({});

    if (gasto.fornecedor_id) {
      base44.entities.Fornecedor.get(gasto.fornecedor_id).then(setFornecedor).catch(() => {});
    }

    base44.entities.GastoItem.filter({ gasto_id: gasto.id }).then(gastoItems => {
      setItems(gastoItems);
      const materialIds = [...new Set(gastoItems.map(i => i.material_id).filter(Boolean))];
      if (materialIds.length === 0) return;
      Promise.all(materialIds.map(id => base44.entities.Material.get(id).catch(() => null))).then(mats => {
        const map = {};
        mats.filter(Boolean).forEach(m => { map[m.id] = m; });
        setMaterials(map);
      });
    }).catch(() => {});
  }, [open, gasto]);

  if (!gasto) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Gasto</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{moduloLabels[gasto.modulo]}</Badge>
            <Badge variant="outline">{categoriaLabels[gasto.categoria]}</Badge>
            <Badge variant="outline">{tipoLabels[gasto.tipo]}</Badge>
            <Badge variant="outline" className={origemColors[gasto.origem]}>{origemLabels[gasto.origem]}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Fornecedor</p>
              <p className="font-medium">{fornecedor?.razao_social || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">CNPJ</p>
              <p className="font-medium">{fornecedor ? formatCnpj(fornecedor.cnpj) : '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data</p>
              <p className="font-medium">{gasto.data ? new Date(gasto.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Local</p>
              <p className="font-medium">{gasto.local || '—'}</p>
            </div>
            {gasto.unidade && (
              <div>
                <p className="text-muted-foreground">Unidade</p>
                <p className="font-medium">{gasto.unidade}</p>
              </div>
            )}
          </div>

          {gasto.observacoes && (
            <div>
              <p className="text-sm text-muted-foreground">Observações</p>
              <p className="text-sm">{gasto.observacoes}</p>
            </div>
          )}

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Material / Descrição</th>
                  <th className="text-right p-2 font-medium">Qtd</th>
                  <th className="text-right p-2 font-medium">Vl. Unit.</th>
                  <th className="text-right p-2 font-medium">Vl. Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">
                      {item.material_id && materials[item.material_id] && (
                        <span className="font-medium">{materials[item.material_id].nome}</span>
                      )}
                      <span className="block text-xs text-muted-foreground">{item.descricao_original}</span>
                    </td>
                    <td className="text-right p-2">{Number(item.quantidade)} {item.unidade_medida}</td>
                    <td className="text-right p-2">{fmt(item.valor_unitario)}</td>
                    <td className="text-right p-2 font-medium">{fmt(item.valor_total)}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Nenhum item encontrado.</td></tr>
                )}
              </tbody>
              <tfoot className="bg-muted/50 border-t">
                <tr>
                  <td colSpan={3} className="p-2 text-right font-semibold">Total Geral</td>
                  <td className="p-2 text-right font-bold">{fmt(gasto.valor_total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {gasto.origem === 'MANUAL' && (
          <SheetFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onEdit?.(gasto)}>
              <Pencil className="w-4 h-4 mr-1" /> Editar
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}