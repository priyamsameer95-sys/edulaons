import { AlertTriangle, Clock, FileX, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RiskLead {
  id: string;
  caseId: string;
  studentName: string;
  daysIdle: number;
  loanAmount: number;
  riskLevel: 'high' | 'medium' | 'low';
  reason: string;
}

interface AtRiskLeadsProps {
  leads: RiskLead[];
  onTakeAction: (leadId: string) => void;
}

const riskColors = {
  high: 'text-destructive',
  medium: 'text-warning',
  low: 'text-muted-foreground',
};

const riskBgColors = {
  high: 'bg-destructive/10 border-destructive/20',
  medium: 'bg-warning/10 border-warning/20',
  low: 'bg-muted/10 border-muted/20',
};

export const AtRiskLeads = ({ leads, onTakeAction }: AtRiskLeadsProps) => {
  const totalAtRisk = leads.reduce((sum, lead) => sum + lead.loanAmount, 0);
  const highRiskCount = leads.filter(l => l.riskLevel === 'high').length;

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
            At-Risk Leads
          </CardTitle>
          <Badge variant="destructive" className="animate-pulse">
            {leads.length} Urgent
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Risk Summary */}
        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm text-muted-foreground">Potential Loss</p>
              <p className="text-2xl font-bold text-destructive">
                ₹{(totalAtRisk / 10000000).toFixed(2)}Cr
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">High Risk</p>
              <p className="text-2xl font-bold text-destructive">{highRiskCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingDown className="h-3 w-3" />
            <span>Act now to prevent pipeline loss</span>
          </div>
        </div>

        {/* At-Risk Lead Items */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className={`p-3 rounded-lg border ${riskBgColors[lead.riskLevel]} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{lead.studentName}</span>
                    <Badge variant="outline" className="text-xs">
                      {lead.caseId}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    <span>{lead.daysIdle} days no update</span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">{lead.reason}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold">
                    ₹{(lead.loanAmount / 100000).toFixed(1)}L
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-xs mt-1 ${riskColors[lead.riskLevel]}`}
                  >
                    {lead.riskLevel.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2 hover:bg-primary hover:text-primary-foreground"
                onClick={() => onTakeAction(lead.id)}
              >
                Take Action Now
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
