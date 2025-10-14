import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KPICard } from './KPICard';
import { LeadPipelineChart } from './LeadPipelineChart';
import { EnhancedLeadTable } from './EnhancedLeadTable';
import { SmartFiltersPanel } from './SmartFiltersPanel';
import { GeographicDistribution } from './GeographicDistribution';
import { AlertCircle, Bell, ChevronRight, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefactoredLead } from '@/types/refactored-lead';
import { ActiveFilters } from '@/pages/AdminDashboard';
import { useMemo } from 'react';

interface DashboardOverviewProps {
  allLeads: RefactoredLead[];
  adminKPIs: any;
  isLoadingKPIs: boolean;
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  onRunSanityCheck: () => void;
  isRunningSanityCheck: boolean;
  onViewLead: (lead: RefactoredLead) => void;
  onUpdateStatus: (lead: RefactoredLead) => void;
}

export const DashboardOverview = ({ 
  allLeads, 
  adminKPIs, 
  isLoadingKPIs,
  activeFilters,
  onFiltersChange,
  onRunSanityCheck,
  isRunningSanityCheck,
  onViewLead,
  onUpdateStatus 
}: DashboardOverviewProps) => {
  const totalLeads = allLeads.length;
  const activeLeads = allLeads.filter(l => l.status !== 'rejected' && l.status !== 'approved').length;
  const approvedLeads = allLeads.filter(l => l.status === 'approved').length;
  const conversionRate = totalLeads > 0 ? ((approvedLeads / totalLeads) * 100).toFixed(1) : '0';

  // Calculate priority actions from real data
  const priorityActions = useMemo(() => {
    const documentsPending = allLeads.filter(l => 
      l.documents_status === 'pending' || l.documents_status === 'resubmission_required'
    ).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const leadsStuck = allLeads.filter(l => {
      if (l.status !== 'new' && l.status !== 'in_progress') return false;
      const statusDate = new Date(l.updated_at);
      return statusDate < sevenDaysAgo;
    }).length;

    return { documentsPending, leadsStuck };
  }, [allLeads]);

  const hasCriticalIssues = priorityActions.documentsPending > 5 || priorityActions.leadsStuck > 3;
  const hasAnyIssues = priorityActions.documentsPending > 0 || priorityActions.leadsStuck > 0;

  const handlePriorityAction = (action: 'documents' | 'stuck') => {
    if (action === 'documents') {
      onFiltersChange({
        documents_status: ['pending', 'resubmission_required']
      });
    } else if (action === 'stuck') {
      onFiltersChange({
        status: ['new', 'in_progress']
      });
    }
    // Scroll to table
    setTimeout(() => {
      document.getElementById('leads-table')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Admin</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your loan applications</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRunSanityCheck}
          disabled={isRunningSanityCheck}
        >
          {isRunningSanityCheck ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Bell className="h-4 w-4 mr-2" />
          )}
          {isRunningSanityCheck ? 'Running...' : 'Run Sanity Check'}
        </Button>
      </div>

      {/* Alert for critical actions - only show if critical issues exist */}
      {hasCriticalIssues && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Attention Required</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>You have {priorityActions.documentsPending} pending documents and {priorityActions.leadsStuck} stuck leads</span>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => handlePriorityAction('documents')}
            >
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Leads"
          value={isLoadingKPIs ? "..." : totalLeads.toString()}
          subtitle="All applications"
          progress={totalLeads > 0 ? Math.min((totalLeads / 100) * 100, 100) : 0}
        />
        <KPICard
          title="Active Leads"
          value={isLoadingKPIs ? "..." : activeLeads.toString()}
          subtitle="In progress"
          progress={totalLeads > 0 ? (activeLeads / totalLeads) * 100 : 0}
        />
        <KPICard
          title="Approved"
          value={isLoadingKPIs ? "..." : approvedLeads.toString()}
          subtitle="Successfully converted"
          progress={parseFloat(conversionRate)}
        />
        <KPICard
          title="Conversion Rate"
          value={isLoadingKPIs ? "..." : `${conversionRate}%`}
          subtitle="Approval percentage"
          progress={parseFloat(conversionRate)}
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
          <div className="lg:col-span-2" id="leads-table">
            <EnhancedLeadTable 
              leads={allLeads}
              globalFilters={activeFilters}
              onViewLead={onViewLead}
              onUpdateStatus={onUpdateStatus}
            />
          </div>
        </div>

        {/* Right Column - Filters and Distribution */}
        <div className="space-y-6">
          {/* Smart Filters Panel */}
          <SmartFiltersPanel 
            leads={allLeads}
            activeFilters={activeFilters}
            onFiltersChange={onFiltersChange}
          />

          {/* Geographic Distribution */}
          <GeographicDistribution leads={allLeads} />

          {/* Priority Actions Card - only show if there are issues */}
          {hasAnyIssues && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Requires Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {priorityActions.documentsPending > 0 && (
                  <div 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handlePriorityAction('documents')}
                  >
                    <span className="text-sm font-medium">Documents Pending</span>
                    <span className="text-sm font-bold text-destructive">
                      {priorityActions.documentsPending}
                    </span>
                  </div>
                )}
                {priorityActions.leadsStuck > 0 && (
                  <div 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handlePriorityAction('stuck')}
                  >
                    <span className="text-sm font-medium">Leads Stuck &gt;7 Days</span>
                    <span className="text-sm font-bold text-warning">
                      {priorityActions.leadsStuck}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
