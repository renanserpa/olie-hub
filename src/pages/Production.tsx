import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, AlertTriangle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ProductionStatus = 'pending' | 'cutting' | 'embroidery' | 'sewing' | 'qa' | 'packing' | 'completed';

const COLUMNS: { id: ProductionStatus; label: string; color: string }[] = [
  { id: 'pending', label: 'Fila', color: 'bg-muted' },
  { id: 'cutting', label: 'Corte', color: 'bg-blue-500/10' },
  { id: 'embroidery', label: 'Bordado', color: 'bg-purple-500/10' },
  { id: 'sewing', label: 'Costura', color: 'bg-yellow-500/10' },
  { id: 'qa', label: 'QA', color: 'bg-orange-500/10' },
  { id: 'packing', label: 'Embalagem', color: 'bg-green-500/10' },
  { id: 'completed', label: 'Concluído', color: 'bg-success/10' },
];

export default function Production() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tvMode, setTvMode] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const { data, error } = await supabase
        .from('production_tasks')
        .select(`
          *,
          order_id,
          orders(order_number, contact_id, contacts(name))
        `)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  }

  async function moveTask(taskId: string, newStatus: ProductionStatus) {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'cutting' && !tasks.find(t => t.id === taskId)?.started_at) {
        updates.started_at = new Date().toISOString();
      }
      
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('production_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      
      await loadTasks();
      toast.success('Tarefa movida com sucesso');
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Erro ao mover tarefa');
    }
  }

  function getTasksForColumn(status: ProductionStatus) {
    return tasks.filter(t => t.status === status);
  }

  function isOverdue(task: any) {
    if (!task.due_date) return false;
    return new Date(task.due_date) < new Date();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produção</h1>
          <p className="text-muted-foreground mt-1">Kanban de produção com SLA</p>
        </div>
        <Button
          variant={tvMode ? 'default' : 'outline'}
          onClick={() => setTvMode(!tvMode)}
        >
          Modo TV
        </Button>
      </div>

      <div className={cn(
        'grid gap-4',
        tvMode ? 'grid-cols-7' : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-7'
      )}>
        {COLUMNS.map(column => {
          const columnTasks = getTasksForColumn(column.id);
          
          return (
            <div key={column.id} className="flex flex-col">
              <div className={cn('p-3 rounded-t-lg', column.color)}>
                <h3 className="font-semibold text-sm">{column.label}</h3>
                <p className="text-xs text-muted-foreground">{columnTasks.length} tarefas</p>
              </div>
              
              <div className="flex-1 bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[400px]">
                {columnTasks.map(task => (
                  <Card key={task.id} className="p-3 cursor-pointer hover:shadow-lg transition-smooth">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{task.product_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {task.orders?.orders?.contacts?.name || 'Cliente'}
                          </p>
                        </div>
                        {task.priority > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            P{task.priority}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Qtd: {task.quantity}</span>
                      </div>

                      {isOverdue(task) && (
                        <div className="flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Atrasado</span>
                        </div>
                      )}

                      {task.assigned_to && (
                        <div className="flex items-center gap-1 text-xs">
                          <User className="w-3 h-3" />
                          <span className="truncate">Responsável</span>
                        </div>
                      )}

                      {column.id !== 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full mt-2"
                          onClick={() => {
                            const currentIndex = COLUMNS.findIndex(c => c.id === column.id);
                            if (currentIndex < COLUMNS.length - 1) {
                              moveTask(task.id, COLUMNS[currentIndex + 1].id);
                            }
                          }}
                        >
                          <ChevronRight className="w-4 h-4" />
                          Avançar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
