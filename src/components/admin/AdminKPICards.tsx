import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Building2, DollarSign, TrendingUp } from 'lucide-react';
import { AdminKPIs, LoanAmountComparison } from '@/hooks/useAdminKPIs';
import { formatCurrency } from '@/utils/adminDashboardHelpers';

interface AdminKPICardsProps {
  kpis: AdminKPIs;
  loanComparison: LoanAmountComparison;
}

/**
 * Admin Dashboard KPI Cards Component
 * Displays strategic KPI metrics in a grid layout
 */
export const AdminKPICards = ({ kpis, loanComparison }: AdminKPICardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Leads */}
      <Card className="hover:shadow-lg transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Total Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.totalLeads}</div>
          <p className="text-xs text-muted-foreground mt-1">All partners</p>
        </CardContent>
      </Card>

      {/* Active Partners */}
      <Card className="hover:shadow-lg transition-all border-success/20 bg-success/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Building2 className="h-4 w-4 text-success" />
            Active Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{kpis.totalPartners}</div>
          <p className="text-xs text-muted-foreground mt-1">Contributing</p>
        </CardContent>
      </Card>

      {/* Pipeline Value */}
      <Card className="hover:shadow-lg transition-all border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-primary" />
            Pipeline Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-primary">{formatCurrency(loanComparison.pipeline)}</div>
          <p className="text-xs text-muted-foreground mt-1">{kpis.inPipeline} leads</p>
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card className="hover:shadow-lg transition-all border-accent/20 bg-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-accent-foreground" />
            Conversion Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent-foreground">{loanComparison.conversionRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">{kpis.sanctioned} approved</p>
        </CardContent>
      </Card>
    </div>
  );
};
