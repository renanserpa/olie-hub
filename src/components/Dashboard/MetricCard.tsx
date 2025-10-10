import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconBg?: string;
}

export const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  iconBg = 'bg-primary/10'
}: MetricCardProps) => {
  return (
    <Card className="p-6 shadow-card hover:shadow-elegant transition-smooth">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground mb-2">
            {value}
          </p>
          {change && (
            <p className={cn(
              'text-sm font-medium',
              changeType === 'positive' && 'text-success',
              changeType === 'negative' && 'text-destructive',
              changeType === 'neutral' && 'text-muted-foreground'
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center',
          iconBg
        )}>
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </Card>
  );
};
