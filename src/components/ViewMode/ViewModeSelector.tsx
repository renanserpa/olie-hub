import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LayoutGrid, LayoutList, Table, Image, Columns } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list" | "table" | "gallery" | "kanban";

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  availableModes?: ViewMode[];
  className?: string;
}

const MODE_CONFIG: Record<ViewMode, { icon: any; label: string }> = {
  grid: { icon: LayoutGrid, label: "Grade" },
  list: { icon: LayoutList, label: "Lista" },
  table: { icon: Table, label: "Tabela" },
  gallery: { icon: Image, label: "Galeria" },
  kanban: { icon: Columns, label: "Kanban" },
};

export function ViewModeSelector({
  value,
  onChange,
  availableModes = ["grid", "list", "table", "kanban"],
  className,
}: ViewModeSelectorProps) {
  return (
    <TooltipProvider>
      <div className={cn("flex gap-1 border rounded-lg p-1", className)}>
        {availableModes.map((mode) => {
          const config = MODE_CONFIG[mode];
          const Icon = config.icon;

          return (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <Button
                  variant={value === mode ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onChange(mode)}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{config.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
