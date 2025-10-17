import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ImportDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: ImportDialogProps) => {
  const [entity, setEntity] = useState<string>("products");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [preview, setPreview] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(null);
    }
  };

  const downloadTemplate = () => {
    const templates: Record<string, string> = {
      products:
        "name,sku,description,unit_price,stock_quantity,category\nProduto Exemplo,SKU001,Descrição do produto,99.90,10,finished",
      contacts:
        "name,email,phone,cpf_cnpj\nJoão Silva,joao@email.com,11999999999,12345678900",
      inventory: "sku,quantity,type,reason\nSKU001,10,in,Compra inicial",
    };

    const content = templates[entity] || "";
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template-${entity}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        return headers.reduce((obj: any, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {});
      });

      if (dryRun) {
        setPreview({
          total: rows.length,
          sample: rows.slice(0, 5),
          headers,
        });
        toast({
          title: "Preview",
          description: `${rows.length} registros encontrados. Revise e clique em Importar para confirmar.`,
        });
        setDryRun(false);
        return;
      }

      // Import based on entity
      if (entity === "products") {
        const { error } = await supabase.from("products").insert(
          rows.map((r) => ({
            name: r.name,
            sku: r.sku,
            description: r.description,
            unit_price: parseFloat(r.unit_price),
            stock_quantity: parseInt(r.stock_quantity),
            category: r.category,
          })),
        );
        if (error) throw error;
      } else if (entity === "contacts") {
        const { error } = await supabase.from("contacts").insert(rows);
        if (error) throw error;
      } else if (entity === "inventory") {
        for (const row of rows) {
          const { data: product } = await supabase
            .from("products")
            .select("id, stock_quantity")
            .eq("sku", row.sku)
            .single();

          if (product) {
            const quantity = parseInt(row.quantity);
            const newStock =
              row.type === "in"
                ? product.stock_quantity + quantity
                : product.stock_quantity - quantity;

            await supabase
              .from("products")
              .update({ stock_quantity: newStock })
              .eq("id", product.id);
            await supabase.from("inventory_movements").insert({
              product_id: product.id,
              type: row.type,
              quantity,
              reason: row.reason,
            });
          }
        }
      }

      toast({
        title: "Sucesso",
        description: `${rows.length} registros importados`,
      });
      onSuccess();
      onOpenChange(false);
      setFile(null);
      setPreview(null);
      setDryRun(true);
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Erro ao importar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Dados</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Tipo de Dados</Label>
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="products">Produtos</SelectItem>
                <SelectItem value="contacts">Contatos</SelectItem>
                <SelectItem value="inventory">
                  Movimentações de Estoque
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Arquivo CSV</Label>
            <Input type="file" accept=".csv" onChange={handleFileChange} />
          </div>

          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Template
          </Button>

          {preview && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">
                    {preview.total} registros encontrados
                  </p>
                  <p className="text-sm">
                    Campos: {preview.headers.join(", ")}
                  </p>
                  <p className="text-sm">Primeiros registros:</p>
                  <ul className="text-xs space-y-1">
                    {preview.sample.map((item: any, i: number) => (
                      <li key={i}>{JSON.stringify(item).slice(0, 100)}...</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || !file}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              {loading
                ? "Importando..."
                : preview
                  ? "Confirmar Importação"
                  : "Preview"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
