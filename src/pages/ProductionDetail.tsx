import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, User, Package, Shirt, Zap, Palette, Type, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTask();
  }, [id]);

  async function loadTask() {
    try {
      const { data, error } = await supabase
        .from('production_tasks')
        .select(`
          *,
          order_id,
          orders(order_number, contact_id, contacts(name))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setTask(data);
    } catch (error) {
      console.error('Error loading task:', error);
      toast.error('Erro ao carregar tarefa');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  if (!task) {
    return <div className="text-center py-12">Tarefa não encontrada</div>;
  }

  const config = task.config_json || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/production')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{task.product_name}</h1>
          <p className="text-muted-foreground mt-1">
            Detalhes da tarefa de produção
          </p>
        </div>
        <Badge variant="secondary">{task.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Informações Básicas</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Quantidade:</span>
              <span className="font-medium">{task.quantity}</span>
            </div>

            {task.priority > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Prioridade:</span>
                <Badge variant="destructive">P{task.priority}</Badge>
              </div>
            )}

            {task.orders && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Pedido:</div>
                <Button 
                  variant="link" 
                  className="h-auto p-0"
                  onClick={() => navigate(`/orders/${task.order_id}`)}
                >
                  #{task.orders.order_number}
                </Button>
              </div>
            )}

            {task.orders?.contacts && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{task.orders.contacts.name}</span>
              </div>
            )}

            {task.due_date && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Prazo:</span>
                <span className="font-medium">
                  {new Date(task.due_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-4 md:col-span-2">
          <h2 className="font-semibold">Configurações do Produto</h2>
          
          {Object.keys(config).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem configurações personalizadas
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {config.material && (
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Shirt className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Tecido</p>
                    <p className="text-sm text-muted-foreground">{config.material}</p>
                  </div>
                </div>
              )}

              {config.zipper && (
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Zap className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Zíper</p>
                    <p className="text-sm text-muted-foreground">{config.zipper}</p>
                  </div>
                </div>
              )}

              {config.color && (
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div 
                    className="w-5 h-5 rounded border-2 mt-0.5"
                    style={{ backgroundColor: config.color }}
                  />
                  <div>
                    <p className="text-sm font-medium">Cor Personalizada</p>
                    <p className="text-sm text-muted-foreground">{config.color}</p>
                  </div>
                </div>
              )}

              {config.text && (
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Type className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Texto Personalizado</p>
                    <p className="text-sm text-muted-foreground">"{config.text}"</p>
                  </div>
                </div>
              )}

              {config.embroidery && (
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Bordado</p>
                    <p className="text-sm text-muted-foreground">{config.embroidery}</p>
                  </div>
                </div>
              )}

              {config.size && (
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Palette className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Tamanho</p>
                    <p className="text-sm text-muted-foreground">{config.size}</p>
                  </div>
                </div>
              )}

              {/* Outras propriedades genéricas */}
              {Object.entries(config)
                .filter(([key]) => !['material', 'zipper', 'color', 'text', 'embroidery', 'size'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium capitalize">{key}</p>
                      <p className="text-sm text-muted-foreground">{String(value)}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {task.notes && (
        <Card className="p-6">
          <h2 className="font-semibold mb-3">Observações</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {task.notes}
          </p>
        </Card>
      )}
    </div>
  );
}
