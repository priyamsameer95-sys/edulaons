import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { RefactoredLead } from '@/types/refactored-lead';

interface StateData {
  name: string;
  total: number;
  percentage: number;
}

interface GeographicDistributionProps {
  leads: RefactoredLead[];
}

export const GeographicDistribution = ({ leads }: GeographicDistributionProps) => {
  const stateData = useMemo(() => {
    const stateCounts: Record<string, number> = {};
    
    leads.forEach(lead => {
      const state = lead.study_destination || 'Unknown';
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    });

    const total = leads.length;
    const sorted = Object.entries(stateCounts)
      .map(([name, count]) => ({
        name,
        total: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    return sorted;
  }, [leads]);

  const totalLeads = leads.length;
  const uniqueStates = new Set(leads.map(l => l.study_destination)).size;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Leads by Destination
          </CardTitle>
          <Select defaultValue="all">
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="usa">USA</SelectItem>
              <SelectItem value="uk">UK</SelectItem>
              <SelectItem value="canada">Canada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6 h-[140px] bg-muted/30 rounded-lg flex items-center justify-center border border-dashed">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Geographic map</p>
          </div>
        </div>

        <div className="space-y-3">
          {stateData.map((state) => (
            <div key={state.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{state.name}</span>
                <span className="text-sm text-muted-foreground">{state.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={state.percentage} className="h-2 flex-1" />
                <span className="text-xs font-medium w-10 text-right">{state.percentage}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t mt-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Leads</div>
            <div className="text-2xl font-bold">{totalLeads.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Destinations</div>
            <div className="text-2xl font-bold">{uniqueStates}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold">{leads.filter(l => l.status !== 'rejected').length}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
