import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRefactoredLeads } from "@/hooks/useRefactoredLeads";
import { LeadDetailSheet } from "@/components/dashboard/LeadDetailSheet";
import { EnhancedStatusUpdateModal } from "@/components/lead-status/EnhancedStatusUpdateModal";
import { DocumentVerificationModal } from "@/components/admin/DocumentVerificationModal";
import { AdminDashboardLayout } from '@/components/admin/dashboard/AdminDashboardLayout';
import { DashboardOverview } from '@/components/admin/dashboard/DashboardOverview';
import { LeadsTab } from "@/components/dashboard/LeadsTab";
import UserManagementTab from "@/components/admin/UserManagementTab";
import { LenderManagementTab } from "@/components/admin/LenderManagementTab";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { supabase } from "@/integrations/supabase/client";
import { RefactoredLead } from "@/types/refactored-lead";

export interface ActiveFilters {
  status?: string[];
  documents_status?: string[];
  loan_amount?: string[];
  study_destination?: string[];
}

interface AdminKPIs {
  totalLeads: number;
  totalPartners: number;
  inPipeline: number;
  sanctioned: number;
  disbursed: number;
  totalLoanAmount: number;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { user, appUser } = useAuth();
  const { leads: allLeads, refetch } = useRefactoredLeads();
  const [selectedLead, setSelectedLead] = useState<RefactoredLead | null>(null);
  const [statusUpdateLead, setStatusUpdateLead] = useState<RefactoredLead | null>(null);
  const [isLeadSheetOpen, setIsLeadSheetOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isDocVerificationModalOpen, setIsDocVerificationModalOpen] = useState(false);
  const [adminKPIs, setAdminKPIs] = useState<AdminKPIs>({
    totalLeads: 0,
    totalPartners: 0,
    inPipeline: 0,
    sanctioned: 0,
    disbursed: 0,
    totalLoanAmount: 0,
  });
  const [isLoadingKPIs, setIsLoadingKPIs] = useState(true);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [isRunningSanityCheck, setIsRunningSanityCheck] = useState(false);

  const fetchAdminKPIs = async () => {
    try {
      setIsLoadingKPIs(true);
      const { count: totalLeads } = await supabase
        .from('leads_new')
        .select('*', { count: 'exact', head: true });

      const { count: totalPartners } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true });

      const { data: leadsByStatus } = await supabase
        .from('leads_new')
        .select('status, loan_amount');

      let inPipeline = 0, sanctioned = 0, disbursed = 0, totalLoanAmount = 0;

      leadsByStatus?.forEach((lead) => {
        totalLoanAmount += Number(lead.loan_amount) || 0;
        
        switch (lead.status) {
          case 'new':
          case 'in_progress':
            inPipeline++;
            break;
          case 'approved':
            sanctioned++;
            break;
        }
      });

      setAdminKPIs({
        totalLeads: totalLeads || 0,
        totalPartners: totalPartners || 0,
        inPipeline,
        sanctioned,
        disbursed,
        totalLoanAmount,
      });
    } catch (error) {
      console.error('Error fetching admin KPIs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoadingKPIs(false);
    }
  };

  useEffect(() => {
    fetchAdminKPIs();
  }, []);

  const handleRunSanityCheck = async () => {
    setIsRunningSanityCheck(true);
    try {
      const { data, error } = await supabase.functions.invoke('data-sanity-check');
      
      if (error) throw error;
      
      const report = data;
      const issueCount = (report?.errors || 0) + (report?.warnings || 0);
      
      toast({
        title: issueCount > 0 ? "Issues Found" : "All Good!",
        description: issueCount > 0 
          ? `Found ${report.errors || 0} errors and ${report.warnings || 0} warnings`
          : "No data integrity issues detected",
        variant: issueCount > 0 ? "destructive" : "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to run sanity check",
        variant: "destructive",
      });
    } finally {
      setIsRunningSanityCheck(false);
    }
  };

  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <AdminDashboardLayout>
      {activeTab === 'overview' && (
        <DashboardOverview 
          allLeads={allLeads}
          adminKPIs={adminKPIs}
          isLoadingKPIs={isLoadingKPIs}
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
          onRunSanityCheck={handleRunSanityCheck}
          isRunningSanityCheck={isRunningSanityCheck}
          onViewLead={(lead) => {
            setSelectedLead(lead);
            setIsLeadSheetOpen(true);
          }}
          onUpdateStatus={(lead) => {
            setStatusUpdateLead(lead);
            setIsStatusModalOpen(true);
          }}
        />
      )}

      {activeTab === 'leads' && <LeadsTab />}

      {activeTab === 'users' && user && appUser && (
        <UserManagementTab 
          currentUserRole={appUser.role as 'admin' | 'super_admin'}
          currentUserId={user.id}
        />
      )}

      {activeTab === 'partners' && <LenderManagementTab />}

      {activeTab === 'audit' && <AuditLogViewer />}

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        open={isLeadSheetOpen}
        onOpenChange={setIsLeadSheetOpen}
      />

      {/* Status Update Modal */}
      {statusUpdateLead && (
        <EnhancedStatusUpdateModal
          open={isStatusModalOpen}
          onOpenChange={setIsStatusModalOpen}
          leadId={statusUpdateLead.id}
          currentStatus={statusUpdateLead.status}
          currentDocumentsStatus={statusUpdateLead.documents_status}
          onStatusUpdated={refetch}
        />
      )}

      {/* Document Verification Modal */}
      <DocumentVerificationModal
        open={isDocVerificationModalOpen}
        onOpenChange={setIsDocVerificationModalOpen}
        document={selectedDocument}
        onVerificationComplete={() => {
          setIsDocVerificationModalOpen(false);
          setSelectedDocument(null);
          refetch();
        }}
      />
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
