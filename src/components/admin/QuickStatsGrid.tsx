import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Trophy, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStatsGridProps {
  pipelineBreakdown: {
    status: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  topPartners: {
    id: string;
    name: string;
    totalLeads: number;
  }[];
  documentStats: {
    pending: number;
    verified: number;
    rejected: number;
    total: number;
  };
}

export function QuickStatsGrid({
  pipelineBreakdown,
  topPartners,
  documentStats,
}: QuickStatsGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Pipeline Breakdown */}
      <Card className="hover:shadow-md transition-shadow border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <BarChart3 className="h-5 w-5 text-primary" />
            Pipeline Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {pipelineBreakdown.map(({ status, count, percentage, color }) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-foreground">{status}</span>
                  <span className="font-bold">
                    {count} <span className="text-muted-foreground">({percentage}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all', color)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card className="hover:shadow-md transition-shadow border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Trophy className="h-5 w-5 text-warning" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {topPartners.map((partner, index) => (
              <div
                key={partner.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={index === 0 ? 'default' : 'secondary'}
                    className={cn(
                      'w-7 h-7 flex items-center justify-center p-0 text-sm font-bold',
                      index === 0 && 'bg-warning text-warning-foreground'
                    )}
                  >
                    {index + 1}
                  </Badge>
                  <span className="font-semibold text-sm">{partner.name}</span>
                </div>
                <span className="text-base font-bold">{partner.totalLeads}</span>
              </div>
            ))}
            {topPartners.length === 0 && (
              <p className="text-sm text-muted-foreground">No partner data</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Status */}
      <Card className="hover:shadow-md transition-shadow border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <FileCheck className="h-5 w-5 text-accent" />
            Document Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-warning">Pending:</span>
              <span className="font-bold text-warning text-base">{documentStats.pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-success">Verified:</span>
              <span className="font-bold text-success text-base">{documentStats.verified}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-destructive">Rejected:</span>
              <span className="font-bold text-destructive text-base">{documentStats.rejected}</span>
            </div>
            <div className="flex justify-between text-sm border-t-2 border-border pt-2">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-base">{documentStats.total}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
