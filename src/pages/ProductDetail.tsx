import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShoppingCart, Loader2, Upload } from "lucide-react";
import { SVGUploader } from "@/components/Configurator/SVGUploader";
import { SVGColorTester } from "@/components/Configurator/SVGColorTester";
import { toast } from "sonner";

export default function ProductDetail() {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminRole();
  }, []);

  async function checkAdminRole() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!data);
    } catch (error) {
      console.error("Error checking admin role:", error);
    }
  }

  useEffect(() => {
    loadProduct();
  }, [slug, id]);

  async function loadProduct() {
    try {
      // Detect if we're using ID (UUID) or slug (SKU/slug)
      const isUUID =
        id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        );

      let query = supabase.from("products").select("*").eq("is_active", true);

      if (isUUID) {
        query = query.eq("id", id);
      } else if (slug) {
        query = query.eq("sku", slug);
      } else if (id) {
        // Try slug field if it exists
        query = query.eq("slug", id);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Produto não encontrado");
        navigate("/catalog");
        return;
      }
      setProduct(data);
    } catch (error) {
      console.error("Error loading product:", error);
      toast.error("Produto não encontrado");
      navigate("/catalog");
    } finally {
      setLoading(false);
    }
  }

  function handleConfigChange(
    selectedColors: any,
    preview: string,
    price: number,
  ) {
    setConfig(selectedColors);
    setPreviewUrl(preview);
    setTotalPrice(price);
  }

  async function handleAddToCart() {
    if (!product || !config) {
      toast.error("Configure sua peça antes de adicionar ao carrinho");
      return;
    }

    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("sandbox-cart", {
        method: "POST",
        body: {
          productId: product.id,
          quantity,
          configJson: config,
          previewPngDataUrl: previewUrl,
          priceDelta: totalPrice - basePrice,
        },
      });

      if (error || !data?.ok)
        throw new Error(data?.error || "Erro ao adicionar ao carrinho");

      toast.success("Produto adicionado ao carrinho!");
      navigate("/cart");
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error(error.message || "Erro ao adicionar ao carrinho");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">Carregando...</div>
    );
  }

  if (!product) {
    return null;
  }

  const basePrice = Number(product.unit_price || 0);
  const finalPrice = totalPrice || basePrice;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/catalog")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar ao catálogo
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview Configurado"
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
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
                  <span className="text-sm text-muted-foreground">
                    Preço base:
                  </span>
                  <span className="text-lg">R$ {basePrice.toFixed(2)}</span>
                </div>
                {finalPrice - basePrice > 0 && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-muted-foreground">
                      Personalização:
                    </span>
                    <span className="text-lg">
                      + R$ {(finalPrice - basePrice).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-3xl font-bold">
                    R$ {finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={adding || !config || product.stock_quantity <= 0}
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Adicionando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" /> Adicionar ao
                    carrinho
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Configurator */}
        <div>
          {isAdmin ? (
            <Tabs defaultValue="tester" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tester">Testar Cores</TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload SVG
                </TabsTrigger>
              </TabsList>
              <TabsContent value="tester" className="mt-6">
                <SVGColorTester
                  productId={product.id}
                  basePrice={basePrice}
                  onConfigChange={handleConfigChange}
                />
              </TabsContent>
              <TabsContent value="upload" className="mt-6">
                <SVGUploader
                  productId={product.id}
                  onSaved={() => {
                    toast.success("SVG salvo! Atualize a página para testar.");
                  }}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <SVGColorTester
              productId={product.id}
              basePrice={basePrice}
              onConfigChange={handleConfigChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
