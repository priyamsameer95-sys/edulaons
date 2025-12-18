import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingDown, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getReasonCodeLabel, isDropOffReason } from '@/constants/reasonCodes';
import { subDays, startOfDay } from 'date-fns';

interface DropOffMetric {
  reasonCode: string;
  label: string;
  count: number;
  percentage: number;
}

type DateRange = '7' | '30' | '90';

export function DropOffIntelligence() {
  const [metrics, setMetrics] = useState<DropOffMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [totalDropOffs, setTotalDropOffs] = useState(0);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));

        // Fetch status history with reason codes
        const { data: history } = await supabase
          .from('lead_status_history')
          .select('reason_code, change_reason, new_status, created_at')
          .gte('created_at', startDate.toISOString())
          .not('reason_code', 'is', null);

        if (!history || history.length === 0) {
          setMetrics([]);
          setTotalDropOffs(0);
          setLoading(false);
          return;
        }

        // Count by reason code, focusing on drop-offs
        const reasonCounts: Record<string, number> = {};
        let dropOffTotal = 0;

        history.forEach(record => {
          const code = record.reason_code;
          if (code && isDropOffReason(code)) {
            reasonCounts[code] = (reasonCounts[code] || 0) + 1;
            dropOffTotal++;
          }
        });

        // Convert to sorted array
        const metricsArray: DropOffMetric[] = Object.entries(reasonCounts)
          .map(([code, count]) => ({
            reasonCode: code,
            label: getReasonCodeLabel(code),
            count,
            percentage: dropOffTotal > 0 ? Math.round((count / dropOffTotal) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count);

        setMetrics(metricsArray);
        setTotalDropOffs(dropOffTotal);
      } catch (error) {
        console.error('Error fetching drop-off metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Drop-off Reasons
          </CardTitle>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="h-7 w-[90px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : metrics.length === 0 ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            No drop-off data yet
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground">
              {totalDropOffs} total drop-offs
            </div>
            {metrics.slice(0, 5).map((metric, index) => (
              <div key={metric.reasonCode} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-4">
                    {index + 1}.
                  </span>
                  <span className="text-sm truncate max-w-[150px]" title={metric.label}>
                    {metric.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {metric.count}
                  </Badge>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {metric.percentage}%
                  </span>
                </div>
              </div>
            ))}
            {metrics.length > 5 && (
              <div className="text-xs text-muted-foreground">
                +{metrics.length - 5} more reasons
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
