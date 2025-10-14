import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRefactoredLeads } from "@/hooks/useRefactoredLeads";
import { LeadDetailSheet } from "@/components/dashboard/LeadDetailSheet";
import { EnhancedStatusUpdateModal } from "@/components/lead-status/EnhancedStatusUpdateModal";
import { DocumentVerificationModal } from "@/components/admin/DocumentVerificationModal";
import { useStatusManager } from "@/hooks/useStatusManager";
import { AdminDashboardLayout } from '@/components/admin/dashboard/AdminDashboardLayout';
import { DashboardOverview } from '@/components/admin/dashboard/DashboardOverview';
import { LeadsTab } from "@/components/dashboard/LeadsTab";
import UserManagementTab from "@/components/admin/UserManagementTab";
import { LenderManagementTab } from "@/components/admin/LenderManagementTab";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { AdminDocumentManager } from "@/components/admin/AdminDocumentManager";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { RefactoredLead } from "@/types/refactored-lead";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { leads: allLeads, loading: isLoading, refetch } = useRefactoredLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
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

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <AdminDashboardLayout onSearch={handleSearch}>
      {activeTab === 'overview' && (
        <DashboardOverview 
          allLeads={allLeads}
          adminKPIs={adminKPIs}
          isLoadingKPIs={isLoadingKPIs}
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

      {activeTab !== 'overview' && (
        <div className="p-6 text-center text-muted-foreground">
          This tab is being migrated. Please use the Overview tab for now.
        </div>
      )}

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
