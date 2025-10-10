import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  FileText, 
  CreditCard, 
  Truck,
  MoreVertical,
  Eye 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Pedidos
          </h1>
          <p className="text-muted-foreground">
            Gerencie todos os pedidos e integrações com Tiny
          </p>
        </div>
        <Button className="gradient-primary shadow-glow">
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
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Tabs */}
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
          {mockOrdersData.map((order) => (
            <Card key={order.id} className="p-6 shadow-card hover:shadow-elegant transition-smooth">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-foreground">
                      Pedido #{order.id}
                    </h3>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.statusLabel}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                      <p className="font-medium text-foreground">{order.customer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Produto</p>
                      <p className="font-medium text-foreground">{order.product}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Valor</p>
                      <p className="font-medium text-foreground">{order.value}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Data</p>
                      <p className="font-medium text-foreground">{order.date}</p>
                    </div>
                  </div>

                  {/* Integration Status */}
                  <div className="flex items-center gap-6 pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <CreditCard className={`w-4 h-4 ${order.payment ? 'text-success' : 'text-muted-foreground'}`} />
                      <span className="text-sm">
                        {order.payment ? 'Pagamento OK' : 'Aguardando'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className={`w-4 h-4 ${order.nfe ? 'text-success' : 'text-muted-foreground'}`} />
                      <span className="text-sm">
                        {order.nfe ? `NFe ${order.nfe}` : 'Sem NFe'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className={`w-4 h-4 ${order.tracking ? 'text-success' : 'text-muted-foreground'}`} />
                      <span className="text-sm">
                        {order.tracking ? `Rastreio: ${order.tracking}` : 'Sem envio'}
                      </span>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
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
    </div>
  );
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'paid':
      return 'default';
    case 'production':
      return 'secondary';
    case 'shipping':
      return 'outline';
    default:
      return 'outline';
  }
};

const mockOrdersData = [
  {
    id: '1234',
    customer: 'Ana Silva',
    product: 'Necessaire Cannes',
    value: 'R$ 289,90',
    date: '10/10/2025',
    status: 'paid',
    statusLabel: 'Pago',
    payment: true,
    nfe: '00123',
    tracking: 'BR123456789',
  },
  {
    id: '1235',
    customer: 'Mariana Costa',
    product: 'Kit Lourdes Completa',
    value: 'R$ 456,80',
    date: '10/10/2025',
    status: 'production',
    statusLabel: 'Em Produção',
    payment: true,
    nfe: '00124',
    tracking: null,
  },
  {
    id: '1236',
    customer: 'Júlia Rodrigues',
    product: 'Embalagem Impermeável',
    value: 'R$ 198,50',
    date: '09/10/2025',
    status: 'paid',
    statusLabel: 'Pago',
    payment: true,
    nfe: null,
    tracking: null,
  },
  {
    id: '1237',
    customer: 'Beatriz Lima',
    product: 'Bolsa Petit',
    value: 'R$ 378,00',
    date: '09/10/2025',
    status: 'pending',
    statusLabel: 'Aguardando Pagamento',
    payment: false,
    nfe: null,
    tracking: null,
  },
];
