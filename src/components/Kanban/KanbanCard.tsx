import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

interface KanbanCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function KanbanCard({
  id,
  children,
  className,
  onClick,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "hover:shadow-lg transition-smooth",
        isDragging && "opacity-50 shadow-2xl",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted/50 rounded-l transition-colors"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <div
          onClick={onClick}
          className={cn("flex-1 pr-2", onClick && "cursor-pointer")}
        >
          {children}
        </div>
      </div>
    </Card>
  );
}
