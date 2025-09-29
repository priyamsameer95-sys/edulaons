import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, Building2, TrendingUp, DollarSign, Target, Timer, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EnhancedKPICardsProps {
  kpis: {
    totalLeads: number;
    totalPartners: number;
    inPipeline: number;
    sanctioned: number;
    disbursed: number;
    totalLoanAmount: number;
  };
}

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

const AnimatedCounter = ({ end, duration = 1000, prefix = '', suffix = '' }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setCount(Math.floor(easeOutQuart * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);

  const formatNumber = (num: number) => {
    if (prefix.includes('₹')) {
      if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
      if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    }
    return num.toLocaleString();
  };

  return (
    <span className="tabular-nums">
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
};

const EnhancedKPICards = ({ kpis }: EnhancedKPICardsProps) => {
  const conversionRate = kpis.totalLeads > 0 ? (kpis.sanctioned / kpis.totalLeads) * 100 : 0;
  const pipelineRate = kpis.totalLeads > 0 ? (kpis.inPipeline / kpis.totalLeads) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Leads Card */}
      <Card className="relative overflow-hidden bg-gradient-primary border-0 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/90">Total Leads</CardTitle>
          <div className="bg-white/20 p-2 rounded-lg">
            <FileText className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold text-white mb-2">
            <AnimatedCounter end={kpis.totalLeads} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/80">Across all partners</p>
            <Badge variant="outline" className="border-white/30 text-white bg-white/10">
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Active Partners Card */}
      <Card className="relative overflow-hidden bg-gradient-card border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
          <div className="bg-primary/10 p-2 rounded-lg">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">
            <AnimatedCounter end={kpis.totalPartners} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Partner organizations</p>
            <Progress value={85} className="h-2" />
            <p className="text-xs text-muted-foreground">85% engagement rate</p>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Card */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pipeline Leads</CardTitle>
          <div className="bg-warning/10 p-2 rounded-lg">
            <Timer className="h-4 w-4 text-warning" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">
            <AnimatedCounter end={kpis.inPipeline} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pipeline rate</span>
              <span className="font-medium">{pipelineRate.toFixed(1)}%</span>
            </div>
            <Progress value={pipelineRate} className="h-2" />
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-xs text-success">+12% this month</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Value Card */}
      <Card className="relative overflow-hidden bg-gradient-accent border-0 text-white">
        <div className="absolute inset-0 bg-black/5" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/90">Total Loan Value</CardTitle>
          <div className="bg-white/20 p-2 rounded-lg">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-2xl font-bold text-white mb-2">
            <AnimatedCounter 
              end={kpis.totalLoanAmount} 
              prefix="₹"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/10 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle className="h-3 w-3" />
                <span className="text-white/80">Sanctioned</span>
              </div>
              <div className="font-bold text-white">{kpis.sanctioned}</div>
            </div>
            <div className="bg-white/10 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <Target className="h-3 w-3" />
                <span className="text-white/80">Conversion</span>
              </div>
              <div className="font-bold text-white">{conversionRate.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedKPICards;