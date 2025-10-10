import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Trash2, Plus, Settings } from 'lucide-react';

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  config_json?: any;
}

export function OrderDialog({ open, onOpenChange, onSuccess }: OrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
  const [currentConfig, setCurrentConfig] = useState<any>({});
  const [formData, setFormData] = useState({
    contact_id: '',
    status: 'pending_payment',
    notes: '',
    discount: 0,
    shipping_cost: 0,
  });

  useEffect(() => {
    if (open) {
      loadContacts();
      loadProducts();
    }
  }, [open]);

  const loadContacts = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('id, name, email')
      .order('name');
    if (data) setContacts(data);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, unit_price, stock_quantity')
      .eq('is_active', true)
      .order('name');
    if (data) setProducts(data);
  };

  const addItem = () => {
    if (products.length === 0) return;
    const firstProduct = products[0];
    setItems([...items, {
      product_id: firstProduct.id,
      product_name: firstProduct.name,
      quantity: 1,
      unit_price: firstProduct.unit_price || 0,
      total: firstProduct.unit_price || 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].product_name = product.name;
        newItems[index].unit_price = product.unit_price || 0;
      }
    }
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - formData.discount + formData.shipping_cost;
    return { subtotal, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contact_id) {
      toast({
        title: 'Erro',
        description: 'Selecione um cliente',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um item ao pedido',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Gerar número do pedido
      const { data: orderNumberData, error: orderNumberError } = await supabase
        .rpc('generate_order_number');

      if (orderNumberError) throw orderNumberError;

      const { subtotal, total } = calculateTotals();

      // Criar pedido
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumberData,
          contact_id: formData.contact_id,
          status: formData.status as any,
          notes: formData.notes,
          items: items.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total,
              config_json: item.config_json || null,
            })),
          subtotal,
          discount: formData.discount,
          shipping_cost: formData.shipping_cost,
          total,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar movimentações de estoque (reserva)
      for (const item of items) {
        await supabase.from('inventory_movements').insert({
          product_id: item.product_id,
          type: 'out',
          quantity: item.quantity,
          reference_id: orderData.id,
          reason: `Pedido ${orderNumberData}`,
        });

        // Atualizar estoque do produto
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: product.stock_quantity - item.quantity })
            .eq('id', item.product_id);
        }
      }

      toast({
        title: 'Pedido criado',
        description: `Pedido ${orderNumberData} criado com sucesso.`,
      });

      onSuccess();
      onOpenChange(false);
      setItems([]);
      setFormData({
        contact_id: '',
        status: 'pending_payment',
        notes: '',
        discount: 0,
        shipping_cost: 0,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pedido</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Cliente *</Label>
              <Select 
                value={formData.contact_id} 
                onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} {contact.email && `(${contact.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="in_production">Em Produção</SelectItem>
                  <SelectItem value="awaiting_shipping">Aguardando Envio</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Itens do Pedido *</Label>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded">
                <div className="col-span-5">
                  <Label>Produto</Label>
                  <Select 
                    value={item.product_id} 
                    onValueChange={(value) => updateItem(index, 'product_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} {product.sku && `(${product.sku})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Preço Un.</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Total</Label>
                  <Input value={item.total.toFixed(2)} disabled />
                </div>
                <div className="col-span-1 flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setCurrentItemIndex(index);
                      setCurrentConfig(items[index].config_json || {});
                      setConfigDialogOpen(true);
                    }}
                    title="Personalizar"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Desconto (R$)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_cost">Frete (R$)</Label>
              <Input
                id="shipping_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.shipping_cost}
                onChange={(e) => setFormData({ ...formData, shipping_cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Total do Pedido</Label>
              <Input value={`R$ ${total.toFixed(2)}`} disabled className="font-bold" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Pedido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Dialog de Personalização */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personalizar Item</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Cor */}
            <div>
              <Label>Cor Principal</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000', '#FFFFFF'].map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      currentConfig.color === color ? 'ring-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentConfig({ ...currentConfig, color })}
                  />
                ))}
              </div>
            </div>
            
            {/* Material */}
            <div>
              <Label>Material</Label>
              <Select
                value={currentConfig.material || ''}
                onValueChange={(v) => setCurrentConfig({ ...currentConfig, material: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acrilico">Acrílico</SelectItem>
                  <SelectItem value="madeira">Madeira</SelectItem>
                  <SelectItem value="mdf">MDF</SelectItem>
                  <SelectItem value="pvc">PVC</SelectItem>
                  <SelectItem value="tecido">Tecido</SelectItem>
                  <SelectItem value="metal">Metal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Texto */}
            <div>
              <Label>Texto Personalizado</Label>
              <Input
                value={currentConfig.text || ''}
                onChange={(e) => setCurrentConfig({ ...currentConfig, text: e.target.value })}
                placeholder="Digite o texto..."
              />
            </div>
            
            {/* Dimensões */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Largura (cm)</Label>
                <Input
                  type="number"
                  value={currentConfig.width || ''}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, width: e.target.value })}
                />
              </div>
              <div>
                <Label>Altura (cm)</Label>
                <Input
                  type="number"
                  value={currentConfig.height || ''}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, height: e.target.value })}
                />
              </div>
              <div>
                <Label>Espessura (mm)</Label>
                <Input
                  type="number"
                  value={currentConfig.thickness || ''}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, thickness: e.target.value })}
                />
              </div>
            </div>
            
            {/* Observações */}
            <div>
              <Label>Observações</Label>
              <Textarea
                rows={2}
                value={currentConfig.notes || ''}
                onChange={(e) => setCurrentConfig({ ...currentConfig, notes: e.target.value })}
                placeholder="Detalhes adicionais..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (currentItemIndex !== null) {
                const newItems = [...items];
                newItems[currentItemIndex].config_json = currentConfig;
                setItems(newItems);
                setConfigDialogOpen(false);
                toast({ title: 'Personalização salva!' });
              }
            }}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
