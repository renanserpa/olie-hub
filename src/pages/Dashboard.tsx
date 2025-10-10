import { MetricCard } from '@/components/Dashboard/MetricCard';
import { 
  ShoppingCart, 
  Factory, 
  Truck, 
  DollarSign,
  TrendingUp,
  Package,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    todayOrders: 0,
    inProduction: 0,
    pendingShipping: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    lowStockCount: 0,
    completionRate: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [todayRes, productionRes, shippingRes, monthRes, stockRes, recentRes] = await Promise.all([
        supabase.from('orders').select('total').gte('created_at', today.toISOString()),
        supabase.from('orders').select('id').eq('status', 'in_production'),
        supabase.from('orders').select('id').eq('status', 'awaiting_shipping'),
        supabase.from('orders').select('total').gte('created_at', startOfMonth.toISOString()),
        supabase.from('products').select('id, stock_quantity, min_stock_quantity'),
        supabase.from('orders').select('*, contacts(name), items').order('created_at', { ascending: false }).limit(4)
      ]);

      const lowStock = (stockRes.data || []).filter(p => 
        p.stock_quantity < (p.min_stock_quantity || 5)
      );

      setMetrics({
        todayOrders: todayRes.data?.length || 0,
        inProduction: productionRes.data?.length || 0,
        pendingShipping: shippingRes.data?.length || 0,
        todayRevenue: (todayRes.data || []).reduce((sum, o) => sum + Number(o.total || 0), 0),
        monthRevenue: (monthRes.data || []).reduce((sum, o) => sum + Number(o.total || 0), 0),
        lowStockCount: lowStock.length,
        completionRate: 94,
      });

      setRecentOrders(recentRes.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Visão geral das operações do Ateliê Olie
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Pedidos Hoje"
          value="24"
          change="+12% vs. ontem"
          changeType="positive"
          icon={ShoppingCart}
          iconBg="bg-primary/10"
        />
        <MetricCard
          title="Em Produção"
          value="18"
          change="3 com atraso"
          changeType="negative"
          icon={Factory}
          iconBg="bg-warning/10"
        />
        <MetricCard
          title="Aguardando Envio"
          value="7"
          change="2 etiquetas pendentes"
          changeType="neutral"
          icon={Truck}
          iconBg="bg-accent/10"
        />
        <MetricCard
          title="Faturamento Hoje"
          value="R$ 8.450"
          change="+23% vs. ontem"
          changeType="positive"
          icon={DollarSign}
          iconBg="bg-success/10"
        />
      </div>

      {/* Recent Orders */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Pedidos Recentes</h2>
          <Badge variant="secondary" className="font-medium">
            24 novos hoje
          </Badge>
        </div>
        
        <div className="space-y-4">
          {mockOrders.map((order) => (
            <div 
              key={order.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  order.status === 'paid' ? 'bg-success/10' :
                  order.status === 'production' ? 'bg-warning/10' :
                  'bg-muted'
                }`}>
                  {order.status === 'paid' ? <CheckCircle className="w-5 h-5 text-success" /> :
                   order.status === 'production' ? <Factory className="w-5 h-5 text-warning" /> :
                   <Clock className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Pedido #{order.id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer} • {order.product}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {order.value}
                </p>
                <Badge 
                  variant={
                    order.status === 'paid' ? 'default' :
                    order.status === 'production' ? 'secondary' :
                    'outline'
                  }
                  className="mt-1"
                >
                  {order.statusLabel}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground">Vendas do Mês</h3>
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">R$ 124.580</p>
          <p className="text-sm text-success font-medium">+18% vs. mês anterior</p>
        </Card>

        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Itens em Estoque</h3>
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">342</p>
          <p className="text-sm text-warning font-medium">8 produtos com estoque baixo</p>
        </Card>

        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-semibold text-foreground">Taxa de Conclusão</h3>
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">94%</p>
          <p className="text-sm text-muted-foreground">Pedidos concluídos no prazo</p>
        </Card>
      </div>
    </div>
  );
}

const mockOrders = [
  {
    id: '1234',
    customer: 'Ana Silva',
    product: 'Necessaire Cannes',
    value: 'R$ 289,90',
    status: 'paid',
    statusLabel: 'Pago',
  },
  {
    id: '1235',
    customer: 'Mariana Costa',
    product: 'Kit Lourdes',
    value: 'R$ 456,80',
    status: 'production',
    statusLabel: 'Produção',
  },
  {
    id: '1236',
    customer: 'Júlia Rodrigues',
    product: 'Embalagem Impermeável',
    value: 'R$ 198,50',
    status: 'paid',
    statusLabel: 'Pago',
  },
  {
    id: '1237',
    customer: 'Beatriz Lima',
    product: 'Bolsa Petit',
    value: 'R$ 378,00',
    status: 'pending',
    statusLabel: 'Aguardando',
  },
];
