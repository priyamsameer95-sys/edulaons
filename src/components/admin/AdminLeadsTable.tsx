import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Filter } from 'lucide-react';
import { RefactoredLead } from '@/types/refactored-lead';
import { StatusBadge } from '@/components/lead-status/StatusBadge';
import { EnhancedAdminLeadActions } from '@/components/admin/EnhancedAdminLeadActions';
import { formatCurrency } from '@/utils/adminDashboardHelpers';
import type { LeadStatus } from '@/utils/statusUtils';

interface AdminLeadsTableProps {
  filteredLeads: RefactoredLead[];
  selectedLeads: string[];
  onSelectLead: (leadId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onViewLead: (lead: RefactoredLead) => void;
  onQuickStatusUpdate: (lead: RefactoredLead) => void;
  onShowBulkUpdate: () => void;
}

/**
 * Admin Leads Table Component
 * Displays lead list with selection, actions, and bulk operations
 */
export const AdminLeadsTable = ({
  filteredLeads,
  selectedLeads,
  onSelectLead,
  onSelectAll,
  onViewLead,
  onQuickStatusUpdate,
  onShowBulkUpdate,
}: AdminLeadsTableProps) => {
  const allSelected = filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lead Management
            </CardTitle>
            <CardDescription>
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} found
              {selectedLeads.length > 0 && ` · ${selectedLeads.length} selected`}
            </CardDescription>
          </div>
          {selectedLeads.length > 0 && (
            <Button
              onClick={onShowBulkUpdate}
              variant="default"
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Bulk Update ({selectedLeads.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredLeads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No leads found</p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Table Header */}
            <div className="flex items-center gap-4 pb-3 border-b text-xs font-medium text-muted-foreground">
              <div className="w-8">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all leads"
                />
              </div>
              <div className="flex-1 grid grid-cols-12 gap-4">
                <div className="col-span-2">Student</div>
                <div className="col-span-2">Partner</div>
                <div className="col-span-2">Destination</div>
                <div className="col-span-2">Loan Amount</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Docs</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>

            {/* Table Rows */}
            {filteredLeads.map((lead) => (
              <div 
                key={lead.id} 
                className="flex items-center gap-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="w-8">
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={(checked) => onSelectLead(lead.id, checked as boolean)}
                    aria-label={`Select lead ${lead.case_id}`}
                  />
                </div>
                <div 
                  className="flex-1 grid grid-cols-12 gap-4 cursor-pointer"
                  onClick={() => onViewLead(lead)}
                >
                  <div className="col-span-2">
                    <p className="font-medium text-sm truncate hover:text-primary transition-colors">
                      {lead.student?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.student?.email}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className="text-xs">
                      {lead.partner?.name}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm">{lead.study_destination}</p>
                    <p className="text-xs text-muted-foreground">{lead.loan_type}</p>
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
                    <StatusBadge status={lead.documents_status} type="document" className="text-xs" />
                  </div>
                  <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                    <EnhancedAdminLeadActions
                      lead={lead}
                      onViewDetails={() => onViewLead(lead)}
                      onStatusUpdate={() => onQuickStatusUpdate(lead)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
