import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, PieChart, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import CreatePartnerModal from '@/components/admin/CreatePartnerModal';
import { BulkStatusUpdate } from '@/components/lead-status/BulkStatusUpdate';
import { LeadDetailSheet } from '@/components/dashboard/LeadDetailSheet';
import { EnhancedStatusUpdateModal } from '@/components/lead-status/EnhancedStatusUpdateModal';
import { useRefactoredLeads } from '@/hooks/useRefactoredLeads';
import { PartnerLeaderboard } from '@/components/gamification/PartnerLeaderboard';
import { AdminActionRequired } from '@/components/gamification/AdminActionRequired';
import { PersonalImpact } from '@/components/gamification/PersonalImpact';
import { DocumentVerificationModal } from '@/components/admin/DocumentVerificationModal';
import UserManagementTab from '@/components/admin/UserManagementTab';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { AdminActionsDrawer } from '@/components/admin/AdminActionsDrawer';
import { LendersManagementTab } from '@/components/admin/LendersManagementTab';

// Refactored hooks
import { useAdminKPIs } from '@/hooks/useAdminKPIs';
import { useAdminFilters } from '@/hooks/useAdminFilters';
import { useAdminLeadActions } from '@/hooks/useAdminLeadActions';

// Refactored components
import { AdminKPICards } from '@/components/admin/AdminKPICards';
import { AdminOverviewCharts } from '@/components/admin/AdminOverviewCharts';
import { AdminPartnersTable } from '@/components/admin/AdminPartnersTable';
import { AdminLeadsTable } from '@/components/admin/AdminLeadsTable';
import { AdminFiltersBar } from '@/components/admin/AdminFiltersBar';

// Refactored utilities
import { PartnerStats, calculateTopPartner, generateLeaderboardData } from '@/utils/adminDashboardHelpers';

