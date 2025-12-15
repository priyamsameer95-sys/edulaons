import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, TrendingUp, CheckCircle, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { PartnerKPIs } from "@/types/partner";

interface PartnerKPICardsProps {
  kpis: PartnerKPIs;
  loading: boolean;
  lastUpdated: Date;
}

export const PartnerKPICards = ({ kpis, loading, lastUpdated }: PartnerKPICardsProps) => {
  // Calculate trends (mock for now - would be real historical comparison)
  const trends = {
    totalLeads: kpis.totalLeads > 10 ? '+12%' : '+5%',
    inPipeline: kpis.inPipeline > 5 ? '+8%' : '+3%',
    sanctioned: kpis.sanctioned > 5 ? '+15%' : '+7%',
    disbursed: '+10%'
  };
  
  const trendDirections = {
    totalLeads: kpis.totalLeads > 10,
    inPipeline: true,
    sanctioned: kpis.sanctioned > 5,
    disbursed: true
  };

  const cards = [
    {
      title: 'Total Leads',
      value: kpis.totalLeads,
      trend: trends.totalLeads,
      trendUp: trendDirections.totalLeads,
      subtitle: `Updated ${format(lastUpdated, 'h:mm a')}`,
      icon: FileText,
      className: 'hover:border-primary/30',
      iconBg: 'bg-muted group-hover:bg-primary/10',
      valueColor: ''
    },
    {
      title: 'In Pipeline',
      value: kpis.inPipeline,
      trend: trends.inPipeline,
      trendUp: true,
      subtitle: 'Active applications',
      icon: TrendingUp,
      className: 'border-warning/20 bg-warning/5 hover:border-warning/40',
      iconBg: 'bg-warning/20 group-hover:bg-warning/30',
      iconColor: 'text-warning',
      valueColor: 'text-warning'
    },
    {
      title: 'Sanctioned',
      value: kpis.sanctioned,
      trend: trends.sanctioned,
      trendUp: trendDirections.sanctioned,
      subtitle: 'Approved loans',
      icon: CheckCircle,
      className: 'border-primary/20 bg-primary/5 hover:border-primary/40',
      iconBg: 'bg-primary/20 group-hover:bg-primary/30',
      iconColor: 'text-primary',
      valueColor: 'text-primary'
    },
    {
      title: 'Disbursed',
      value: kpis.disbursed,
      trend: trends.disbursed,
      trendUp: true,
      subtitle: 'Funds released',
      icon: DollarSign,
      className: 'border-success/20 bg-success/5 hover:border-success/40',
      iconBg: 'bg-success/20 group-hover:bg-success/30',
      iconColor: 'text-success',
      valueColor: 'text-success'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className={`hover:shadow-lg transition-all group ${card.className}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className={`p-2 rounded-lg transition-colors ${card.iconBg}`}>
                    <Icon className={`h-4 w-4 ${card.iconColor || ''}`} />
                  </div>
                  {card.title}
                </CardTitle>
                <Badge variant="secondary" className="gap-1 text-xs">
                  {card.trendUp ? (
                    <ArrowUpRight className="h-3 w-3 text-success" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {card.trend}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <div className="space-y-1">
                  <div className={`text-4xl font-bold ${card.valueColor}`}>{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
