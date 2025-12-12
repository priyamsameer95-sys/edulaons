import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutList, Building, Settings, RefreshCw, Users, Plus, Command } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaginatedLeads, PaginatedLead } from '@/hooks/usePaginatedLeads';
import { assertAdminRole } from '@/utils/roleCheck';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// New components
import { ViewTabs, DEFAULT_VIEWS, ViewConfig } from '@/components/admin/dashboard/ViewTabs';
import { SmartFilterBar } from '@/components/admin/dashboard/SmartFilterBar';
import { LeadQueueTable } from '@/components/admin/dashboard/LeadQueueTable';
import { StatsSidebar } from '@/components/admin/dashboard/StatsSidebar';
import { SettingsTab } from '@/components/admin/dashboard/SettingsTab';
import { LenderManagementTab } from '@/components/admin/LenderManagementTab';
import { AdminPartnersTab } from '@/components/admin/dashboard/AdminPartnersTab';
import { AdminNewLeadModal } from '@/components/admin/AdminNewLeadModal';
import { CommandPalette } from '@/components/admin/CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Existing modals
import { LeadDetailSheet } from '@/components/dashboard/LeadDetailSheet';
import { EnhancedStatusUpdateModal } from '@/components/lead-status/EnhancedStatusUpdateModal';
import { BulkStatusUpdate } from '@/components/lead-status/BulkStatusUpdate';
import { DocumentVerificationModal } from '@/components/admin/DocumentVerificationModal';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboardV2 = () => {
  const { signOut, appUser } = useAuth();
  const { toast } = useToast();
  
  // Paginated leads hook - server-side pagination
  const { 
    leads, 
    totalCount, 
    page, 
    pageSize, 
    totalPages, 
    isLoading, 
    setPage, 
    setPageSize, 
    setFilters, 
    filters, 
    refetch 
  } = usePaginatedLeads(50);

  // View state
  const [activeView, setActiveView] = useState('all');

  // Selection state for bulk actions
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // Modal state
  const [selectedLead, setSelectedLead] = useState<PaginatedLead | null>(null);
  const [showLeadDetailSheet, setShowLeadDetailSheet] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showDocVerificationModal, setShowDocVerificationModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentLeadId, setDocumentLeadId] = useState<string | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [allPartners, setAllPartners] = useState<Array<{ id: string; name: string; partner_code: string }>>([]);
  const [activeTab, setActiveTab] = useState('queue');

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCommandK: () => setShowCommandPalette(true),
    onCommandN: () => setShowNewLeadModal(true),
    onEscape: () => {
      setShowCommandPalette(false);
      setShowNewLeadModal(false);
    },
    enabled: true,
  });

  // Fetch all partners for filters and Add Lead modal
  useEffect(() => {
    const fetchPartners = async () => {
      const { data } = await supabase
        .from('partners')
        .select('id, name, partner_code')
        .eq('is_active', true)
        .order('name');
      if (data) setAllPartners(data);
    };
    fetchPartners();
  }, []);

  // Handle view change - apply filters from view config
  const handleViewChange = useCallback((viewId: string) => {
    setActiveView(viewId);
    const view = DEFAULT_VIEWS.find(v => v.id === viewId);
    if (view) {
      setFilters({
        status: view.filters.status || null,
        partnerId: view.filters.partnerId || null,
      });
    }
    setSelectedLeads([]);
  }, [setFilters]);

  // Stats for sidebar (using totalCount from server)
  const stats = useMemo(() => {
    return {
      totalLeads: totalCount,
      newLeads: 0, // Would need separate queries for accurate counts
      approvedLeads: 0,
      totalLoanAmount: leads.reduce((sum, l) => sum + l.loan_amount, 0),
    };
  }, [totalCount, leads]);

  // Handlers
  const handleViewLead = (lead: PaginatedLead) => {
    setSelectedLead(lead);
    setShowLeadDetailSheet(true);
  };

  const handleUpdateStatus = (lead: PaginatedLead) => {
    setSelectedLead(lead);
    setShowStatusUpdateModal(true);
  };

  const handleVerifyDocs = async (lead: PaginatedLead) => {
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
    refetch();
    setShowStatusUpdateModal(false);
    setSelectedLead(null);
    toast({ title: 'Status Updated', description: 'Lead status has been updated successfully' });
  };

  const handleRefresh = () => {
    refetch();
    toast({ title: 'Refreshed', description: 'Data has been refreshed' });
  };

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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCommandPalette(true)}
                className="gap-1.5"
              >
                <Command className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs">
                  ⌘K
                </kbd>
              </Button>
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

        {/* View Tabs - replaces PriorityActionBar */}
        <ViewTabs 
          views={DEFAULT_VIEWS} 
          activeView={activeView} 
          onViewChange={handleViewChange}
        />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Main content area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
              <div className="border-b px-4 bg-card">
                <TabsList className="h-10 bg-transparent">
                  <TabsTrigger value="queue" className="gap-1.5 data-[state=active]:bg-background">
                    <LayoutList className="h-4 w-4" />
                    Lead Queue
                  </TabsTrigger>
                  <TabsTrigger value="partners" className="gap-1.5 data-[state=active]:bg-background">
                    <Users className="h-4 w-4" />
                    Partners
                  </TabsTrigger>
                  <TabsTrigger value="lenders" className="gap-1.5 data-[state=active]:bg-background">
                    <Building className="h-4 w-4" />
                    Lenders
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-1.5 data-[state=active]:bg-background">
                    <Settings className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="queue" className="flex-1 flex flex-col mt-0 overflow-hidden data-[state=inactive]:hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                  <SmartFilterBar
                    searchTerm={filters.search}
                    onSearchChange={(value) => setFilters({ search: value })}
                    statusFilter={filters.status || 'all'}
                    onStatusChange={(value) => setFilters({ status: value === 'all' ? null : value })}
                    partnerFilter={filters.partnerId || 'all'}
                    onPartnerChange={(value) => setFilters({ partnerId: value === 'all' ? null : value })}
                    partners={allPartners}
                  />
                  <Button size="sm" onClick={() => setShowNewLeadModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Lead
                  </Button>
                </div>
                
                {/* Bulk Actions Bar */}
                {selectedLeads.length > 0 && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border-b border-primary/20">
                    <span className="text-sm font-medium">
                      {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBulkStatusModal(true)}
                    >
                      Bulk Update Status
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedLeads([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}
                
                <div className="flex-1 overflow-auto">
                  <LeadQueueTable
                    leads={leads}
                    loading={isLoading}
                    onViewLead={handleViewLead}
                    onUpdateStatus={handleUpdateStatus}
                    onVerifyDocs={handleVerifyDocs}
                    selectedLeads={selectedLeads}
                    onSelectionChange={setSelectedLeads}
                    // Pagination props
                    page={page}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              </TabsContent>

              <TabsContent value="partners" className="flex-1 overflow-auto p-4 mt-0 data-[state=inactive]:hidden">
                <AdminPartnersTab 
                  onViewLeads={(partnerId) => {
                    setFilters({ partnerId });
                    setActiveTab('queue');
                  }}
                />
              </TabsContent>

              <TabsContent value="lenders" className="flex-1 overflow-auto p-4 mt-0 data-[state=inactive]:hidden">
                <LenderManagementTab />
              </TabsContent>

              <TabsContent value="settings" className="flex-1 overflow-auto p-4 mt-0 data-[state=inactive]:hidden">
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

        {/* Command Palette */}
        <CommandPalette
          open={showCommandPalette}
          onOpenChange={setShowCommandPalette}
          onNewLead={() => setShowNewLeadModal(true)}
          onSelectLead={(leadId) => {
            const lead = leads.find(l => l.id === leadId);
            if (lead) handleViewLead(lead);
          }}
          onSelectPartner={(partnerId) => {
            setFilters({ partnerId });
            setActiveTab('queue');
          }}
        />

        {/* Modals */}
        {selectedLead && (
          <>
            <LeadDetailSheet
              open={showLeadDetailSheet}
              onOpenChange={setShowLeadDetailSheet}
              lead={selectedLead as any}
              onLeadUpdated={handleStatusUpdated}
            />
            <EnhancedStatusUpdateModal
              open={showStatusUpdateModal}
              onOpenChange={setShowStatusUpdateModal}
              leadId={selectedLead.id}
              currentStatus={selectedLead.status as any}
              currentDocumentsStatus={selectedLead.documents_status as any}
              onStatusUpdated={handleStatusUpdated}
            />
          </>
        )}

        {/* Bulk Status Update Modal */}
        <BulkStatusUpdate
          open={showBulkStatusModal}
          onOpenChange={setShowBulkStatusModal}
          leadIds={selectedLeads}
          onStatusUpdated={() => {
            refetch();
            setSelectedLeads([]);
            setShowBulkStatusModal(false);
            toast({ title: 'Bulk Update Complete', description: `Updated ${selectedLeads.length} leads` });
          }}
        />

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
              refetch();
              setShowDocVerificationModal(false);
            }}
          />
        )}

        {/* Admin New Lead Modal */}
        <AdminNewLeadModal
          open={showNewLeadModal}
          onOpenChange={setShowNewLeadModal}
          onSuccess={() => {
            refetch();
          }}
          partners={allPartners}
        />
      </div>
    </AdminErrorBoundary>
  );
};

export default AdminDashboardV2;
