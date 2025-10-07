import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Trophy, FileCheck, Clock } from 'lucide-react';
import { RefactoredLead } from '@/types/refactored-lead';
import { AdminKPIs } from '@/hooks/useAdminKPIs';
import { PartnerStats } from '@/utils/adminDashboardHelpers';
import { 
  calculateStatusBreakdown, 
  calculateDocumentStatusCounts,
  getStatusBgClass,
  getDocStatusColor,
  formatCurrency 
} from '@/utils/adminDashboardHelpers';
import { StatusBadge } from '@/components/lead-status/StatusBadge';
import type { LeadStatus } from '@/utils/statusUtils';

interface AdminOverviewChartsProps {
  recentLeads: RefactoredLead[];
  partnerStats: PartnerStats[];
  kpis: AdminKPIs;
  onLeadClick: (lead: RefactoredLead) => void;
}

/**
 * Admin Dashboard Overview Charts Component
 * Displays pipeline breakdown, top performers, document status, and recent activity
 */
export const AdminOverviewCharts = ({ 
  recentLeads, 
  partnerStats, 
  kpis,
  onLeadClick 
}: AdminOverviewChartsProps) => {
  const statusBreakdown = calculateStatusBreakdown(recentLeads, kpis.totalLeads);
  const docCounts = calculateDocumentStatusCounts(recentLeads);

  const docStatuses = [
    { key: 'pending', label: 'Pending', color: 'text-warning' },
    { key: 'verified', label: 'Verified', color: 'text-success' },
    { key: 'rejected', label: 'Rejected', color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      {/* Actionable Insights Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Lead Pipeline Breakdown */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-4 w-4 text-primary" />
              Pipeline Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {statusBreakdown.map(({ status, label, count, percentage }) => (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${getStatusBgClass(status)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Partner Performance Summary */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="h-4 w-4 text-warning" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {partnerStats
                .sort((a, b) => b.totalLeads - a.totalLeads)
                .slice(0, 3)
                .map((partner, index) => (
                  <div key={partner.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? "default" : "secondary"} className="w-5 h-5 flex items-center justify-center p-0 text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium truncate">{partner.name}</span>
                    </div>
                    <span className="text-sm font-bold">{partner.totalLeads}</span>
                  </div>
                ))}
              {partnerStats.length === 0 && (
                <p className="text-xs text-muted-foreground">No partner data</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Document Status Overview */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileCheck className="h-4 w-4 text-accent-foreground" />
              Document Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {docStatuses.map(({ key, label, color }) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}:</span>
                  <span className={`font-semibold ${color}`}>{docCounts[key] || 0}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm border-t border-border/50 pt-2">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold">{recentLeads.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Full Width Table Style */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent-foreground" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest lead submissions across all partners</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {recentLeads.length} active leads
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {recentLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Header */}
              <div className="grid grid-cols-10 gap-4 pb-3 border-b text-xs font-medium text-muted-foreground">
                <div className="col-span-2">Student</div>
                <div className="col-span-2">Partner</div>
                <div className="col-span-1">Destination</div>
                <div className="col-span-1">Lender</div>
                <div className="col-span-2">Loan Amount</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Date</div>
              </div>
              {/* Data Rows */}
              {recentLeads.slice(0, 8).map((lead) => (
                <div 
                  key={lead.id} 
                  className="grid grid-cols-10 gap-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors rounded cursor-pointer group"
                  onClick={() => onLeadClick(lead)}
                >
                  <div className="col-span-2">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{lead.student?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.student?.email}</p>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className="text-xs">
                      {lead.partner?.name}
                    </Badge>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm">{lead.study_destination}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs truncate">{lead.lender?.name || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-sm">
                      {formatCurrency(Number(lead.loan_amount))}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <StatusBadge status={lead.status as LeadStatus} type="lead" className="text-xs" />
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
