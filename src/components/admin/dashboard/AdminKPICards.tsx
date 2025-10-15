import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCompactCurrency } from '@/utils/formatters';
import type { AdminKPIs } from '@/hooks/useAdminKPIs';
import type { LoanAmountComparison } from '@/hooks/useLoanMetrics';

interface AdminKPICardsProps {
  kpis: AdminKPIs;
  loanMetrics: LoanAmountComparison;
}

export const AdminKPICards = ({ kpis, loanMetrics }: AdminKPICardsProps) => {
  const cards = [
    {
      title: 'Total Leads',
      value: kpis.totalLeads.toString(),
      icon: Users,
      trend: '+12%',
      color: 'text-blue-600'
    },
    {
      title: 'Total Partners',
      value: kpis.totalPartners.toString(),
      icon: Building2,
      trend: '+8%',
      color: 'text-green-600'
    },
    {
      title: 'In Pipeline',
      value: kpis.inPipeline.toString(),
      icon: TrendingUp,
      trend: '+5%',
      color: 'text-orange-600'
    },
    {
      title: 'Total Loan Amount',
      value: formatCompactCurrency(kpis.totalLoanAmount),
      icon: DollarSign,
      trend: '+15%',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {cards.map((card, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={cn("h-4 w-4", card.color)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.trend} from last month</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
