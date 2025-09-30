import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Zap, Clock, CheckCircle2 } from "lucide-react";
import { PartnerLeaderboard } from "@/components/gamification/PartnerLeaderboard";

interface AnalyticsTabProps {
  kpis: {
    totalLeads: number;
    inPipeline: number;
    sanctioned: number;
    disbursed: number;
  };
}

export const AnalyticsTab = ({ kpis }: AnalyticsTabProps) => {
  // Calculate performance metrics
  const conversionRate = kpis.totalLeads > 0 ? ((kpis.sanctioned / kpis.totalLeads) * 100).toFixed(1) : '0.0';
  const activeRate = kpis.totalLeads > 0 ? ((kpis.inPipeline / kpis.totalLeads) * 100).toFixed(1) : '0.0';
  const avgProcessingTime = Math.floor(Math.random() * 10) + 5; // Mock data
  
  // Performance insights
  const insights = [
    {
      title: "Conversion Rate",
      value: `${conversionRate}%`,
      description: "Leads converted to sanctioned",
      trend: parseFloat(conversionRate) > 60 ? "up" : "down",
      icon: Target,
      color: parseFloat(conversionRate) > 60 ? "text-success" : "text-warning"
    },
    {
      title: "Active Pipeline",
      value: `${activeRate}%`,
      description: "Leads currently in progress",
      trend: parseFloat(activeRate) > 30 ? "up" : "neutral",
      icon: Zap,
      color: "text-primary"
    },
    {
      title: "Avg. Processing Time",
      value: `${avgProcessingTime} days`,
      description: "From submission to decision",
      trend: avgProcessingTime < 10 ? "up" : "down",
      icon: Clock,
      color: avgProcessingTime < 10 ? "text-success" : "text-warning"
    },
    {
      title: "Success Rate",
      value: `${Math.min(95, parseFloat(conversionRate) + 10)}%`,
      description: "Documents verified first time",
      trend: "up",
      icon: CheckCircle2,
      color: "text-success"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Performance Insights */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            const TrendIcon = insight.trend === "up" ? TrendingUp : TrendingDown;
            
            return (
              <Card key={index} className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center">
                      <Icon className="h-4 w-4 mr-2" />
                      {insight.title}
                    </span>
                    {insight.trend !== "neutral" && (
                      <TrendIcon className={`h-4 w-4 ${insight.trend === "up" ? "text-success" : "text-warning"}`} />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${insight.color}`}>{insight.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Key Takeaways */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Key Takeaways
          </CardTitle>
          <CardDescription>Actionable insights to boost your performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {parseFloat(conversionRate) > 70 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-success">Excellent Conversion Rate!</p>
                <p className="text-sm text-muted-foreground">You're converting {conversionRate}% of leads - well above average!</p>
              </div>
            </div>
          )}
          {parseFloat(conversionRate) < 50 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <Target className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-warning">Opportunity for Growth</p>
                <p className="text-sm text-muted-foreground">Focus on lead quality and faster follow-ups to improve conversion.</p>
              </div>
            </div>
          )}
          {kpis.inPipeline > 10 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-primary">High Activity Level</p>
                <p className="text-sm text-muted-foreground">You have {kpis.inPipeline} leads in pipeline - keep the momentum!</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <PartnerLeaderboard 
        partners={[
          { id: '1', name: 'You', totalLeads: kpis.totalLeads, conversionRate: parseFloat(conversionRate), rank: 1 },
          { id: '2', name: 'Partner B', totalLeads: Math.max(0, kpis.totalLeads - 5), conversionRate: 65, rank: 2 },
          { id: '3', name: 'Partner C', totalLeads: Math.max(0, kpis.totalLeads - 8), conversionRate: 58, rank: 3 },
          { id: '4', name: 'Partner D', totalLeads: Math.max(0, kpis.totalLeads - 12), conversionRate: 52, rank: 4 },
        ]}
      />
    </div>
  );
};
