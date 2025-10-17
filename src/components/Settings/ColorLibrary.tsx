import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Color {
  id: string;
  name: string;
  hex: string;
  cmyk: string;
  price_per_meter?: number;
  price_delta?: number;
  is_active: boolean;
  stock_product_id?: string;
}

interface ColorLibraryProps {
  type: "fabric" | "zipper" | "lining" | "bias";
}

export const ColorLibrary = ({ type }: ColorLibraryProps) => {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    hex: "#000000",
    c: "0",
    m: "0",
    y: "0",
    k: "100",
    price: "0",
    is_active: true,
  });

  const tableName = `${type}_colors`;
  const priceField =
    type === "fabric" || type === "lining" || type === "bias"
      ? "price_per_meter"
      : "price_delta";

  useEffect(() => {
    loadColors();
  }, [type]);

  const loadColors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .order("name");

      if (error) throw error;
      setColors((data as unknown as Color[]) || []);
    } catch (error: any) {
      console.error("Erro ao carregar cores:", error);
      toast.error("Erro ao carregar cores");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      hex: "#000000",
      c: "0",
      m: "0",
      y: "0",
      k: "100",
      price: "0",
      is_active: true,
    });
    setEditingColor(null);
  };

  const openEditDialog = (color: Color) => {
    const [c, m, y, k] = color.cmyk.split(",");
    setFormData({
      name: color.name,
      hex: color.hex,
      c: c || "0",
      m: m || "0",
      y: y || "0",
      k: k || "0",
      price: String(color.price_per_meter || color.price_delta || 0),
      is_active: color.is_active,
    });
    setEditingColor(color);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const colorData = {
        name: formData.name,
        hex: formData.hex,
        cmyk: `${formData.c},${formData.m},${formData.y},${formData.k}`,
        [priceField]: parseFloat(formData.price) || 0,
        is_active: formData.is_active,
      };

      if (editingColor) {
        const { error } = await supabase
          .from(tableName as any)
          .update(colorData)
          .eq("id", editingColor.id);

        if (error) throw error;
        toast.success("Cor atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from(tableName as any)
          .insert(colorData);

        if (error) throw error;
        toast.success("Cor adicionada com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      loadColors();
    } catch (error: any) {
      console.error("Erro ao salvar cor:", error);
      toast.error(error.message || "Erro ao salvar cor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta cor?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Cor deletada com sucesso!");
      loadColors();
    } catch (error: any) {
      console.error("Erro ao deletar cor:", error);
      toast.error(error.message || "Erro ao deletar cor");
    } finally {
      setLoading(false);
    }
  };

  const typeLabels = {
    fabric: "Tecido",
    zipper: "Zíper",
    lining: "Forro",
    bias: "Viés",
  };

  const priceLabel =
    type === "fabric" || type === "lining" || type === "bias"
      ? "Preço por Metro (R$)"
      : "Delta de Preço (R$)";

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Cores de {typeLabels[type]}</CardTitle>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Cor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingColor ? "Editar Cor" : "Nova Cor"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Azul Marinho"
                  />
                </div>

                <div>
                  <Label htmlFor="hex">Cor (HEX)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="hex"
                      type="color"
                      value={formData.hex}
                      onChange={(e) =>
                        setFormData({ ...formData, hex: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.hex}
                      onChange={(e) =>
                        setFormData({ ...formData, hex: e.target.value })
                      }
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor="c">C (%)</Label>
                    <Input
                      id="c"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.c}
                      onChange={(e) =>
                        setFormData({ ...formData, c: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="m">M (%)</Label>
                    <Input
                      id="m"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.m}
                      onChange={(e) =>
                        setFormData({ ...formData, m: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="y">Y (%)</Label>
                    <Input
                      id="y"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.y}
                      onChange={(e) =>
                        setFormData({ ...formData, y: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="k">K (%)</Label>
                    <Input
                      id="k"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.k}
                      onChange={(e) =>
                        setFormData({ ...formData, k: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="price">{priceLabel}</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Cor Ativa</Label>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading && colors.length === 0 ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : colors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma cor cadastrada
          </p>
        ) : (
          <div className="space-y-2">
            {colors.map((color) => (
              <div
                key={color.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded border"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div>
                    <p className="font-medium">{color.name}</p>
                    <p className="text-xs text-muted-foreground">
                      HEX: {color.hex} | CMYK: {color.cmyk}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {priceLabel}: R${" "}
                      {(
                        color.price_per_meter ||
                        color.price_delta ||
                        0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!color.is_active && (
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                      Inativa
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(color)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(color.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
