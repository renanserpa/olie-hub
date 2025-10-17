import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  User,
  AlertTriangle,
  Package,
  Shirt,
  Zap,
  Type,
  Sparkles,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ViewModeSelector } from "@/components/ViewMode/ViewModeSelector";
import {
  PropertySelector,
  PropertyDefinition,
} from "@/components/ViewMode/PropertySelector";
import { TVModeLayout } from "@/components/ViewMode/TVModeLayout";
import { MetricCard } from "@/components/ViewMode/MetricCard";
import { getViewPreference, saveViewPreference } from "@/lib/viewPreferences";
import { GripVertical } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ProductionStatus =
  | "pending"
  | "cutting"
  | "embroidery"
  | "sewing"
  | "qa"
  | "packing"
  | "completed";
type ViewMode = "kanban" | "list" | "table";

const COLUMNS: { id: ProductionStatus; label: string; color: string }[] = [
  { id: "pending", label: "Fila", color: "bg-muted" },
  { id: "cutting", label: "Corte", color: "bg-blue-500/10" },
  { id: "embroidery", label: "Bordado", color: "bg-purple-500/10" },
  { id: "sewing", label: "Costura", color: "bg-yellow-500/10" },
  { id: "qa", label: "QA", color: "bg-orange-500/10" },
  { id: "packing", label: "Embalagem", color: "bg-green-500/10" },
  { id: "completed", label: "Concluído", color: "bg-success/10" },
];

const PRODUCTION_PROPERTIES: PropertyDefinition[] = [
  { id: "product_name", label: "Produto", type: "text", defaultVisible: true },
  { id: "customer", label: "Cliente", type: "text", defaultVisible: true },
  { id: "quantity", label: "Quantidade", type: "number", defaultVisible: true },
  { id: "priority", label: "Prioridade", type: "badge", defaultVisible: true },
  { id: "due_date", label: "Prazo", type: "date", defaultVisible: true },
  { id: "config", label: "Configuração", type: "text", defaultVisible: true },
  {
    id: "assigned_to",
    label: "Responsável",
    type: "text",
    defaultVisible: false,
  },
  { id: "started_at", label: "Início", type: "date", defaultVisible: false },
  { id: "notes", label: "Observações", type: "text", defaultVisible: false },
];

