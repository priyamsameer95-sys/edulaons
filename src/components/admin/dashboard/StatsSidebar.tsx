import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Users, Calendar, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuickStats } from '@/hooks/useQuickStats';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsSidebarProps {
  onFilterChange?: (filter: { status?: string | null }) => void;
}

export function StatsSidebar({ onFilterChange }: StatsSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { stats, loading } = useQuickStats();

  const formatValue = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const kpis = [
    { 
      id: 'total',
      label: 'Total Leads', 
      value: stats.totalLeads,
      icon: Users,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      filter: null, // Shows all
    },
    { 
      id: 'new',
      label: 'New This Week', 
      value: stats.newThisWeek, 
      icon: Calendar,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      filter: null, // Would need date filter - for now shows all
    },
    { 
      id: 'pipeline',
      label: 'In Pipeline', 
      value: stats.inPipeline,
      subtitle: formatValue(stats.totalPipelineValue),
      icon: Clock,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
      filter: 'in_progress', // Shows in progress leads
    },
    { 
      id: 'disbursed',
      label: 'Disbursed', 
      value: stats.disbursed,
      subtitle: formatValue(stats.disbursedValue),
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
      filter: 'disbursed',
    },
  ];

  const handleCardClick = (filter: string | null) => {
    if (onFilterChange) {
      onFilterChange({ status: filter });
    }
  };

  return (
    <div
      className={cn(
        'border-l border-border bg-card transition-all duration-200 flex flex-col',
        collapsed ? 'w-12' : 'w-64'
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        className="m-2 self-center"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {!collapsed && (
        <div className="p-3 space-y-3 overflow-auto flex-1">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">Quick Stats</h3>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {kpis.map((kpi) => (
                <Card 
                  key={kpi.id} 
                  className={cn(
                    "shadow-none border cursor-pointer transition-colors",
                    "hover:bg-accent/50"
                  )}
                  onClick={() => handleCardClick(kpi.filter)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-md', kpi.color)}>
                        <kpi.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-semibold">{kpi.value}</p>
                        <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                        {kpi.subtitle && (
                          <p className="text-xs text-muted-foreground/70">{kpi.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
