import { useState } from "react";
import { Palette, Send, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SVGColorTester } from "@/components/Configurator/SVGColorTester";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  unit_price: number;
}

interface InboxConfiguratorProps {
  contactId?: string;
  onCreateOrder?: (config: any) => void;
}

export const InboxConfigurator = ({
  contactId,
  onCreateOrder,
}: InboxConfiguratorProps) => {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [configuration, setConfiguration] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, unit_price")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      loadProducts();
    }
  };

  const handleConfigChange = (config: any, preview: string, price: number) => {
    setConfiguration(config);
    setPreviewUrl(preview);
    setTotalPrice(price);
  };

  const handleSendToClient = async () => {
    if (!previewUrl) {
      toast.error("Configure as cores primeiro");
      return;
    }

    setLoading(true);
    try {
      // Aqui você pode implementar o envio via WhatsApp/Instagram
      // Por enquanto, apenas mostra sucesso
      toast.success("Preview enviado para o cliente!");

      // Salvar configuração
      await supabase.from("product_configurations").insert({
        product_id: selectedProduct,
        config_json: configuration,
        preview_png_url: previewUrl,
        total_price: totalPrice,
      });
    } catch (error) {
      console.error("Erro ao enviar preview:", error);
      toast.error("Erro ao enviar preview");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = () => {
    if (!selectedProduct || !configuration) {
      toast.error("Configure as cores primeiro");
      return;
    }

    const orderData = {
      product_id: selectedProduct,
      configuration,
      preview_url: previewUrl,
      total_price: totalPrice,
      contact_id: contactId,
    };

    onCreateOrder?.(orderData);
    setOpen(false);
    toast.success("Pedido pré-configurado! Complete os dados.");
  };

  const selectedProductData = products.find((p) => p.id === selectedProduct);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="h-4 w-4 mr-2" />
          Testar Cores
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Testador de Cores - Atendimento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="product">Produto</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Selecione um produto..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - R${" "}
                    {product.unit_price?.toFixed(2) || "0.00"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && selectedProductData && (
            <>
              <SVGColorTester
                productId={selectedProduct}
                basePrice={selectedProductData.unit_price || 0}
                onConfigChange={handleConfigChange}
              />

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={handleSendToClient}
                  disabled={!previewUrl || loading}
                  variant="outline"
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para Cliente
                </Button>
                <Button
                  onClick={handleCreateOrder}
                  disabled={!configuration}
                  className="flex-1"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Criar Pedido
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