function TaskCard({
  task,
  isOverdue,
  onClick,
}: {
  task: any;
  isOverdue: boolean;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = task.config_json || {};

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "hover:shadow-lg transition-smooth",
        isDragging && "opacity-50 shadow-2xl",
      )}
    >
      <div className="flex items-start gap-2">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted/50 rounded-l transition-colors"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <div onClick={onClick} className="flex-1 pr-3 py-2 cursor-pointer">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {task.product_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {task.orders?.contacts?.name || "Cliente"}
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

            {isOverdue && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="w-3 h-3" />
                <span>Atrasado</span>
              </div>
            )}

            {/* NOVO: Configurações do produto */}
            {Object.keys(config).length > 0 && (
              <div className="text-xs bg-muted/50 rounded p-2 space-y-1">
                {config.material && (
                  <div className="flex items-center gap-1">
                    <Shirt className="w-3 h-3" />
                    <span>Tecido: {config.material}</span>
                  </div>
                )}
                {config.zipper && (
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>Zíper: {config.zipper}</span>
                  </div>
                )}
                {config.color && (
                  <div className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: config.color }}
                    />
                    <span>Cor personalizada</span>
                  </div>
                )}
                {config.text && (
                  <div className="flex items-center gap-1">
                    <Type className="w-3 h-3" />
                    <span>"{config.text}"</span>
                  </div>
                )}
                {config.embroidery && (
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Bordado: {config.embroidery}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Production() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tvMode, setTvMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    task?: any;
    newStatus?: string;
  }>({ open: false });

  const prefs = getViewPreference("production");
  const [viewMode, setViewMode] = useState<ViewMode>(prefs.mode || "kanban");
  const [visibleProperties, setVisibleProperties] = useState<string[]>(
    prefs.properties ||
      PRODUCTION_PROPERTIES.filter((p) => p.defaultVisible).map((p) => p.id),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    saveViewPreference("production", {
      mode: viewMode,
      properties: visibleProperties,
    });
  }, [viewMode, visibleProperties]);

  async function loadTasks() {
    try {
      const { data, error } = await supabase
        .from("production_tasks")
        .select(
          `
          *,
          order_id,
          orders(order_number, contact_id, contacts(name))
        `,
        )
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Erro ao carregar tarefas");
    } finally {
      setLoading(false);
    }
  }

  function shouldConfirmBackwardMove(
    currentStatus: string,
    newStatus: string,
  ): boolean {
    const currentIndex = COLUMNS.findIndex((col) => col.id === currentStatus);
    const newIndex = COLUMNS.findIndex((col) => col.id === newStatus);
    return newIndex < currentIndex;
  }

  async function moveTask(taskId: string, newStatus: ProductionStatus) {
    try {
      const updates: any = { status: newStatus };

      if (
        newStatus === "cutting" &&
        !tasks.find((t) => t.id === taskId)?.started_at
      ) {
        updates.started_at = new Date().toISOString();
      }

      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("production_tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) throw error;

      await loadTasks();
      toast.success("Tarefa movida com sucesso");
    } catch (error) {
      console.error("Error moving task:", error);
      toast.error("Erro ao mover tarefa");
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const targetColumn = COLUMNS.find((col) => col.id === overId);
    if (targetColumn) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== targetColumn.id) {
        // Check if it's a backward move
        if (shouldConfirmBackwardMove(task.status, targetColumn.id)) {
          setConfirmDialog({
            open: true,
            task,
            newStatus: targetColumn.id,
          });
        } else {
          await moveTask(taskId, targetColumn.id);
        }
      }
    }
  }

  function getTasksForColumn(status: ProductionStatus) {
    return tasks.filter((t) => t.status === status);
  }

  function isOverdue(task: any) {
    if (!task.due_date) return false;
    return new Date(task.due_date) < new Date();
  }

  const overdueCount = tasks.filter(isOverdue).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">Carregando...</div>
    );
  }

  if (tvMode) {
    return (
      <TVModeLayout
        title="Produção"
        onExit={() => setTvMode(false)}
        dashboard={
          <div className="space-y-4">
            <MetricCard
              title="Total em Produção"
              value={tasks.length}
              icon={Package}
              trend={`${tasks.filter((t) => new Date(t.created_at).toDateString() === new Date().toDateString()).length} novos hoje`}
            />
            {COLUMNS.map((col) => (
              <MetricCard
                key={col.id}
                title={col.label}
                value={getTasksForColumn(col.id).length}
                color={col.color}
              />
            ))}
            {overdueCount > 0 && (
              <MetricCard
                title="Atrasadas"
                value={overdueCount}
                icon={AlertTriangle}
                color="bg-destructive/10"
              />
            )}
          </div>
        }
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((column) => {
              const columnTasks = getTasksForColumn(column.id);

              return (
                <div
                  key={column.id}
                  className="flex flex-col flex-shrink-0 w-80"
                >
                  <div className={cn("p-3 rounded-t-lg", column.color)}>
                    <h3 className="font-semibold text-sm">{column.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {columnTasks.length} tarefas
                    </p>
                  </div>

                  <SortableContext
                    id={column.id}
                    items={columnTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex-1 bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[400px]">
                      {columnTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                          <p className="text-sm">Nenhuma tarefa</p>
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            isOverdue={isOverdue(task)}
                            onClick={() => navigate(`/production/${task.id}`)}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="rotate-3 scale-105 opacity-90">
                <TaskCard
                  task={tasks.find((t) => t.id === activeId)!}
                  isOverdue={isOverdue(tasks.find((t) => t.id === activeId)!)}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </TVModeLayout>
    );
  }

  return (
    <div className="space-y-6">
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover para etapa anterior?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja mover "{confirmDialog.task?.product_name}"
              de "
              {COLUMNS.find((c) => c.id === confirmDialog.task?.status)?.label}"
              para "
              {COLUMNS.find((c) => c.id === confirmDialog.newStatus)?.label}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.task && confirmDialog.newStatus) {
                  moveTask(
                    confirmDialog.task.id,
                    confirmDialog.newStatus as ProductionStatus,
                  );
                }
                setConfirmDialog({ open: false });
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produção</h1>
          <p className="text-muted-foreground mt-1">
            Kanban de produção com SLA
          </p>
        </div>
        <div className="flex gap-2">
          <PropertySelector
            availableProperties={PRODUCTION_PROPERTIES}
            selectedProperties={visibleProperties}
            onChange={setVisibleProperties}
          />
          <ViewModeSelector
            value={viewMode}
            onChange={(mode) => setViewMode(mode as ViewMode)}
            availableModes={["kanban", "list", "table"]}
          />
          <Button variant="outline" onClick={() => setTvMode(true)}>
            <Maximize2 className="w-4 h-4 mr-2" />
            Modo TV
          </Button>
        </div>
      </div>

      {viewMode === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((column) => {
              const columnTasks = getTasksForColumn(column.id);

              return (
                <div
                  key={column.id}
                  className="flex flex-col flex-shrink-0 w-80"
                >
                  <div className={cn("p-3 rounded-t-lg", column.color)}>
                    <h3 className="font-semibold text-sm">{column.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {columnTasks.length} tarefas
                    </p>
                  </div>

                  <SortableContext
                    id={column.id}
                    items={columnTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex-1 bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[400px]">
                      {columnTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                          <p className="text-sm">Nenhuma tarefa</p>
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            isOverdue={isOverdue(task)}
                            onClick={() => navigate(`/production/${task.id}`)}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="rotate-3 scale-105 opacity-90">
                <TaskCard
                  task={tasks.find((t) => t.id === activeId)!}
                  isOverdue={isOverdue(tasks.find((t) => t.id === activeId)!)}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {viewMode === "list" && (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="p-4 hover:shadow-md cursor-pointer transition-smooth"
              onClick={() => navigate(`/production/${task.id}`)}
            >
              <div className="flex items-center gap-4">
                {visibleProperties.includes("product_name") && (
                  <div className="flex-1">
                    <p className="font-medium">{task.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.orders?.contacts?.name}
                    </p>
                  </div>
                )}
                {visibleProperties.includes("quantity") && (
                  <div className="w-20 text-center">
                    <Badge variant="secondary">{task.quantity}</Badge>
                  </div>
                )}
                {visibleProperties.includes("priority") &&
                  task.priority > 0 && (
                    <Badge variant="destructive">P{task.priority}</Badge>
                  )}
                <Badge>
                  {COLUMNS.find((c) => c.id === task.status)?.label}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewMode === "table" && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {visibleProperties.map((propId) => {
                  const prop = PRODUCTION_PROPERTIES.find(
                    (p) => p.id === propId,
                  );
                  return <TableHead key={propId}>{prop?.label}</TableHead>;
                })}
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/production/${task.id}`)}
                >
                  {visibleProperties.includes("product_name") && (
                    <TableCell className="font-medium">
                      {task.product_name}
                    </TableCell>
                  )}
                  {visibleProperties.includes("customer") && (
                    <TableCell>{task.orders?.contacts?.name || "-"}</TableCell>
                  )}
                  {visibleProperties.includes("quantity") && (
                    <TableCell>{task.quantity}</TableCell>
                  )}
                  {visibleProperties.includes("priority") && (
                    <TableCell>
                      {task.priority > 0 ? (
                        <Badge variant="destructive">P{task.priority}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  )}
                  {visibleProperties.includes("due_date") && (
                    <TableCell>
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                  )}
                  {visibleProperties.includes("config") && (
                    <TableCell className="text-xs">
                      {task.config_json
                        ? Object.keys(task.config_json).length + " configs"
                        : "-"}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge>
                      {COLUMNS.find((c) => c.id === task.status)?.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
