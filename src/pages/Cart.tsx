import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Trash2, Loader2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sandbox-cart`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      );

      const result = await response.json();
      if (result.ok) {
        setCart(result.cart);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Erro ao carregar carrinho');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    if (!cart?.id) return;

    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sandbox-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ cartId: cart.id })
        }
      );

      const result = await response.json();
      if (!result.ok) throw new Error(result.error);

      toast.success(`Pedido ${result.orderNumber} criado com sucesso!`);
      navigate(`/orders/${result.orderId}`);
    } catch (error: any) {
      console.error('Error checking out:', error);
      toast.error(error.message || 'Erro ao finalizar pedido');
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  const items = cart?.cart_items || [];
  const total = items.reduce((sum: number, item: any) => {
    const basePrice = Number(item.products?.unit_price || 0);
    const delta = Number(item.price_delta || 0);
    return sum + (basePrice + delta) * item.quantity;
  }, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/catalog')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continuar comprando
        </Button>
        <h1 className="text-3xl font-bold">Carrinho</h1>
      </div>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Seu carrinho está vazio</h2>
          <p className="text-muted-foreground mb-6">
            Adicione produtos do catálogo para continuar
          </p>
          <Button onClick={() => navigate('/catalog')}>
            Ir para o catálogo
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any) => {
              const basePrice = Number(item.products?.unit_price || 0);
              const delta = Number(item.price_delta || 0);
              const itemTotal = (basePrice + delta) * item.quantity;

              return (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    {/* Preview */}
                    <div className="w-24 h-24 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                      {item.preview_png_url ? (
                        <img
                          src={item.preview_png_url}
                          alt="Preview"
                          className="w-full h-full object-contain rounded"
                        />
                      ) : item.products?.images?.[0] ? (
                        <img
                          src={item.products.images[0]}
                          alt={item.products.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="text-xs text-muted-foreground">Sem img</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.products?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.products?.sku}
                      </p>
                      
                      {item.config_json && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <p>Modelo: {item.config_json.model}</p>
                          <p>Tamanho: {item.config_json.size}</p>
                          {item.config_json.customText && (
                            <p>Texto: {item.config_json.customText}</p>
                          )}
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-4">
                        <span className="text-sm">Qtd: {item.quantity}</span>
                        <span className="font-semibold">
                          R$ {itemTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Summary */}
          <Card className="p-6 h-fit sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Resumo do pedido</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="text-sm text-muted-foreground">
                  Calculado no checkout
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold">R$ {total.toFixed(2)}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={checking}
              >
                {checking ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalizando...</>
                ) : (
                  'Finalizar pedido'
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Sandbox Mode: Nenhum pagamento será processado
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
