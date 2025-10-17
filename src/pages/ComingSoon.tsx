import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function ComingSoon({
  title,
  description,
  icon: Icon,
}: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="p-12 max-w-md text-center shadow-elegant">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Icon className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">{title}</h1>
        <p className="text-muted-foreground mb-6">{description}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-soft">
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          <span className="text-sm font-medium text-accent">
            Em desenvolvimento
          </span>
        </div>
      </Card>
    </div>
  );
}
