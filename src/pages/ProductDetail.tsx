import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';
import { PieceConfigurator } from '@/components/Configurator/PieceConfigurator';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  async function loadProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Produto não encontrado');
      navigate('/catalog');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!product || !config) {
      toast.error('Configure sua peça antes de adicionar ao carrinho');
      return;
    }

    setAdding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sandbox-cart/add`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            productId: product.id,
            quantity,
            configJson: config.configJson,
            previewPngDataUrl: config.previewPngDataUrl,
            priceDelta: config.priceDelta
          })
        }
      );

      const result = await response.json();
      if (!result.ok) throw new Error(result.error);

      toast.success('Produto adicionado ao carrinho!');
      navigate('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  if (!product) {
    return null;
  }

  const basePrice = Number(product.unit_price || 0);
  const finalPrice = basePrice + (config?.priceDelta || 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/catalog')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar ao catálogo
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : config?.previewPngDataUrl ? (
                <img
                  src={config.previewPngDataUrl}
                  alt="Preview"
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-muted-foreground">Sem imagem</div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{product.name}</h1>
                {product.sku && (
                  <p className="text-muted-foreground">SKU: {product.sku}</p>
                )}
              </div>

              {product.stock_quantity > 0 ? (
                <Badge variant="outline">
                  {product.stock_quantity} unidades disponíveis
                </Badge>
              ) : (
                <Badge variant="destructive">Esgotado</Badge>
              )}

              {product.description && (
                <p className="text-muted-foreground">{product.description}</p>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground">Preço base:</span>
                  <span className="text-lg">R$ {basePrice.toFixed(2)}</span>
                </div>
                {config?.priceDelta > 0 && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-muted-foreground">Personalização:</span>
                    <span className="text-lg">+ R$ {config.priceDelta.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-3xl font-bold">R$ {finalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={adding || !config || product.stock_quantity <= 0}
              >
                {adding ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adicionando...</>
                ) : (
                  <><ShoppingCart className="w-4 h-4 mr-2" /> Adicionar ao carrinho</>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Configurator */}
        <div>
          <PieceConfigurator
            productId={product.id}
            onConfigChange={setConfig}
          />
        </div>
      </div>
    </div>
  );
}
