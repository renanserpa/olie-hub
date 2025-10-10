import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function KanbanCard({ id, children, className }: KanbanCardProps) {
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
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing',
        'hover:shadow-lg transition-shadow',
        isDragging && 'opacity-50 shadow-2xl',
        className
      )}
    >
      {children}
    </Card>
  );
}
