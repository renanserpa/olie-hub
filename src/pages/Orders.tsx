import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  FileText,
  CreditCard,
  Truck,
  MoreVertical,
  Eye,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderDialog } from "@/components/Orders/OrderDialog";
import { KanbanBoard, KanbanColumn } from "@/components/Kanban/KanbanBoard";
import { KanbanCard } from "@/components/Kanban/KanbanCard";
import { toast } from "sonner";

const ORDER_COLUMNS: KanbanColumn[] = [
  {
    id: "pending_payment",
    label: "Aguardando Pagamento",
    color: "bg-yellow-100",
  },
  { id: "paid", label: "Pago", color: "bg-green-100" },
  { id: "in_production", label: "Em Produção", color: "bg-blue-100" },
  { id: "awaiting_shipping", label: "Pronto p/ Envio", color: "bg-purple-100" },
  { id: "shipped", label: "Enviado", color: "bg-indigo-100" },
  { id: "delivered", label: "Entregue", color: "bg-emerald-100" },
  { id: "cancelled", label: "Cancelado", color: "bg-red-100" },
];

export default function Orders() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">(() => {
    return (
      (localStorage.getItem("orders_view_mode") as "list" | "kanban") || "list"
    );
  });

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          contacts(name),
          items
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending_payment: "Aguardando Pagamento",
      paid: "Pago",
      in_production: "Em Produção",
      awaiting_shipping: "Aguardando Envio",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      await loadOrders();
      toast.success("Status atualizado com sucesso");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  }

  function renderOrderCard(order: any) {
    return (
      <KanbanCard id={order.id}>
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                #{order.order_number}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {order.contacts?.name || "Cliente"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${order.id}`);
              }}
            >
              <Eye className="w-3 h-3" />
            </Button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-semibold">
                R$ {Number(order.total).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Itens:</span>
              <span>{Array.isArray(order.items) ? order.items.length : 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <div
              className={`flex items-center gap-1 ${order.payments ? "text-success" : "text-muted-foreground"}`}
            >
              <CreditCard className="w-3 h-3" />
            </div>
            <div
              className={`flex items-center gap-1 ${order.fiscal ? "text-success" : "text-muted-foreground"}`}
            >
              <FileText className="w-3 h-3" />
            </div>
            <div
              className={`flex items-center gap-1 ${order.logistics ? "text-success" : "text-muted-foreground"}`}
            >
              <Truck className="w-3 h-3" />
            </div>
          </div>
        </div>
      </KanbanCard>
    );
  }

  useEffect(() => {
    localStorage.setItem("orders_view_mode", viewMode);
  }, [viewMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">Carregando...</div>
    );
  }

  return (
    <div className="space-y-6">
      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        onSuccess={loadOrders}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os pedidos e integrações com Tiny
          </p>
        </div>
        <Button
          className="gradient-primary shadow-glow"
          onClick={() => setOrderDialogOpen(true)}
        >
          + Novo Pedido
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por pedido, cliente, produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Content */}
      {viewMode === "kanban" ? (
        <KanbanBoard
          columns={ORDER_COLUMNS}
          items={orders.filter(
            (order) =>
              order.order_number
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              order.contacts?.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()),
          )}
          onStatusChange={handleStatusChange}
          renderCard={renderOrderCard}
          loading={loading}
        />
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Aguardando Pagamento</TabsTrigger>
            <TabsTrigger value="paid">Pagos</TabsTrigger>
            <TabsTrigger value="production">Em Produção</TabsTrigger>
            <TabsTrigger value="shipping">Aguardando Envio</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {orders
              .filter(
                (order) =>
                  order.order_number
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  order.contacts?.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()),
              )
              .map((order) => (
                <Card
                  key={order.id}
                  className="p-6 shadow-card hover:shadow-elegant transition-smooth"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          Pedido {order.order_number}
                        </h3>
                        <Badge variant={getStatusVariant(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Cliente
                          </p>
                          <p className="font-medium text-foreground">
                            {order.contacts?.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Itens
                          </p>
                          <p className="font-medium text-foreground">
                            {Array.isArray(order.items)
                              ? order.items.length
                              : 0}{" "}
                            item(s)
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Valor
                          </p>
                          <p className="font-medium text-foreground">
                            R$ {Number(order.total).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Data
                          </p>
                          <p className="font-medium text-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Integration Status */}
                      <div className="flex items-center gap-6 pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <CreditCard
                            className={`w-4 h-4 ${order.payments ? "text-success" : "text-muted-foreground"}`}
                          />
                          <span className="text-sm">
                            {order.payments ? "Pagamento OK" : "Aguardando"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText
                            className={`w-4 h-4 ${order.fiscal ? "text-success" : "text-muted-foreground"}`}
                          />
                          <span className="text-sm">
                            {order.fiscal ? "NFe Emitida" : "Sem NFe"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck
                            className={`w-4 h-4 ${order.logistics ? "text-success" : "text-muted-foreground"}`}
                          />
                          <span className="text-sm">
                            {order.logistics ? "Rastreio Ativo" : "Sem envio"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <FileText className="w-4 h-4" />
                          Emitir NFe
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Truck className="w-4 h-4" />
                          Gerar Etiqueta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "paid":
    case "delivered":
      return "default";
    case "in_production":
      return "secondary";
    case "shipped":
    case "awaiting_shipping":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
};
