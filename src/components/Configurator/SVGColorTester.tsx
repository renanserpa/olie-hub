import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download } from "lucide-react";

interface SVGMapping {
  pathId: string;
  type: 'fabric' | 'zipper' | 'lining' | 'bias';
  label: string;
}

interface Color {
  id: string;
  name: string;
  hex: string;
  cmyk: string;
  price_per_meter?: number;
  price_delta?: number;
}

interface SVGColorTesterProps {
  productId: string;
  basePrice?: number;
  onConfigChange?: (config: any, previewUrl: string, totalPrice: number) => void;
}

export const SVGColorTester = ({ productId, basePrice = 0, onConfigChange }: SVGColorTesterProps) => {
  const [svgContent, setSvgContent] = useState<string>("");
  const [mappings, setMappings] = useState<SVGMapping[]>([]);
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});
  const [fabricColors, setFabricColors] = useState<Color[]>([]);
  const [zipperColors, setZipperColors] = useState<Color[]>([]);
  const [liningColors, setLiningColors] = useState<Color[]>([]);
  const [biasColors, setBiasColors] = useState<Color[]>([]);
  const [totalPrice, setTotalPrice] = useState(basePrice);
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSVGAndMappings();
    loadColors();
  }, [productId]);

  useEffect(() => {
    if (svgContent && mappings.length > 0) {
      updateSVGColors();
      calculatePrice();
    }
  }, [selectedColors, svgContent, mappings]);

  const loadSVGAndMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('product_svg_maps')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error) throw error;

      if (data) {
        setMappings(data.svg_mapping as unknown as SVGMapping[]);
        
        // Buscar conteúdo do SVG
        const response = await fetch(data.svg_url);
        const svgText = await response.text();
        setSvgContent(svgText);
      }
    } catch (error: any) {
      console.error("Erro ao carregar SVG:", error);
      if (error.code !== 'PGRST116') {
        toast.error("Erro ao carregar SVG do produto");
      }
    }
  };

  const loadColors = async () => {
    try {
      const [fabric, zipper, lining, bias] = await Promise.all([
        supabase.from('fabric_colors').select('*').eq('is_active', true),
        supabase.from('zipper_colors').select('*').eq('is_active', true),
        supabase.from('lining_colors').select('*').eq('is_active', true),
        supabase.from('bias_colors').select('*').eq('is_active', true)
      ]);

      setFabricColors(fabric.data || []);
      setZipperColors(zipper.data || []);
      setLiningColors(lining.data || []);
      setBiasColors(bias.data || []);
    } catch (error) {
      console.error("Erro ao carregar cores:", error);
      toast.error("Erro ao carregar cores disponíveis");
    }
  };

  const updateSVGColors = () => {
    if (!svgRef.current || !svgContent) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, "image/svg+xml");

    mappings.forEach((mapping) => {
      const colorId = selectedColors[mapping.pathId];
      if (!colorId) return;

      const color = getAllColors().find(c => c.id === colorId);
      if (!color) return;

      const element = doc.getElementById(mapping.pathId);
      if (element) {
        element.setAttribute('fill', color.hex);
      }
    });

    const serializer = new XMLSerializer();
    const updatedSvg = serializer.serializeToString(doc);
    
    if (svgRef.current) {
      svgRef.current.innerHTML = updatedSvg;
    }
  };

  const getAllColors = (): Color[] => {
    return [...fabricColors, ...zipperColors, ...liningColors, ...biasColors];
  };

  const getColorsByType = (type: string): Color[] => {
    switch (type) {
      case 'fabric': return fabricColors;
      case 'zipper': return zipperColors;
      case 'lining': return liningColors;
      case 'bias': return biasColors;
      default: return [];
    }
  };

  const calculatePrice = () => {
    let price = basePrice;

    mappings.forEach((mapping) => {
      const colorId = selectedColors[mapping.pathId];
      if (!colorId) return;

      const color = getAllColors().find(c => c.id === colorId);
      if (!color) return;

      if (color.price_per_meter) {
        price += color.price_per_meter;
      } else if (color.price_delta) {
        price += color.price_delta;
      }
    });

    setTotalPrice(price);

    if (onConfigChange) {
      exportPreview().then(previewUrl => {
        onConfigChange(selectedColors, previewUrl, price);
      });
    }
  };

  const exportPreview = async (): Promise<string> => {
    if (!svgRef.current) return "";
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return "";

    const img = new Image();
    const svgBlob = new Blob([svgRef.current.innerHTML], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 800, 800);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = url;
    });
  };

  const handleDownloadPreview = async () => {
    const dataUrl = await exportPreview();
    const link = document.createElement('a');
    link.download = `preview-${productId}.png`;
    link.href = dataUrl;
    link.click();
    toast.success("Preview baixado com sucesso!");
  };

  if (!svgContent || mappings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            Configure o SVG do produto primeiro
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Seleção de Cores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mappings.map((mapping) => (
            <div key={mapping.pathId}>
              <Label htmlFor={mapping.pathId}>{mapping.label}</Label>
              <Select
                value={selectedColors[mapping.pathId] || ""}
                onValueChange={(value) => setSelectedColors({
                  ...selectedColors,
                  [mapping.pathId]: value
                })}
              >
                <SelectTrigger id={mapping.pathId}>
                  <SelectValue placeholder="Selecione uma cor..." />
                </SelectTrigger>
                <SelectContent>
                  {getColorsByType(mapping.type).map((color) => (
                    <SelectItem key={color.id} value={color.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                        <span className="text-xs text-muted-foreground ml-auto">
                          CMYK: {color.cmyk}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Preço Total:</span>
              <span className="text-lg font-bold">
                R$ {totalPrice.toFixed(2)}
              </span>
            </div>
            <Button onClick={handleDownloadPreview} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Baixar Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={svgRef}
            className="w-full aspect-square border rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden"
          />
        </CardContent>
      </Card>
    </div>
  );
};
