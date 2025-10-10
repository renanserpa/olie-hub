import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, RefreshCw, Package2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }

  async function handleTinySync(dryRun: boolean) {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiny-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            entity: 'products',
            dryRun
          })
        }
      );

      const result = await response.json();
      if (!result.ok) throw new Error(result.error);

      if (dryRun) {
        toast.success(
          `Pré-visualização: ${result.stats.itemsCreated} novos, ${result.stats.itemsUpdated} atualizações, ${result.stats.itemsSkipped} sem mudanças`
        );
      } else {
        toast.success(
          `Sincronização concluída: ${result.stats.itemsCreated + result.stats.itemsUpdated} produtos atualizados`
        );
        loadProducts();
      }

      console.log('[TinySync]', `Calls used: ${result.stats.apiCallsUsed}/${result.stats.maxCalls}`);
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(error.message || 'Erro ao sincronizar');
    } finally {
      setSyncing(false);
    }
  }

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground mt-1">Gestão de produtos e catálogo</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleTinySync(true)}
            disabled={syncing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync (Pré-visualização)
          </Button>
          <Button
            onClick={() => handleTinySync(false)}
            disabled={syncing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync (Aplicar)
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <Card key={product.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <Package2 className="w-8 h-8 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{product.name}</h3>
                {product.sku && (
                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  {product.tiny_product_id && (
                    <Badge variant="outline" className="text-xs">
                      Tiny #{product.tiny_product_id}
                    </Badge>
                  )}
                  {product.stock_quantity > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {product.stock_quantity} un
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      Esgotado
                    </Badge>
                  )}
                </div>

                {product.unit_price && (
                  <p className="text-lg font-bold mt-2">
                    R$ {Number(product.unit_price).toFixed(2)}
                  </p>
                )}

                {product.tiny_synced_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Sync: {new Date(product.tiny_synced_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum produto encontrado
        </div>
      )}
    </div>
  );
}
