import { KPICard } from './KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, Users, DollarSign, FileCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const DashboardOverview = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your education loans today.
          </p>
        </div>
        <Button size="lg" className="gap-2">
          <FileCheck className="h-4 w-4" />
          Run Sanity Check
        </Button>
      </div>

      {/* Critical Actions Alert */}
      <Alert className="border-destructive/50 bg-destructive/5">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <AlertDescription className="flex items-center justify-between">
          <span className="font-medium">
            <span className="text-destructive">11 actions</span> require your immediate attention
          </span>
          <Button variant="destructive" size="sm">
            View All
          </Button>
        </AlertDescription>
      </Alert>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Leads"
          value="1,247"
          subtitle="Active applications"
          trend={{
            value: 15,
            direction: 'up',
            label: 'vs last week',
          }}
          progress={75}
        />
        
        <KPICard
          title="Total Items"
          value="1,256"
          subtitle="Documents pending"
          trend={{
            value: -29,
            direction: 'down',
            label: 'trades',
          }}
          progress={62}
        />
        
        <KPICard
          title="Average Sales"
          value="₹7.54M"
          subtitle="Monthly revenue"
          trend={{
            value: 2.8,
            direction: 'up',
            label: 'Since last week',
          }}
          progress={85}
        />
        
        <KPICard
          title="Conversion Rate"
          value="42.3%"
          subtitle="Lead to approval"
          trend={{
            value: -2.1,
            direction: 'down',
            label: 'vs last month',
          }}
          progress={42}
        />
      </div>

      {/* Action Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Requires Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { icon: FileCheck, label: 'Documents Pending Verification', count: 5, color: 'text-destructive' },
                { icon: TrendingUp, label: 'Leads Stuck >7 Days', count: 3, color: 'text-warning' },
                { icon: Users, label: 'New Student First Logins', count: 2, color: 'text-primary' },
                { icon: DollarSign, label: 'Data Sanity Issues', count: 1, color: 'text-muted-foreground' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${item.color}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${item.color}`}>
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Issues
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '2m ago', action: 'Document uploaded', user: 'Raj Kumar' },
                { time: '5m ago', action: 'Lead status changed', user: 'Admin' },
                { time: '8m ago', action: 'New student registered', user: 'Priya Shah' },
                { time: '12m ago', action: 'Partner submitted application', user: 'ABC Consultancy' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Activities
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
