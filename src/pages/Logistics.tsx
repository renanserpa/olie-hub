import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Package, MapPin, Clock, CheckCircle2 } from 'lucide-react';

export default function Logistics() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          contact_id,
          contacts(name, address)
        `)
        .in('status', ['paid', 'in_production', 'awaiting_shipping', 'shipped'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }

  function getShippingStatus(order: any) {
    const logistics = order.logistics || {};
    if (logistics.tracking) return 'in_transit';
    if (logistics.label_url) return 'label_created';
    if (logistics.quotes?.length > 0) return 'quoted';
    return 'pending';
  }

  function filterOrdersByShipping(status: string) {
    return orders.filter(o => getShippingStatus(o) === status);
  }

  const pendingOrders = filterOrdersByShipping('pending');
  const quotedOrders = filterOrdersByShipping('quoted');
  const labeledOrders = filterOrdersByShipping('label_created');
  const transitOrders = filterOrdersByShipping('in_transit');

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Entregas & Logística</h1>
        <p className="text-muted-foreground mt-1">
          Painel de envios e rastreamento (dados locais - integrações desabilitadas)
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="quoted">Cotados ({quotedOrders.length})</TabsTrigger>
          <TabsTrigger value="labeled">Etiquetados ({labeledOrders.length})</TabsTrigger>
          <TabsTrigger value="transit">Em Trânsito ({transitOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {orders.map(order => (
            <ShippingCard key={order.id} order={order} />
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingOrders.map(order => (
            <ShippingCard key={order.id} order={order} />
          ))}
        </TabsContent>

        <TabsContent value="quoted" className="space-y-4">
          {quotedOrders.map(order => (
            <ShippingCard key={order.id} order={order} />
          ))}
        </TabsContent>

        <TabsContent value="labeled" className="space-y-4">
          {labeledOrders.map(order => (
            <ShippingCard key={order.id} order={order} />
          ))}
        </TabsContent>

        <TabsContent value="transit" className="space-y-4">
          {transitOrders.map(order => (
            <ShippingCard key={order.id} order={order} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ShippingCard({ order }: { order: any }) {
  const logistics = order.logistics || {};
  const tracking = logistics.tracking;
  const label = logistics.label_url;
  const quotes = logistics.quotes || [];

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">#{order.order_number}</h3>
            <Badge variant="secondary">
              {order.status}
            </Badge>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>{order.contacts?.name || 'Cliente'}</span>
            </div>
            {order.contacts?.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>
                  {order.contacts.address.city}, {order.contacts.address.state}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-2xl font-bold">R$ {Number(order.total || 0).toFixed(2)}</p>
        </div>
      </div>

      {tracking && (
        <div className="bg-success/10 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-5 h-5 text-success" />
            <span className="font-semibold text-success">Em Trânsito</span>
          </div>
          <p className="text-sm">Código: {tracking}</p>
          {logistics.carrier && (
            <p className="text-sm text-muted-foreground">
              Transportadora: {logistics.carrier}
            </p>
          )}
        </div>
      )}

      {!tracking && label && (
        <div className="bg-primary/10 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="font-semibold">Etiqueta Criada</span>
          </div>
          <Button variant="outline" size="sm">
            Ver Etiqueta
          </Button>
        </div>
      )}

      {!tracking && !label && quotes.length > 0 && (
        <div className="border rounded-lg p-4 mb-4">
          <p className="font-semibold mb-2">Cotações Disponíveis</p>
          <div className="space-y-2">
            {quotes.slice(0, 2).map((quote: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{quote.carrier} - {quote.service}</span>
                <span className="font-semibold">R$ {quote.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {!quotes.length && (
          <Button variant="outline" size="sm" disabled>
            Cotar Frete (Mock)
          </Button>
        )}
        {quotes.length > 0 && !label && (
          <Button size="sm" disabled>
            Gerar Etiqueta (Mock)
          </Button>
        )}
        {tracking && (
          <Button variant="outline" size="sm" disabled>
            Rastrear (Mock)
          </Button>
        )}
      </div>
    </Card>
  );
}
