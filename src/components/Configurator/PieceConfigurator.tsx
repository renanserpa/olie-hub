import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Palette, Type, Ruler } from "lucide-react";

interface ConfiguratorProps {
  productId: string;
  onConfigChange: (config: {
    configJson: any;
    previewPngDataUrl: string;
    priceDelta: number;
  }) => void;
}

const MODELS = ["Básica", "Premium", "Deluxe"];
const SIZES = ["P", "M", "G", "GG"];
const COLORS = {
  corpo: ["#FFFFFF", "#000000", "#FF0000", "#0000FF", "#00FF00"],
  manga: ["#FFFFFF", "#000000", "#FF0000", "#0000FF", "#00FF00"],
  gola: ["#FFFFFF", "#000000", "#FF0000", "#0000FF", "#00FF00"],
};

export function PieceConfigurator({
  productId,
  onConfigChange,
}: ConfiguratorProps) {
  const [model, setModel] = useState(MODELS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [colors, setColors] = useState({
    corpo: COLORS.corpo[0],
    manga: COLORS.manga[0],
    gola: COLORS.gola[0],
  });
  const [customText, setCustomText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generatePreview();
  }, [model, size, colors, customText]);

  function generatePreview() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const startTime = performance.now();

    // Clear canvas
    ctx.clearRect(0, 0, 800, 800);

    // Draw simple preview (corpo, manga, gola)
    ctx.fillStyle = colors.corpo;
    ctx.fillRect(200, 200, 400, 400);

    ctx.fillStyle = colors.manga;
    ctx.fillRect(100, 250, 100, 300);
    ctx.fillRect(600, 250, 100, 300);

    ctx.fillStyle = colors.gola;
    ctx.fillRect(300, 200, 200, 50);

    // Draw custom text
    if (customText) {
      ctx.fillStyle = "#000000";
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.fillText(customText, 400, 420);
    }

    // Draw model/size label
    ctx.fillStyle = "#666666";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`${model} - Tamanho ${size}`, 20, 780);

    const latency = performance.now() - startTime;
    console.log(`[preview_latency_ms] ${latency.toFixed(0)}ms`);

    // Calculate price delta
    const modelPrices: Record<string, number> = {
      Básica: 0,
      Premium: 15,
      Deluxe: 30,
    };
    const textDelta = customText.length > 0 ? 10 : 0;
    const priceDelta = modelPrices[model] + textDelta;

    // Send config to parent
    const configJson = { model, size, colors, customText };
    const previewPngDataUrl = canvas.toDataURL("image/png");

    onConfigChange({ configJson, previewPngDataUrl, priceDelta });
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Personalize sua peça</h3>

        {/* Model */}
        <div className="space-y-2 mb-4">
          <Label className="flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Modelo
          </Label>
          <div className="flex gap-2">
            {MODELS.map((m) => (
              <Button
                key={m}
                variant={model === m ? "default" : "outline"}
                onClick={() => setModel(m)}
                size="sm"
              >
                {m}
              </Button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2 mb-4">
          <Label>Tamanho</Label>
          <div className="flex gap-2">
            {SIZES.map((s) => (
              <Button
                key={s}
                variant={size === s ? "default" : "outline"}
                onClick={() => setSize(s)}
                size="sm"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-4 mb-4">
          <Label className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Cores
          </Label>

          {Object.keys(COLORS).map((part) => (
            <div key={part} className="space-y-2">
              <Label className="text-sm capitalize">{part}</Label>
              <div className="flex gap-2">
                {COLORS[part as keyof typeof COLORS].map((color) => (
                  <button
                    key={color}
                    className={`w-10 h-10 rounded border-2 ${
                      colors[part as keyof typeof colors] === color
                        ? "border-primary"
                        : "border-border"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setColors({ ...colors, [part]: color })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Text */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Personalização (texto)
          </Label>
          <Input
            placeholder="Digite seu texto..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            maxLength={20}
          />
        </div>
      </Card>

      {/* Preview Canvas */}
      <Card className="p-4">
        <h4 className="font-medium mb-2">Pré-visualização</h4>
        <canvas
          ref={canvasRef}
          width={800}
          height={800}
          className="w-full border rounded"
          style={{ maxHeight: "400px", objectFit: "contain" }}
        />
      </Card>
    </div>
  );
}
