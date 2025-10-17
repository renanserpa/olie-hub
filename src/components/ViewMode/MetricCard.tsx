import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  trend?: string;
  color?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "bg-card",
}: MetricCardProps) {
  return (
    <Card className={cn("p-4", color)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            {title}
          </p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </Card>
  );
}
