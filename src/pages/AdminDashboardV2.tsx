import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutList, Building, Settings, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRefactoredLeads } from '@/hooks/useRefactoredLeads';
import { RefactoredLead } from '@/types/refactored-lead';
import { assertAdminRole } from '@/utils/roleCheck';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// New components
import { PriorityActionBar } from '@/components/admin/dashboard/PriorityActionBar';
import { SmartFilterBar } from '@/components/admin/dashboard/SmartFilterBar';
import { LeadQueueTable } from '@/components/admin/dashboard/LeadQueueTable';
import { StatsSidebar } from '@/components/admin/dashboard/StatsSidebar';
import { SettingsTab } from '@/components/admin/dashboard/SettingsTab';
import { LenderManagementTab } from '@/components/admin/LenderManagementTab';

// Existing modals
import { LeadDetailSheet } from '@/components/dashboard/LeadDetailSheet';
import { EnhancedStatusUpdateModal } from '@/components/lead-status/EnhancedStatusUpdateModal';
import { DocumentVerificationModal } from '@/components/admin/DocumentVerificationModal';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboardV2 = () => {
  const { signOut, appUser } = useAuth();
  const { toast } = useToast();
  const { leads: allLeads, loading: leadsLoading, refetch: refetchLeads } = useRefactoredLeads();

  // Filter state
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'new' | 'docs' | 'follow-up'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [selectedLead, setSelectedLead] = useState<RefactoredLead | null>(null);
  const [showLeadDetailSheet, setShowLeadDetailSheet] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [showDocVerificationModal, setShowDocVerificationModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentLeadId, setDocumentLeadId] = useState<string | null>(null);

  // Extract unique partners from leads
  const partners = useMemo(() => {
    const partnerMap = new Map<string, { id: string; name: string }>();
    allLeads.forEach((lead) => {
      if (lead.partner) {
        partnerMap.set(lead.partner.id, { id: lead.partner.id, name: lead.partner.name });
      }
    });
    return Array.from(partnerMap.values());
  }, [allLeads]);

  // Filter leads based on all filters
  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead) => {
      // Priority filter
      if (priorityFilter === 'new' && lead.status !== 'new') return false;
      if (priorityFilter === 'docs' && lead.documents_status !== 'uploaded') return false;

      // Status filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;

      // Partner filter
      if (partnerFilter !== 'all' && lead.partner_id !== partnerFilter) return false;

      // Search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesStudent = lead.student?.name?.toLowerCase().includes(searchLower);
        const matchesEmail = lead.student?.email?.toLowerCase().includes(searchLower);
        const matchesCaseId = lead.case_id?.toLowerCase().includes(searchLower);
        if (!matchesStudent && !matchesEmail && !matchesCaseId) return false;
      }

      return true;
    });
  }, [allLeads, priorityFilter, statusFilter, partnerFilter, searchTerm]);

  // Stats for sidebar
  const stats = useMemo(() => {
    return {
      totalLeads: allLeads.length,
      newLeads: allLeads.filter((l) => l.status === 'new').length,
      approvedLeads: allLeads.filter((l) => l.status === 'approved').length,
      totalLoanAmount: allLeads.reduce((sum, l) => sum + l.loan_amount, 0),
    };
  }, [allLeads]);

  // Handlers
  const handleViewLead = (lead: RefactoredLead) => {
    setSelectedLead(lead);
    setShowLeadDetailSheet(true);
  };

  const handleUpdateStatus = (lead: RefactoredLead) => {
    setSelectedLead(lead);
    setShowStatusUpdateModal(true);
  };

  const handleVerifyDocs = async (lead: RefactoredLead) => {
    try {
      const { data: documents } = await supabase
        .from('lead_documents')
        .select('*')
        .eq('lead_id', lead.id)
        .eq('verification_status', 'uploaded')
        .limit(1);

      if (documents && documents.length > 0) {
        setSelectedDocument(documents[0]);
        setDocumentLeadId(lead.id);
        setShowDocVerificationModal(true);
      } else {
        toast({
          title: 'No Documents',
          description: 'No documents pending verification for this lead',
        });
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleStatusUpdated = () => {
    refetchLeads();
    setShowStatusUpdateModal(false);
    setSelectedLead(null);
    toast({ title: 'Status Updated', description: 'Lead status has been updated successfully' });
  };

  const handleRefresh = () => {
    refetchLeads();
    toast({ title: 'Refreshed', description: 'Data has been refreshed' });
  };

  // Loading state
  if (leadsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Access check
  if (!appUser || !assertAdminRole(appUser.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access the admin dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isSuperAdmin = appUser.role === 'super_admin';

  return (
    <AdminErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage leads and partners</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Priority Action Bar */}
        <PriorityActionBar activeFilter={priorityFilter} onFilterChange={setPriorityFilter} />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Main content area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="queue" className="flex-1 flex flex-col">
              <div className="border-b px-4">
                <TabsList className="h-10">
                  <TabsTrigger value="queue" className="gap-1.5">
                    <LayoutList className="h-4 w-4" />
                    Lead Queue
                  </TabsTrigger>
                  <TabsTrigger value="lenders" className="gap-1.5">
                    <Building className="h-4 w-4" />
                    Lenders
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-1.5">
                    <Settings className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="queue" className="flex-1 flex flex-col mt-0 overflow-hidden">
                <SmartFilterBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  partnerFilter={partnerFilter}
                  onPartnerChange={setPartnerFilter}
                  partners={partners}
                />
                <div className="flex-1 overflow-auto">
                  <LeadQueueTable
                    leads={filteredLeads}
                    loading={leadsLoading}
                    onViewLead={handleViewLead}
                    onUpdateStatus={handleUpdateStatus}
                    onVerifyDocs={handleVerifyDocs}
                  />
                </div>
              </TabsContent>

              <TabsContent value="lenders" className="flex-1 overflow-auto p-4">
                <LenderManagementTab />
              </TabsContent>

              <TabsContent value="settings" className="flex-1 overflow-auto p-4">
                <SettingsTab
                  isSuperAdmin={isSuperAdmin}
                  currentUserRole={appUser.role as 'admin' | 'super_admin'}
                  currentUserId={appUser.id}
                />
              </TabsContent>
            </Tabs>
          </main>

          {/* Right: Stats Sidebar */}
          <StatsSidebar stats={stats} />
        </div>

        {/* Modals */}
        {selectedLead && (
          <>
            <LeadDetailSheet
              open={showLeadDetailSheet}
              onOpenChange={setShowLeadDetailSheet}
              lead={selectedLead}
              onLeadUpdated={handleStatusUpdated}
            />
            <EnhancedStatusUpdateModal
              open={showStatusUpdateModal}
              onOpenChange={setShowStatusUpdateModal}
              leadId={selectedLead.id}
              currentStatus={selectedLead.status}
              currentDocumentsStatus={selectedLead.documents_status}
              onStatusUpdated={handleStatusUpdated}
            />
          </>
        )}

        {showDocVerificationModal && selectedDocument && (
          <DocumentVerificationModal
            open={showDocVerificationModal}
            onOpenChange={(open) => {
              setShowDocVerificationModal(open);
              if (!open) {
                setSelectedDocument(null);
                setDocumentLeadId(null);
              }
            }}
            document={selectedDocument}
            onVerificationComplete={() => {
              refetchLeads();
              setShowDocVerificationModal(false);
            }}
          />
        )}
      </div>
    </AdminErrorBoundary>
  );
};

export default AdminDashboardV2;
