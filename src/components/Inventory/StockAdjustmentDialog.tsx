import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  onSuccess: () => void;
}

export function StockAdjustmentDialog({ open, onOpenChange, product, onSuccess }: StockAdjustmentDialogProps) {
  const [type, setType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!quantity || parseInt(quantity) <= 0) {
      toast.error('Quantidade inválida');
      return;
    }

    setLoading(true);
    try {
      const qty = parseInt(quantity);
      const newStock = type === 'in' 
        ? (product.stock_quantity || 0) + qty 
        : (product.stock_quantity || 0) - qty;

      // Update stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', product.id);

      if (updateError) throw updateError;

      // Create movement log
      const { error: logError } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: product.id,
          type,
          quantity: qty,
          reason,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (logError) throw logError;

      toast.success('Estoque ajustado com sucesso');
      onSuccess();
      onOpenChange(false);
      setQuantity('');
      setReason('');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Erro ao ajustar estoque');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar Estoque - {product?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Movimentação</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as 'in' | 'out')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in" id="in" />
                <Label htmlFor="in">Entrada</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="out" id="out" />
                <Label htmlFor="out">Saída</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Digite a quantidade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo do ajuste..."
            />
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="text-muted-foreground">Estoque Atual: </span>
              <span className="font-semibold">{product?.stock_quantity || 0}</span>
            </p>
            <p className="text-sm mt-1">
              <span className="text-muted-foreground">Novo Estoque: </span>
              <span className="font-semibold">
                {quantity ? (
                  type === 'in' 
                    ? (product?.stock_quantity || 0) + parseInt(quantity)
                    : (product?.stock_quantity || 0) - parseInt(quantity)
                ) : '-'}
              </span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Ajustando...' : 'Confirmar Ajuste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
