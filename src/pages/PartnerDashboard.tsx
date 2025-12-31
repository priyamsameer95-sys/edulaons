import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, AlertCircle, Building2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { isPlaceholderEmail } from "@/utils/formatters";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerKPIs } from "@/hooks/usePartnerKPIs";
import { useRefactoredLeads } from "@/hooks/useRefactoredLeads";
import { CompactStatsBar } from "@/components/partner/CompactStatsBar";
import { QuickActionsBar } from "@/components/partner/QuickActionsBar";
import { PartnerLeadsTable } from "@/components/partner/PartnerLeadsTable";
import { AddNewLeadModal } from "@/components/partner/AddNewLeadModal";
import { EligibilityCheckModal } from "@/components/partner/EligibilityCheckModal";
import { CompleteLeadModal } from "@/components/partner/CompleteLeadModal";
import { PartnerLeadDetailSheet } from "@/components/partner/PartnerLeadDetailSheet";
import { PartnerNotificationBell } from "@/components/partner/PartnerNotificationBell";
import { Partner } from "@/types/partner";
import { RefactoredLead, mapDbRefactoredLeadToLead } from "@/types/refactored-lead";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Status mappings for 18-step process filtering
const IN_PIPELINE_STATUSES = ['contacted', 'in_progress', 'document_review', 'logged_with_lender', 'counselling_done', 'pd_scheduled', 'pd_completed', 'additional_docs_pending', 'property_verification', 'credit_assessment'];
const SANCTIONED_STATUSES = ['approved', 'sanctioned', 'pf_pending', 'pf_paid', 'sanction_letter_issued'];
interface PartnerDashboardProps {
  partner?: Partner;
}
const PartnerDashboard = ({
  partner
}: PartnerDashboardProps) => {
  const navigate = useNavigate();
  const {
    partnerCode
  } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    signOut,
    isAdmin
  } = useAuth();

  // CRITICAL: On partner dashboard, ALWAYS filter by partner_id - never show global KPIs
  // This ensures partners only see their own data, even when an admin views the partner dashboard
  const {
    kpis,
    loading: kpisLoading,
    refetch: refetchKPIs
  } = usePartnerKPIs(partner?.id, false);
  const {
    leads,
    loading: leadsLoading,
    error: leadsError,
    refetch: refetchLeads
  } = useRefactoredLeads(partner?.id);

  // Handle openLead query param to auto-open lead detail sheet
  useEffect(() => {
    const openLeadId = searchParams.get('openLead');
    if (openLeadId && leads.length > 0 && !leadsLoading) {
      const leadToOpen = leads.find(l => l.id === openLeadId);
      if (leadToOpen) {
        setSelectedLead(leadToOpen);
        setLeadDetailInitialTab("overview");
        setShowLeadDetail(true);
        // Clear the query param after opening
        searchParams.delete('openLead');
        setSearchParams(searchParams, {
          replace: true
        });
      }
    }
  }, [searchParams, leads, leadsLoading, setSearchParams]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showNewLead, setShowNewLead] = useState(false);
  const [showEligibilityCheck, setShowEligibilityCheck] = useState(false);
  const [showCompleteLeadModal, setShowCompleteLeadModal] = useState(false);

  // Lead detail sheet state
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [selectedLead, setSelectedLead] = useState<RefactoredLead | null>(null);
  const [leadDetailInitialTab, setLeadDetailInitialTab] = useState("overview");

  // Debounce search for performance
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter leads based on status and search
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Status filter from compact stats bar (updated for 18-step process)
      if (statusFilter) {
        if (statusFilter === 'in_pipeline') {
          if (!IN_PIPELINE_STATUSES.includes(lead.status)) {
            return false;
          }
        } else if (statusFilter === 'sanctioned') {
          if (!SANCTIONED_STATUSES.includes(lead.status)) {
            return false;
          }
        } else if (statusFilter === 'disbursed') {
          if (lead.status !== 'disbursed') {
            return false;
          }
        }
      }

      // Search filter (exclude placeholder emails from search)
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const studentEmail = lead.student?.email || '';
        const emailMatch = !isPlaceholderEmail(studentEmail) && studentEmail.toLowerCase().includes(query);
        const matchesSearch = (lead.student?.name || '').toLowerCase().includes(query) || emailMatch || (lead.student?.phone || '').toLowerCase().includes(query) || lead.case_id.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [leads, statusFilter, debouncedSearch]);
  const handleNewLead = () => {
    setShowNewLead(true);
  };
  const handleEligibilityCheck = () => {
    setShowEligibilityCheck(true);
  };
  const handleLeadSuccess = () => {
    refetchLeads();
    refetchKPIs();
  };
  const handleEligibilityContinue = async (leadId: string): Promise<void> => {
    // Fetch the newly created lead and open CompleteLeadModal
    // Use explicit FK hints to avoid ambiguous relationship error
    const {
      data: lead,
      error
    } = await supabase.from('leads_new').select(`
        *,
        students!leads_new_student_id_fkey(*),
        co_applicants!leads_new_co_applicant_id_fkey(*),
        lenders!leads_new_lender_id_fkey(*),
        partners!leads_new_partner_id_fkey(*)
      `).eq('id', leadId).single();
    if (error) {
      console.error('Error fetching lead for complete modal:', error);
      toast.error('Failed to load lead details');
      return;
    }
    if (lead) {
      const mappedLead = mapDbRefactoredLeadToLead(lead as any);
      setSelectedLead(mappedLead);
      // Close eligibility modal AFTER we have the lead data ready
      setShowEligibilityCheck(false);
      // Small delay to let the eligibility modal close before opening complete modal
      setTimeout(() => {
        setShowCompleteLeadModal(true);
      }, 100);
    }
    refetchLeads();
    refetchKPIs();
  };
  const handleCompleteLead = (lead: RefactoredLead) => {
    // Open CompleteLeadModal for incomplete quick leads
    setSelectedLead(lead);
    setShowCompleteLeadModal(true);
  };
  const handleUploadDocs = (lead?: RefactoredLead) => {
    if (lead) {
      setSelectedLead(lead);
      setLeadDetailInitialTab("documents");
      setShowLeadDetail(true);
    }
  };
  const handleUploadDocsById = async (leadId: string): Promise<void> => {
    // Fetch the lead and open document upload view
    const {
      data: lead,
      error
    } = await supabase.from('leads_new').select(`
        *,
        students!leads_new_student_id_fkey(*),
        co_applicants!leads_new_co_applicant_id_fkey(*),
        lenders!leads_new_lender_id_fkey(*),
        partners!leads_new_partner_id_fkey(*)
      `).eq('id', leadId).single();
    if (error) {
      console.error('Error fetching lead for documents:', error);
      toast.error('Failed to load lead');
      return;
    }
    if (lead) {
      const mappedLead = mapDbRefactoredLeadToLead(lead as any);
      setSelectedLead(mappedLead);
      setLeadDetailInitialTab("documents");
      setShowLeadDetail(true);
    }
  };
  const handleViewLead = (lead: RefactoredLead) => {
    setSelectedLead(lead);
    setLeadDetailInitialTab("overview");
    setShowLeadDetail(true);
  };
  const handleLeadUpdated = () => {
    refetchLeads();
    refetchKPIs();
  };
  return <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-semibold leading-tight">
                {partner?.name || 'Partner Dashboard'}
              </h1>
              {partner?.partner_code && <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-medium text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                    {partner.partner_code}
                  </span>
                </div>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin() && <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                Admin
              </Button>}
            <PartnerNotificationBell partnerId={partner?.id} />
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground gap-2">
              <LogOut className="h-4 w-4" />
               Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Error Alert */}
        {leadsError && <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load leads: {leadsError}
            </AlertDescription>
          </Alert>}

        {/* Compact Stats Bar - clickable filters */}
        <CompactStatsBar kpis={kpis} loading={kpisLoading} activeFilter={statusFilter} onFilterClick={setStatusFilter} />

        {/* Quick Actions Bar */}
        <QuickActionsBar onNewLead={handleNewLead} onEligibilityCheck={handleEligibilityCheck} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* Leads Table */}
        <PartnerLeadsTable leads={filteredLeads} loading={leadsLoading} searchQuery={debouncedSearch} onUploadDocs={handleUploadDocs} onCompleteLead={handleCompleteLead} onNewLead={handleNewLead} onViewLead={handleViewLead} />
      </main>

      {/* Add New Lead Modal */}
      <AddNewLeadModal open={showNewLead} onClose={() => setShowNewLead(false)} onSuccess={handleLeadSuccess} onContinueApplication={handleEligibilityContinue} onUploadDocuments={handleUploadDocsById} partnerId={partner?.id} />

      {/* Eligibility Check Modal */}
      <EligibilityCheckModal open={showEligibilityCheck} onClose={() => setShowEligibilityCheck(false)} onSuccess={handleLeadSuccess} onContinueApplication={handleEligibilityContinue} onUploadDocuments={handleUploadDocsById} partnerId={partner?.id} />

      {/* Complete Lead Modal - for finishing quick leads */}
      <CompleteLeadModal open={showCompleteLeadModal} onClose={() => {
      setShowCompleteLeadModal(false);
      setSelectedLead(null);
    }} lead={selectedLead} onSuccess={() => {
      handleLeadSuccess();
      setShowCompleteLeadModal(false);
      setSelectedLead(null);
    }} />

      {/* Partner Lead Detail Sheet */}
      <PartnerLeadDetailSheet lead={selectedLead} open={showLeadDetail} onOpenChange={open => {
      setShowLeadDetail(open);
      if (!open) setSelectedLead(null);
    }} onLeadUpdated={handleLeadUpdated} initialTab={leadDetailInitialTab} />
    </div>;
};
export default PartnerDashboard;