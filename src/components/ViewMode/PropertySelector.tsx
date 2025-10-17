import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export interface PropertyDefinition {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "badge" | "image";
  defaultVisible: boolean;
}

interface PropertySelectorProps {
  availableProperties: PropertyDefinition[];
  selectedProperties: string[];
  onChange: (properties: string[]) => void;
}

export function PropertySelector({
  availableProperties,
  selectedProperties,
  onChange,
}: PropertySelectorProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (propertyId: string) => {
    const newSelection = selectedProperties.includes(propertyId)
      ? selectedProperties.filter((id) => id !== propertyId)
      : [...selectedProperties, propertyId];
    onChange(newSelection);
  };

  const handleReset = () => {
    const defaults = availableProperties
      .filter((p) => p.defaultVisible)
      .map((p) => p.id);
    onChange(defaults);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="w-4 h-4 mr-2" />
          Colunas ({selectedProperties.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Propriedades Visíveis</h4>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Restaurar
            </Button>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {availableProperties.map((property) => (
                <div key={property.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={property.id}
                    checked={selectedProperties.includes(property.id)}
                    onCheckedChange={() => handleToggle(property.id)}
                  />
                  <Label
                    htmlFor={property.id}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {property.label}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
