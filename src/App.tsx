import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import { useAuthStore } from "@/stores/authStore";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import { 
  MessageSquare, 
  Factory, 
  Package, 
  Truck, 
  Users, 
  Settings 
} from "lucide-react";

const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, login } = useAuthStore();
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    // Auto-login for demo purposes
    if (!isAuthenticated) {
      login('admin@olie.com', 'demo').then(() => {
        setIsInitialized(true);
      });
    } else {
      setIsInitialized(true);
    }
  }, [isAuthenticated, login]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-subtle">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/inbox" element={
            <ProtectedRoute>
              <ComingSoon 
                title="Inbox"
                description="Sistema de atendimento integrado com WhatsApp e Instagram em desenvolvimento."
                icon={MessageSquare}
              />
            </ProtectedRoute>
          } />
          <Route path="/production" element={
            <ProtectedRoute>
              <ComingSoon 
                title="Produção"
                description="Kanban de produção com etapas, SLAs e alertas em desenvolvimento."
                icon={Factory}
              />
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute>
              <ComingSoon 
                title="Estoque"
                description="Gestão de produtos, insumos e movimentações em desenvolvimento."
                icon={Package}
              />
            </ProtectedRoute>
          } />
          <Route path="/logistics" element={
            <ProtectedRoute>
              <ComingSoon 
                title="Entregas & Logística"
                description="Painel de tracking integrado com Tiny em desenvolvimento."
                icon={Truck}
              />
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <ComingSoon 
                title="Equipe"
                description="Comunicação interna, chat e tarefas em desenvolvimento."
                icon={Users}
              />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <ComingSoon 
                title="Configurações"
                description="Gestão de acessos, integrações e configurações do sistema."
                icon={Settings}
              />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
