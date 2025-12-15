import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerKPIs } from "@/hooks/usePartnerKPIs";
import { useRefactoredLeads } from "@/hooks/useRefactoredLeads";
import { CompactStatsBar } from "@/components/partner/CompactStatsBar";
import { QuickActionsBar } from "@/components/partner/QuickActionsBar";
import { PartnerLeadsTable } from "@/components/partner/PartnerLeadsTable";
import { Partner } from "@/types/partner";
import { RefactoredLead } from "@/types/refactored-lead";

interface PartnerDashboardProps {
  partner?: Partner;
}

const PartnerDashboard = ({ partner }: PartnerDashboardProps) => {
  const navigate = useNavigate();
  const { partnerCode } = useParams();
  const { signOut, isAdmin } = useAuth();
  const { kpis, loading: kpisLoading } = usePartnerKPIs(partner?.id, isAdmin());
  const { leads, loading: leadsLoading } = useRefactoredLeads();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate pending docs count
  const pendingDocsCount = useMemo(() => {
    return leads.filter(
      (lead) => lead.documents_status === 'pending' || lead.documents_status === 'resubmission_required'
    ).length;
  }, [leads]);

  // Filter leads based on status and search
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Status filter from compact stats bar
      if (statusFilter) {
        // Map filter keys to actual status values
        const statusMap: Record<string, string[]> = {
          in_progress: ['in_progress', 'contacted', 'document_review'],
          approved: ['approved'],
          disbursed: ['disbursed'],
        };
        const allowedStatuses = statusMap[statusFilter] || [];
        if (!allowedStatuses.includes(lead.status)) {
          return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (lead.student?.name || '').toLowerCase().includes(query) ||
          (lead.student?.phone || '').toLowerCase().includes(query) ||
          lead.case_id.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [leads, statusFilter, searchQuery]);

  const handleNewLead = () => {
    navigate(`/partner/${partnerCode}/new-lead`);
  };

  const handleUploadDocs = (lead?: RefactoredLead) => {
    // Navigate to lead detail or open upload modal
    if (lead) {
      // For now, could open a modal or navigate
      console.log("Upload docs for lead:", lead.case_id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">
              {partner?.name || 'Partner Dashboard'}
            </h1>
            {partner?.partner_code && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {partner.partner_code}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
              >
                Admin
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Compact Stats Bar - clickable filters */}
        <CompactStatsBar
          kpis={kpis}
          loading={kpisLoading}
          activeFilter={statusFilter}
          onFilterClick={setStatusFilter}
        />

        {/* Quick Actions Bar */}
        <QuickActionsBar
          onNewLead={handleNewLead}
          onUploadDocs={() => handleUploadDocs()}
          pendingDocsCount={pendingDocsCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Leads Table */}
        <PartnerLeadsTable
          leads={filteredLeads}
          loading={leadsLoading}
          onUploadDocs={handleUploadDocs}
          onNewLead={handleNewLead}
        />
      </main>
    </div>
  );
};

export default PartnerDashboard;
