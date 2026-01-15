import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutList, Building, Settings, Users } from 'lucide-react';
import { assertAdminRole } from '@/utils/roleCheck';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Refactored components
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { ViewTabs, DEFAULT_VIEWS } from '@/components/admin/dashboard/ViewTabs';
import { AdminDashboardHeader } from '@/components/admin/dashboard/AdminDashboardHeader';
import { AdminModalsManager } from '@/components/admin/dashboard/AdminModalsManager';
import { LeadQueueTab } from '@/components/admin/dashboard/LeadQueueTab';
import { SettingsTab } from '@/components/admin/dashboard/SettingsTab';
import { LenderManagementTab } from '@/components/admin/LenderManagementTab';
import { AdminPartnersTab } from '@/components/admin/dashboard/AdminPartnersTab';
import { UniversityManagementTab } from '@/components/admin/dashboard/UniversityManagementTab';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const AdminDashboard = () => {
  const { signOut, appUser } = useAuth();

  // Use the consolidated dashboard hook
  const dashboard = useAdminDashboard(50);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCommandK: () => dashboard.openModal('commandPalette'),
    onCommandN: dashboard.handleOpenNewLeadModal,
    onEscape: dashboard.closeAllModals,
    enabled: true,
  });

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
        <AdminDashboardHeader
          onRefresh={dashboard.handleRefresh}
          onSignOut={signOut}
          onOpenLead={dashboard.handleOpenLeadById}
        />

        {/* View Tabs */}
        <ViewTabs
          views={DEFAULT_VIEWS}
          activeView={dashboard.activeView}
          onViewChange={dashboard.handleViewChange}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Tabs
            value={dashboard.activeTab}
            onValueChange={dashboard.setActiveTab}
            className="flex-1 flex flex-col h-full"
          >
            <div className="border-b px-4 bg-card shrink-0">
              <TabsList className="h-10 bg-transparent">
                <TabsTrigger value="queue" className="gap-1.5 data-[state=active]:bg-background">
                  <LayoutList className="h-4 w-4" />
                  Leads
                </TabsTrigger>
                <TabsTrigger value="partners" className="gap-1.5 data-[state=active]:bg-background">
                  <Users className="h-4 w-4" />
                  Partners
                </TabsTrigger>
                <TabsTrigger value="lenders" className="gap-1.5 data-[state=active]:bg-background">
                  <Building className="h-4 w-4" />
                  Lenders
                </TabsTrigger>
                <TabsTrigger value="universities" className="gap-1.5 data-[state=active]:bg-background">
                  <Building className="h-4 w-4" />
                  Universities
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-1.5 data-[state=active]:bg-background">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="queue"
              className="flex-1 flex flex-col mt-0 overflow-hidden data-[state=inactive]:hidden"
            >
              <LeadQueueTab
                leads={dashboard.leads}
                loading={dashboard.isLoading}
                allPartners={dashboard.allPartners}
                searchTerm={dashboard.filters.search}
                statusFilter={dashboard.filters.status}
                partnerFilter={dashboard.filters.partnerId}
                onSearchChange={(value) => dashboard.setFilters({ search: value })}
                onStatusChange={(value) => dashboard.setFilters({ status: value })}
                onPartnerChange={(value) => dashboard.setFilters({ partnerId: value })}
                selectedLeads={dashboard.selectedLeads}
                onSelectionChange={dashboard.setSelectedLeads}
                page={dashboard.page}
                pageSize={dashboard.pageSize}
                totalCount={dashboard.totalCount}
                totalPages={dashboard.totalPages}
                onPageChange={dashboard.setPage}
                onPageSizeChange={dashboard.setPageSize}
                onAddLead={dashboard.handleOpenNewLeadModal}
                onViewLead={dashboard.handleViewLead}
                onUpdateStatus={dashboard.handleUpdateStatus}
                onCompleteLead={dashboard.handleCompleteLead}
                onOpenBulkStatus={() => dashboard.openModal('bulkStatus')}
              />
            </TabsContent>

            <TabsContent
              value="partners"
              className="flex-1 overflow-auto p-4 mt-0 data-[state=inactive]:hidden"
            >
              <AdminPartnersTab onViewLeads={dashboard.handleFilterByPartner} />
            </TabsContent>

            <TabsContent
              value="lenders"
              className="flex-1 overflow-auto p-4 mt-0 data-[state=inactive]:hidden"
            >
              <LenderManagementTab />
            </TabsContent>

            <TabsContent
              value="universities"
              className="flex-1 overflow-auto p-4 mt-0 data-[state=inactive]:hidden"
            >
              <UniversityManagementTab />
            </TabsContent>

            <TabsContent
              value="settings"
              className="flex-1 overflow-auto p-4 mt-0 data-[state=inactive]:hidden"
            >
              <SettingsTab
                isSuperAdmin={isSuperAdmin}
                currentUserRole={appUser.role as 'admin' | 'super_admin'}
                currentUserId={appUser.id}
              />
            </TabsContent>
          </Tabs>
        </main>

        {/* Modals Manager */}
        <AdminModalsManager
          modals={dashboard.modals}
          selectedLead={dashboard.selectedLead}
          selectedLeads={dashboard.selectedLeads}
          selectedDocument={dashboard.selectedDocument}
          allPartners={dashboard.allPartners}
          leads={dashboard.leads}
          defaultPartnerId={dashboard.filters.partnerId}
          onCloseModal={dashboard.closeModal}
          onStatusUpdated={dashboard.handleStatusUpdated}
          onBulkStatusComplete={dashboard.handleBulkStatusComplete}
          onDocVerificationComplete={dashboard.handleDocVerificationComplete}
          onNewLeadSuccess={dashboard.refetch}
          onLeadCompleted={dashboard.handleLeadCompleted}
          onOpenNewLead={dashboard.handleOpenNewLeadModal}
          onSelectLead={(leadId) => {
            const lead = dashboard.leads.find(l => l.id === leadId);
            if (lead) dashboard.handleViewLead(lead);
          }}
          onSelectPartner={dashboard.handleFilterByPartner}
        />
      </div>
    </AdminErrorBoundary>
  );
};

export default AdminDashboard;
