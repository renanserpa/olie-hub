import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactDialog } from "@/components/Contacts/ContactDialog";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MessageCircle,
  Instagram,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  birthdate: string | null;
  address: any;
  cpf_cnpj: string | null;
  notes: string | null;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total: string | number;
  items: any;
}

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchContactData();
    }
  }, [id]);

  const fetchContactData = async () => {
    setLoading(true);
    try {
      // Fetch contact
      const { data: contactData, error: contactError } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .single();

      if (contactError) throw contactError;
      setContact(contactData);

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("contact_id", id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (error: any) {
      console.error("Error fetching contact data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const metrics = {
    totalOrders: orders.length,
    totalSpent: orders.reduce(
      (sum, o) => sum + parseFloat(o.total.toString()),
      0,
    ),
    avgTicket:
      orders.length > 0
        ? orders.reduce((sum, o) => sum + parseFloat(o.total.toString()), 0) /
          orders.length
        : 0,
    lastOrder: orders[0],
    daysSinceLastOrder: orders[0]
      ? Math.floor(
          (Date.now() - new Date(orders[0].created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null,
  };

  // Top products
  const productCounts = new Map<
    string,
    { count: number; total: number; name: string }
  >();
  orders.forEach((order) => {
    const items = order.items as any[];
    items?.forEach((item) => {
      const current = productCounts.get(item.product_id) || {
        count: 0,
        total: 0,
        name: item.name,
      };
      productCounts.set(item.product_id, {
        count: current.count + (item.quantity || 0),
        total: current.total + 1,
        name: item.name,
      });
    });
  });
  const topProducts = Array.from(productCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  // Monthly data for chart
  const monthlyDataMap = new Map<string, number>();
  orders.forEach((order) => {
    const month = format(new Date(order.created_at), "MMM/yy", {
      locale: ptBR,
    });
    monthlyDataMap.set(
      month,
      (monthlyDataMap.get(month) || 0) + parseFloat(order.total.toString()),
    );
  });
  const monthlyData = Array.from(monthlyDataMap.entries())
    .map(([month, total]) => ({ month, total }))
    .reverse()
    .slice(0, 6)
    .reverse();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_payment: "bg-yellow-500",
      paid: "bg-green-500",
      in_production: "bg-blue-500",
      ready_to_ship: "bg-purple-500",
      shipped: "bg-indigo-500",
      delivered: "bg-emerald-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_payment: "Aguardando Pagamento",
      paid: "Pago",
      in_production: "Em Produção",
      ready_to_ship: "Pronto para Envio",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Contato não encontrado</p>
        <Button onClick={() => navigate("/contacts")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Contatos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/contacts")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
            {getInitials(contact.name)}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{contact.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth"
                >
                  <Mail className="w-4 h-4" />
                  {contact.email}
                </a>
              )}
              {contact.whatsapp && (
                <a
                  href={`https://wa.me/55${contact.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
              {contact.instagram && (
                <a
                  href={`https://instagram.com/${contact.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth"
                >
                  <Instagram className="w-4 h-4" />@{contact.instagram}
                </a>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Pedidos</p>
              <p className="text-2xl font-bold">{metrics.totalOrders}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold">
                R$ {metrics.totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold">
                R$ {metrics.avgTicket.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Compra</p>
              <p className="text-2xl font-bold">
                {metrics.daysSinceLastOrder !== null
                  ? `${metrics.daysSinceLastOrder}d`
                  : "Nunca"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="orders">Pedidos ({orders.length})</TabsTrigger>
          <TabsTrigger value="products">Produtos Favoritos</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Dados Pessoais</h3>
              <div className="space-y-3 text-sm">
                {contact.birthdate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Nascimento:</span>
                    <span>
                      {format(new Date(contact.birthdate), "dd/MM/yyyy")}
                    </span>
                  </div>
                )}
                {contact.cpf_cnpj && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">CPF/CNPJ:</span>
                    <span>{contact.cpf_cnpj}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{contact.phone}</span>
                  </div>
                )}
              </div>
            </Card>

            {contact.address && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </h3>
                <div className="text-sm space-y-1">
                  <p>
                    {contact.address.logradouro}, {contact.address.numero}
                  </p>
                  {contact.address.complemento && (
                    <p>{contact.address.complemento}</p>
                  )}
                  <p>{contact.address.bairro}</p>
                  <p>
                    {contact.address.cidade} - {contact.address.estado}
                  </p>
                  <p className="text-muted-foreground">
                    CEP: {contact.address.cep}
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Chart */}
          {monthlyData.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Pedidos por Mês</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}

          {contact.notes && (
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Observações</h3>
              <p className="text-sm text-muted-foreground">{contact.notes}</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders">
          {orders.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum pedido ainda</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <Link
                          to={`/orders/${order.id}`}
                          className="font-semibold hover:text-primary transition-smooth"
                        >
                          {order.order_number}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(order.created_at),
                            "dd/MM/yyyy HH:mm",
                          )}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        R$ {parseFloat(order.total.toString()).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.items?.length || 0}{" "}
                        {order.items?.length === 1 ? "item" : "itens"}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products">
          {topProducts.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum produto comprado ainda
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {topProducts.map(([id, data]) => (
                <Card key={id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Comprado {data.total}{" "}
                        {data.total === 1 ? "vez" : "vezes"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{data.count}</p>
                      <p className="text-sm text-muted-foreground">unidades</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={contact}
        onSuccess={fetchContactData}
      />
    </div>
  );
}
