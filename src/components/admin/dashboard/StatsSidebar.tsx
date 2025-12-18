import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, TrendingUp, Users, FileCheck, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TATDashboard } from './TATDashboard';
import { DropOffIntelligence } from './DropOffIntelligence';

interface StatsSidebarProps {
  stats: {
    totalLeads: number;
    newLeads: number;
    approvedLeads: number;
    totalLoanAmount: number;
  };
}

export function StatsSidebar({ stats }: StatsSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const kpis = [
    { 
      label: 'Total Leads', 
      value: stats.totalLeads, 
      icon: Users,
      color: 'text-blue-600'
    },
    { 
      label: 'New Today', 
      value: stats.newLeads, 
      icon: TrendingUp,
      color: 'text-green-600'
    },
    { 
      label: 'Approved', 
      value: stats.approvedLeads, 
      icon: FileCheck,
      color: 'text-emerald-600'
    },
    { 
      label: 'Total Value', 
      value: `₹${(stats.totalLoanAmount / 10000000).toFixed(1)}Cr`, 
      icon: DollarSign,
      color: 'text-amber-600'
    },
  ];

  return (
    <div
      className={cn(
        'border-l border-border bg-card transition-all duration-200 flex flex-col',
        collapsed ? 'w-12' : 'w-72'
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
        <div className="p-3 space-y-4 overflow-auto flex-1">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">Quick Stats</h3>
          
          <div className="grid grid-cols-2 gap-2">
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="shadow-none border">
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-1.5 rounded-md bg-muted', kpi.color)}>
                      <kpi.icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* TAT Dashboard */}
          <TATDashboard />
          
          {/* Drop-off Intelligence */}
          <DropOffIntelligence />
        </div>
      )}
    </div>
  );
}
