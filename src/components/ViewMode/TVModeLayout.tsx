import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TVModeLayoutProps {
  title: string;
  onExit: () => void;
  dashboard: React.ReactNode;
  children: React.ReactNode;
}

export function TVModeLayout({
  title,
  onExit,
  dashboard,
  children,
}: TVModeLayoutProps) {
  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden">
      <header className="h-16 border-b px-6 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="text-sm text-muted-foreground">
            Atualizado em {new Date().toLocaleTimeString("pt-BR")}
          </div>
        </div>
        <Button variant="ghost" onClick={onExit}>
          <X className="w-4 h-4 mr-2" />
          Sair do Modo TV
        </Button>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="w-80 border-r p-4 overflow-y-auto bg-muted/30">
          <h2 className="font-semibold mb-4 text-sm text-muted-foreground uppercase">
            Dashboard
          </h2>
          <div className="space-y-4">{dashboard}</div>
        </aside>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
