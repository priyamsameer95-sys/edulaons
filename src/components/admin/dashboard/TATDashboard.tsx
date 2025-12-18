import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { STATUS_CONFIG, ProcessPhase } from '@/constants/processFlow';
import { differenceInDays, differenceInHours } from 'date-fns';

interface StageMetric {
  status: string;
  label: string;
  count: number;
  avgDays: number;
  breachCount: number;
  targetDays: number;
}

// Target TAT in days for each status
const TARGET_TAT: Record<string, number> = {
  lead_intake: 1,
  first_contact: 1,
  lenders_mapped: 2,
  checklist_shared: 1,
  docs_uploading: 3,
  docs_submitted: 1,
  docs_verified: 2,
  logged_with_lender: 1,
  counselling_done: 3,
  pd_scheduled: 5,
  pd_completed: 3,
  additional_docs_pending: 3,
  property_verification: 5,
  credit_assessment: 5,
  sanctioned: 7,
  pf_pending: 3,
  pf_paid: 2,
  disbursed: 5,
};

export function TATDashboard() {
  const [metrics, setMetrics] = useState<StageMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch all active leads with their stage start times
        const { data: leads } = await supabase
          .from('leads_new')
          .select('id, status, current_stage_started_at, created_at')
          .not('status', 'in', '(withdrawn,rejected,disbursed)');

        if (!leads) {
          setLoading(false);
          return;
        }

        // Group by status and calculate metrics
        const statusGroups: Record<string, { count: number; totalDays: number; breachCount: number }> = {};

        leads.forEach(lead => {
          const status = lead.status;
          const startDate = lead.current_stage_started_at 
            ? new Date(lead.current_stage_started_at) 
            : new Date(lead.created_at);
          const daysInStage = differenceInDays(new Date(), startDate);
          const targetDays = TARGET_TAT[status] || 3;

          if (!statusGroups[status]) {
            statusGroups[status] = { count: 0, totalDays: 0, breachCount: 0 };
          }

          statusGroups[status].count++;
          statusGroups[status].totalDays += daysInStage;
          if (daysInStage > targetDays) {
            statusGroups[status].breachCount++;
          }
        });

        // Convert to array with labels
        const metricsArray: StageMetric[] = Object.entries(statusGroups)
          .map(([status, data]) => {
            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
            return {
              status,
              label: config?.label || status,
              count: data.count,
              avgDays: data.count > 0 ? Math.round(data.totalDays / data.count * 10) / 10 : 0,
              breachCount: data.breachCount,
              targetDays: TARGET_TAT[status] || 3,
            };
          })
          .filter(m => m.count > 0)
          .sort((a, b) => b.breachCount - a.breachCount);

        setMetrics(metricsArray);
      } catch (error) {
        console.error('Error fetching TAT metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            TAT Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const totalBreaches = metrics.reduce((sum, m) => sum + m.breachCount, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            TAT Dashboard
          </CardTitle>
          {totalBreaches > 0 && (
            <Badge variant="destructive" className="text-xs">
              {totalBreaches} breach{totalBreaches > 1 ? 'es' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.length === 0 ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            No active leads
          </div>
        ) : (
          metrics.slice(0, 6).map((metric) => (
            <div key={metric.status} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate max-w-[140px]" title={metric.label}>
                  {metric.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {metric.count} leads
                  </span>
                  {metric.breachCount > 0 && (
                    <span className="text-destructive flex items-center gap-0.5">
                      <AlertTriangle className="h-3 w-3" />
                      {metric.breachCount}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={Math.min((metric.avgDays / metric.targetDays) * 100, 100)} 
                  className={`h-1.5 ${metric.avgDays > metric.targetDays ? '[&>div]:bg-destructive' : ''}`}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {metric.avgDays}d / {metric.targetDays}d
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
