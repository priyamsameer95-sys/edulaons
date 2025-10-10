import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'accent' | 'destructive';
  className?: string;
}

const colorClasses = {
  primary: {
    icon: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-l-primary',
    value: 'text-primary',
  },
  success: {
    icon: 'text-success',
    bg: 'bg-success/10',
    border: 'border-l-success',
    value: 'text-success',
  },
  warning: {
    icon: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-l-warning',
    value: 'text-warning',
  },
  accent: {
    icon: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-l-accent',
    value: 'text-accent',
  },
  destructive: {
    icon: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-l-destructive',
    value: 'text-destructive',
  },
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
  className,
}: KPICardProps) {
  const colors = colorClasses[color];

  return (
    <Card className={cn('hover-lift border-l-4', colors.border, className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <div className={cn('p-2 rounded-lg', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.icon)} />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('text-3xl font-bold', colors.value)}>{value}</div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          {trend && trendValue && (
            <span
              className={cn(
                'text-xs font-semibold',
                trend === 'up' && 'text-success',
                trend === 'down' && 'text-destructive',
                trend === 'neutral' && 'text-muted-foreground'
              )}
            >
              {trend === 'up' && '↑ '}
              {trend === 'down' && '↓ '}
              {trendValue}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
