import React from "react";
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
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface KanbanColumn {
  id: string;
  label: string;
  color: string;
  description?: string;
}

export interface KanbanItem {
  id: string;
  status: string;
  [key: string]: any;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  items: KanbanItem[];
  onStatusChange: (itemId: string, newStatus: string) => Promise<void>;
  renderCard: (item: KanbanItem) => React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function KanbanBoard({
  columns,
  items,
  onStatusChange,
  renderCard,
  loading,
  className,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

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

  function getItemsForColumn(columnId: string) {
    return items.filter((item) => item.status === columnId);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    setIsDragging(true);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveId(null);
    setIsDragging(false);

    if (!over) return;

    const itemId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn) {
      const item = items.find((i) => i.id === itemId);
      if (item && item.status !== targetColumn.id) {
        await onStatusChange(itemId, targetColumn.id);
      }
    }
  }

  const activeItem = activeId
    ? items.find((item) => item.id === activeId)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex gap-4 overflow-x-auto pb-4", className)}>
        {columns.map((column) => {
          const columnItems = getItemsForColumn(column.id);
          const totalValue = columnItems.reduce(
            (sum, item) => sum + (Number(item.total) || 0),
            0,
          );

          return (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col">
              {/* Column Header */}
              <div className={cn("rounded-t-lg p-3", column.color)}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm">{column.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {columnItems.length}
                  </Badge>
                </div>
                {totalValue > 0 && (
                  <p className="text-xs text-muted-foreground">
                    R$ {totalValue.toFixed(2)}
                  </p>
                )}
                {column.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {column.description}
                  </p>
                )}
              </div>

              {/* Column Content - Droppable */}
              <SortableContext
                id={column.id}
                items={columnItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className={cn(
                    "flex-1 bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[500px] transition-colors",
                    isDragging && "ring-2 ring-primary/20",
                  )}
                  data-column-id={column.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add("ring-2", "ring-primary");
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove("ring-2", "ring-primary");
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("ring-2", "ring-primary");
                  }}
                >
                  {columnItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <p className="text-sm">Nenhum item</p>
                      <p className="text-xs mt-1">Arraste itens para cá</p>
                    </div>
                  ) : (
                    columnItems.map((item) => (
                      <div key={item.id}>{renderCard(item)}</div>
                    ))
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="rotate-3 scale-105 opacity-90">
            {renderCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
