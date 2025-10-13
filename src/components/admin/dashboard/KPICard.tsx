import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  progress?: number; // 0-100
  className?: string;
}

export const KPICard = ({
  title,
  value,
  subtitle,
  trend,
  progress = 75,
  className,
}: KPICardProps) => {
  // Chart data for circular progress
  const chartData = [
    { name: 'completed', value: progress },
    { name: 'remaining', value: 100 - progress },
  ];

  const COLORS = {
    completed: 'hsl(var(--primary))',
    remaining: 'hsl(var(--muted))',
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return <ArrowUpRight className="h-3 w-3" />;
      case 'down':
        return <ArrowDownRight className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up':
        return 'text-success bg-success-light';
      case 'down':
        return 'text-destructive bg-destructive-light';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <Card className={cn('hover-lift', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-foreground mb-1">
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
            )}
            {trend && (
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                  getTrendColor()
                )}
              >
                {getTrendIcon()}
                <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>

          {/* Circular Progress Chart */}
          <div className="w-20 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={36}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name as keyof typeof COLORS]}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
