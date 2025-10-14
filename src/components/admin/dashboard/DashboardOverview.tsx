import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KPICard } from './KPICard';
import { LeadPipelineChart } from './LeadPipelineChart';
import { EnhancedLeadTable } from './EnhancedLeadTable';
import { SmartFiltersPanel } from './SmartFiltersPanel';
import { GeographicDistribution } from './GeographicDistribution';
import { AlertCircle, Bell, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefactoredLead } from '@/types/refactored-lead';

interface DashboardOverviewProps {
  allLeads: RefactoredLead[];
  adminKPIs: any;
  isLoadingKPIs: boolean;
  onViewLead: (lead: RefactoredLead) => void;
  onUpdateStatus: (lead: RefactoredLead) => void;
}

export const DashboardOverview = ({ 
  allLeads, 
  adminKPIs, 
  isLoadingKPIs,
  onViewLead,
  onUpdateStatus 
}: DashboardOverviewProps) => {
  const totalLeads = allLeads.length;
  const activeLeads = allLeads.filter(l => l.status !== 'rejected' && l.status !== 'approved').length;
  const approvedLeads = allLeads.filter(l => l.status === 'approved').length;
  const conversionRate = totalLeads > 0 ? ((approvedLeads / totalLeads) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Admin</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your loan applications</p>
        </div>
        <Button variant="outline" size="sm">
          <Bell className="h-4 w-4 mr-2" />
          Run Sanity Check
        </Button>
      </div>

      {/* Alert for critical actions */}
      <Alert className="border-destructive bg-destructive/10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Attention Required</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>You have pending actions that need immediate attention</span>
          <Button variant="destructive" size="sm">
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </AlertDescription>
      </Alert>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Leads"
          value={isLoadingKPIs ? "..." : totalLeads.toString()}
          subtitle="All applications"
          progress={75}
        />
        <KPICard
          title="Active Leads"
          value={isLoadingKPIs ? "..." : activeLeads.toString()}
          subtitle="In progress"
          progress={65}
        />
        <KPICard
          title="Approved"
          value={isLoadingKPIs ? "..." : approvedLeads.toString()}
          subtitle="Successfully converted"
          progress={85}
        />
        <KPICard
          title="Conversion Rate"
          value={isLoadingKPIs ? "..." : `${conversionRate}%`}
          subtitle="Approval percentage"
          progress={parseInt(conversionRate)}
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts and Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Pipeline Chart */}
          <div className="lg:col-span-2">
            <LeadPipelineChart leads={allLeads} />
          </div>

          {/* Enhanced Lead Table */}
          <div className="lg:col-span-2">
            <EnhancedLeadTable 
              leads={allLeads}
              onViewLead={onViewLead}
              onUpdateStatus={onUpdateStatus}
            />
          </div>
        </div>

        {/* Right Column - Filters and Distribution */}
        <div className="space-y-6">
          {/* Smart Filters Panel */}
          <SmartFiltersPanel />

          {/* Geographic Distribution */}
          <GeographicDistribution leads={allLeads} />

          {/* Priority Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Requires Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Documents Pending', count: 8, priority: 'high' },
                { label: 'Leads Stuck >7 Days', count: 5, priority: 'medium' },
                { label: 'New Partner Signups', count: 3, priority: 'low' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className={`text-sm font-bold ${
                    item.priority === 'high' ? 'text-destructive' :
                    item.priority === 'medium' ? 'text-warning' :
                    'text-primary'
                  }`}>
                    {item.count}
                  </span>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2">
                View All Issues
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