const AdminDashboard = () => {
  const { signOut, appUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const tabsRef = useRef<HTMLDivElement>(null);
  const { leads: allLeads, loading: leadsLoading } = useRefactoredLeads();
  
  // Use refactored hooks
  const { kpis, loanComparison, fetchKPIs, fetchLoanComparison, refreshAll: refreshKPIs } = useAdminKPIs();
  const [partnerStats, setPartnerStats] = useState<PartnerStats[]>([]);
  const [recentLeads, setRecentLeads] = useState(allLeads);
  const {
    selectedPartner,
    searchTerm,
    selectedLeads,
    filteredLeads,
    setSelectedPartner,
    setSearchTerm,
    handleSelectLead,
    handleSelectAll,
    clearSelections,
  } = useAdminFilters(recentLeads);
  
  const {
    selectedLead,
    showLeadDetailSheet,
    showStatusUpdateModal,
    quickUpdateLead,
    showDocVerificationModal,
    selectedDocument,
    documentLeadId,
    handleViewLead,
    closeLeadDetail,
    handleQuickStatusUpdate,
    closeStatusUpdate,
    handleVerifyDocument,
    closeDocVerification,
    handleReviewLead,
  } = useAdminLeadActions();

  const [loading, setLoading] = useState(true);
  const [showCreatePartner, setShowCreatePartner] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  // Calculate derived data
  const topPartner = calculateTopPartner(partnerStats);
  const leaderboardData = generateLeaderboardData(partnerStats);

  const fetchPartnerStats = async () => {
    try {
      const { data: partners } = await supabase
        .from('partners')
        .select(`
          id,
          name,
          partner_code,
          leads_new!leads_new_partner_id_fkey (
            id,
            status,
            created_at
          )
        `);

      const stats: PartnerStats[] = partners?.map((partner) => ({
        id: partner.id,
        name: partner.name,
        partner_code: partner.partner_code,
        totalLeads: partner.leads_new.length,
        activeLenders: 1,
        recentActivity: partner.leads_new.length > 0 
          ? new Date(partner.leads_new[0].created_at).toLocaleDateString()
          : 'No activity',
      })) || [];

      setPartnerStats(stats);
    } catch (error) {
      console.error('Error fetching partner stats:', error);
    }
  };

  const fetchRecentLeads = async () => {
    try {
      let leads = allLeads;
      
      if (selectedPartner !== 'all') {
        leads = allLeads.filter(lead => lead.partner?.id === selectedPartner);
      }
      
      leads = leads
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);
      
      setRecentLeads(leads);
    } catch (error) {
      console.error('Error fetching recent leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchKPIs(),
          fetchLoanComparison(),
          fetchPartnerStats(),
        ]);
        if (!leadsLoading) {
          await fetchRecentLeads();
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPartner]);

  useEffect(() => {
    fetchRecentLeads();
  }, [allLeads, selectedPartner]);

  const handleStatusUpdated = async () => {
    try {
      await Promise.all([
        fetchRecentLeads(),
        refreshKPIs(),
        fetchPartnerStats(),
      ]);
      
      clearSelections();
      closeStatusUpdate();
      
      toast({
        title: 'Dashboard Updated',
        description: 'All data has been refreshed successfully',
      });
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast({
        title: 'Refresh Error',
        description: 'Some data may not be up to date',
        variant: 'destructive',
      });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setTimeout(() => {
      if (tabsRef.current) {
        const yOffset = -20;
        const element = tabsRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 350);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AdminActionsDrawer
                userRole={appUser?.role as 'admin' | 'super_admin'}
                activeTab={activeTab}
                onCreatePartner={() => setShowCreatePartner(true)}
                onSignOut={signOut}
                onTabChange={handleTabChange}
              />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Monitor and manage all leads and partners</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pt-8 pb-12">
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-6 border animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Welcome back, Admin!</h2>
                <p className="text-muted-foreground">System Overview & Performance</p>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <AdminKPICards kpis={kpis} loanComparison={loanComparison} />

          {/* Tabs Section */}
          <div ref={tabsRef}>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className={`grid w-full ${appUser?.role === 'super_admin' ? 'grid-cols-6' : 'grid-cols-4'} max-w-5xl`}>
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="partners" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Partners
                </TabsTrigger>
                <TabsTrigger value="leads" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Leads
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                {appUser?.role === 'super_admin' && (
                  <>
                    <TabsTrigger value="lenders" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Lenders
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Audit
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <AdminOverviewCharts
                  recentLeads={recentLeads}
                  partnerStats={partnerStats}
                  kpis={kpis}
                  onLeadClick={handleViewLead}
                />
              </TabsContent>

              <TabsContent value="partners" className="space-y-6 mt-6">
                <AdminPartnersTable partnerStats={partnerStats} />
              </TabsContent>

              <TabsContent value="leads" className="space-y-6 mt-6">
                <AdminFiltersBar
                  searchTerm={searchTerm}
                  selectedPartner={selectedPartner}
                  partnerStats={partnerStats}
                  onSearchChange={setSearchTerm}
                  onPartnerChange={setSelectedPartner}
                />
                <AdminLeadsTable
                  filteredLeads={filteredLeads}
                  selectedLeads={selectedLeads}
                  onSelectLead={handleSelectLead}
                  onSelectAll={handleSelectAll}
                  onViewLead={handleViewLead}
                  onQuickStatusUpdate={handleQuickStatusUpdate}
                  onShowBulkUpdate={() => setShowBulkUpdate(true)}
                />
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <UserManagementTab />
              </TabsContent>

              {appUser?.role === 'super_admin' && (
                <>
                  <TabsContent value="lenders" className="mt-6">
                    <LendersManagementTab />
                  </TabsContent>
                  <TabsContent value="audit" className="mt-6">
                    <AuditLogViewer />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>

          {/* Gamification Widgets */}
          <div className="grid gap-6 lg:grid-cols-2">
            <PartnerLeaderboard data={leaderboardData} />
            <div className="space-y-6">
              <AdminActionRequired onReviewLead={(id) => handleReviewLead(id, recentLeads)} />
              <PersonalImpact onVerifyDocument={handleVerifyDocument} />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreatePartnerModal
        open={showCreatePartner}
        onOpenChange={setShowCreatePartner}
        onSuccess={fetchPartnerStats}
      />

      <BulkStatusUpdate
        open={showBulkUpdate}
        onOpenChange={setShowBulkUpdate}
        selectedLeadIds={selectedLeads}
        onSuccess={handleStatusUpdated}
      />

      <LeadDetailSheet
        open={showLeadDetailSheet}
        onOpenChange={closeLeadDetail}
        lead={selectedLead}
      />

      <EnhancedStatusUpdateModal
        open={showStatusUpdateModal}
        onOpenChange={closeStatusUpdate}
        lead={quickUpdateLead}
        onSuccess={handleStatusUpdated}
      />

      <DocumentVerificationModal
        open={showDocVerificationModal}
        onOpenChange={closeDocVerification}
        document={selectedDocument}
        leadId={documentLeadId}
        onVerified={handleStatusUpdated}
      />
    </div>
  );
};

export default AdminDashboard;
