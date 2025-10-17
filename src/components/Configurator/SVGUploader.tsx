import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SVGMapping {
  pathId: string;
  type: "fabric" | "zipper" | "lining" | "bias";
  label: string;
}

interface SVGUploaderProps {
  productId: string;
  onSaved?: () => void;
}

export const SVGUploader = ({ productId, onSaved }: SVGUploaderProps) => {
  const [svgFile, setSvgFile] = useState<File | null>(null);
  const [svgPreview, setSvgPreview] = useState<string>("");
  const [pathIds, setPathIds] = useState<string[]>([]);
  const [mappings, setMappings] = useState<SVGMapping[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("svg")) {
      toast.error("Por favor, selecione um arquivo SVG");
      return;
    }

    setSvgFile(file);
    const text = await file.text();
    setSvgPreview(text);

    // Extrair IDs dos paths do SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    const paths = doc.querySelectorAll("[id]");
    const ids = Array.from(paths)
      .map((p) => p.id)
      .filter(Boolean);
    setPathIds(ids);
  };

  const addMapping = () => {
    setMappings([...mappings, { pathId: "", type: "fabric", label: "" }]);
  };

  const updateMapping = (
    index: number,
    field: keyof SVGMapping,
    value: string,
  ) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], [field]: value };
    setMappings(updated);
  };

  const removeMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!svgFile || mappings.length === 0) {
      toast.error("Adicione o SVG e pelo menos um mapeamento");
      return;
    }

    const invalidMappings = mappings.filter((m) => !m.pathId || !m.label);
    if (invalidMappings.length > 0) {
      toast.error("Complete todos os campos dos mapeamentos");
      return;
    }

    setLoading(true);
    try {
      // Upload SVG para Storage
      const fileName = `${productId}-${Date.now()}.svg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-svgs")
        .upload(fileName, svgFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-svgs").getPublicUrl(fileName);

      // Salvar mapeamento no banco
      const { error: dbError } = await supabase
        .from("product_svg_maps")
        .insert({
          product_id: productId,
          svg_url: publicUrl,
          svg_mapping: mappings as any,
        });

      if (dbError) throw dbError;

      toast.success("SVG e mapeamento salvos com sucesso!");
      setSvgFile(null);
      setSvgPreview("");
      setMappings([]);
      onSaved?.();
    } catch (error: any) {
      console.error("Erro ao salvar SVG:", error);
      toast.error(error.message || "Erro ao salvar SVG");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload e Mapeamento de SVG</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="svg-file">Arquivo SVG</Label>
          <Input
            id="svg-file"
            type="file"
            accept=".svg"
            onChange={handleFileChange}
          />
        </div>

        {svgPreview && (
          <div className="border rounded p-4 bg-muted/50">
            <div
              dangerouslySetInnerHTML={{ __html: svgPreview }}
              className="max-h-64 overflow-auto"
            />
          </div>
        )}

        {pathIds.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Mapeamento de Partes</Label>
              <Button onClick={addMapping} size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Adicionar Mapeamento
              </Button>
            </div>

            {mappings.map((mapping, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>ID do Path</Label>
                  <Select
                    value={mapping.pathId}
                    onValueChange={(value) =>
                      updateMapping(index, "pathId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pathIds.map((id) => (
                        <SelectItem key={id} value={id}>
                          {id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Tipo</Label>
                  <Select
                    value={mapping.type}
                    onValueChange={(value) =>
                      updateMapping(index, "type", value as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fabric">Tecido</SelectItem>
                      <SelectItem value="zipper">Zíper</SelectItem>
                      <SelectItem value="lining">Forro</SelectItem>
                      <SelectItem value="bias">Viés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Nome</Label>
                  <Input
                    value={mapping.label}
                    onChange={(e) =>
                      updateMapping(index, "label", e.target.value)
                    }
                    placeholder="Ex: Corpo Principal"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMapping(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "Salvando..." : "Salvar SVG e Mapeamento"}
        </Button>
      </CardContent>
    </Card>
  );
};
