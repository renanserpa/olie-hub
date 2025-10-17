import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTinyApi } from "@/hooks/useTinyApi";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Truck,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<any[]>([]);
  const tinyApi = useTinyApi();

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, contacts(name, email, phone, address)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaymentLink = async () => {
    if (!order) return;
    try {
      const result = await tinyApi.createPaymentLink(
        order.id,
        order.total,
        `Pedido ${order.order_number}`,
        {
          name: order.contacts?.name,
          email: order.contacts?.email,
          phone: order.contacts?.phone,
        },
      );
      toast({ title: "Sucesso", description: "Link de pagamento criado!" });
      await fetchOrder();
      if (result.checkoutUrl) window.open(result.checkoutUrl, "_blank");
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleIssueNFe = async () => {
    if (!order) return;
    try {
      const result = await tinyApi.issueNFe(order.id);
      toast({ title: "Sucesso", description: "NFe emitida com sucesso!" });
      await fetchOrder();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleGetQuotes = async () => {
    if (!order || !order.contacts?.address?.cep) {
      toast({
        title: "Erro",
        description: "CEP do cliente não encontrado",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await tinyApi.getShippingQuote(
        order.id,
        order.contacts.address.cep,
        1,
        order.total,
      );
      setQuotes(result);
      toast({
        title: "Sucesso",
        description: `${result.length} opções encontradas`,
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCreateLabel = async (quote: any) => {
    if (!order) return;
    try {
      const result = await tinyApi.createShippingLabel(
        order.id,
        quote.serviceId,
        quote.carrier,
        quote.service,
        quote.price,
      );
      toast({ title: "Sucesso", description: "Etiqueta criada!" });
      await fetchOrder();
      if (result.labelUrl) window.open(result.labelUrl, "_blank");
    } catch (error) {
      // Error handled in hook
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Pedido não encontrado</p>
        <Button onClick={() => navigate("/orders")} className="mt-4">
          Voltar para Pedidos
        </Button>
      </div>
    );
  }

  const payment = order.payments?.[0];
  const fiscal = order.fiscal;
  const logistics = order.logistics;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Pedido {order.order_number}</h1>
          <p className="text-muted-foreground">
            Cliente: {order.contacts?.name || "N/A"}
          </p>
        </div>
        <Badge className="ml-auto">{order.status}</Badge>
      </div>

      {/* Itens do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          {order.items &&
          Array.isArray(order.items) &&
          order.items.length > 0 ? (
            <div className="space-y-3">
              {order.items.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-smooth"
                >
                  <div className="flex-1">
                    <p className="font-semibold">
                      {item.product_name || item.name}
                    </p>
                    {item.config_json && (
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        {item.config_json.color && (
                          <div className="flex items-center gap-2">
                            <span>Cor:</span>
                            <div
                              className="w-4 h-4 rounded border"
                              style={{
                                backgroundColor: item.config_json.color,
                              }}
                            />
                          </div>
                        )}
                        {item.config_json.material && (
                          <div>Material: {item.config_json.material}</div>
                        )}
                        {item.config_json.text && (
                          <div>Texto: "{item.config_json.text}"</div>
                        )}
                        {item.config_json.width && (
                          <div>
                            Dimensões: {item.config_json.width}x
                            {item.config_json.height}
                            {item.config_json.thickness &&
                              `x${item.config_json.thickness}`}
                            cm
                          </div>
                        )}
                        {item.config_json.notes && (
                          <div className="italic">
                            Obs: {item.config_json.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1 ml-4">
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x R$ {Number(item.unit_price).toFixed(2)}
                    </p>
                    <p className="font-bold">
                      R${" "}
                      {Number(
                        item.total || item.quantity * item.unit_price,
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              <Separator className="my-4" />

              {/* Totais */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {Number(order.subtotal).toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Desconto:</span>
                    <span>- R$ {Number(order.discount).toFixed(2)}</span>
                  </div>
                )}
                {order.shipping_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Frete:</span>
                    <span>R$ {Number(order.shipping_cost).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>R$ {Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum item encontrado neste pedido
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments">
            <CreditCard className="w-4 h-4 mr-2" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="fiscal">
            <FileText className="w-4 h-4 mr-2" />
            Fiscal (NFe)
          </TabsTrigger>
          <TabsTrigger value="shipping">
            <Truck className="w-4 h-4 mr-2" />
            Frete
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
              <CardDescription>
                Gerar e gerenciar link de pagamento via Tiny
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!payment && (
                <Button
                  onClick={handleCreatePaymentLink}
                  disabled={tinyApi.loading}
                >
                  {tinyApi.loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Gerar Link de Pagamento (Tiny)
                </Button>
              )}
              {payment && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge
                      variant={
                        payment.status === "paid" ? "default" : "secondary"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Método:</span>
                    <span>{payment.method}</span>
                  </div>
                  {payment.checkoutUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={payment.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir Link de Pagamento
                      </a>
                    </Button>
                  )}
                  <Separator />
                  <Button variant="outline" disabled>
                    Enviar por WhatsApp (requer integração WA)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal">
          <Card>
            <CardHeader>
              <CardTitle>Nota Fiscal Eletrônica</CardTitle>
              <CardDescription>Emitir NFe via Tiny (Olist)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!fiscal && (
                <Button onClick={handleIssueNFe} disabled={tinyApi.loading}>
                  {tinyApi.loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Emitir NFe (Tiny)
                </Button>
              )}
              {fiscal && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge
                      variant={
                        fiscal.status === "authorized" ? "default" : "secondary"
                      }
                    >
                      {fiscal.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Número:</span>
                    <span>{fiscal.nfeNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Série:</span>
                    <span>{fiscal.serie}</span>
                  </div>
                  {fiscal.pdfUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={fiscal.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        DANFE (PDF)
                      </a>
                    </Button>
                  )}
                  {fiscal.xmlUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={fiscal.xmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        XML
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Frete & Logística</CardTitle>
              <CardDescription>
                Cotação, etiqueta e rastreamento via Tiny
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!logistics && (
                <>
                  <Button onClick={handleGetQuotes} disabled={tinyApi.loading}>
                    {tinyApi.loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Cotação (Tiny)
                  </Button>
                  {quotes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Opções disponíveis:</p>
                      {quotes.map((q, i) => (
                        <Card key={i}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div>
                              <p className="font-medium">
                                {q.carrier} - {q.service}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                R$ {q.price.toFixed(2)} • {q.prazoDias} dias
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleCreateLabel(q)}
                              disabled={tinyApi.loading}
                            >
                              Gerar Etiqueta
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
              {logistics && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge>{logistics.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Transportadora:</span>
                    <span>{logistics.carrier}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Serviço:</span>
                    <span>{logistics.service}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Rastreamento:</span>
                    <span className="font-mono text-sm">
                      {logistics.tracking}
                    </span>
                  </div>
                  {logistics.labelUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={logistics.labelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Etiqueta (PDF)
                      </a>
                    </Button>
                  )}
                  <Separator />
                  <Button variant="outline" disabled>
                    Notificar Cliente (WA/Email - requer integração)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
