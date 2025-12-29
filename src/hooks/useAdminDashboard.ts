import { useState, useEffect, useCallback } from 'react';
import { usePaginatedLeads, PaginatedLead } from '@/hooks/usePaginatedLeads';
import { DEFAULT_VIEWS } from '@/components/admin/dashboard/ViewTabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Partner {
  id: string;
  name: string;
  partner_code: string;
}

export interface AdminDashboardState {
  // View & Tab state
  activeView: string;
  activeTab: string;
  
  // Selection state
  selectedLeads: string[];
  selectedLead: PaginatedLead | null;
  
  // Modal visibility state
  modals: {
    leadDetail: boolean;
    statusUpdate: boolean;
    bulkStatus: boolean;
    docVerification: boolean;
    newLead: boolean;
    commandPalette: boolean;
    completeLead: boolean;
  };
  
  // Document verification state
  selectedDocument: any;
  documentLeadId: string | null;
  
  // Partners data
  allPartners: Partner[];
}

const initialModalState = {
  leadDetail: false,
  statusUpdate: false,
  bulkStatus: false,
  docVerification: false,
  newLead: false,
  commandPalette: false,
  completeLead: false,
};

export function useAdminDashboard(defaultPageSize = 50) {
  // Paginated leads hook
  const paginatedLeads = usePaginatedLeads(defaultPageSize);
  
  // View state
  const [activeView, setActiveView] = useState('all');
  const [activeTab, setActiveTab] = useState('queue');
  
  // Selection state
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<PaginatedLead | null>(null);
  
  // Modal state - consolidated
  const [modals, setModals] = useState(initialModalState);
  
  // Document verification state
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentLeadId, setDocumentLeadId] = useState<string | null>(null);
  
  // Partners data
  const [allPartners, setAllPartners] = useState<Partner[]>([]);

  // Fetch partners
  const fetchPartners = useCallback(async () => {
    const { data } = await supabase
      .from('partners')
      .select('id, name, partner_code')
      .eq('is_active', true)
      .order('name');
    if (data) setAllPartners(data);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Modal helpers
  const openModal = useCallback((modal: keyof typeof initialModalState) => {
    setModals(prev => ({ ...prev, [modal]: true }));
  }, []);

  const closeModal = useCallback((modal: keyof typeof initialModalState) => {
    setModals(prev => ({ ...prev, [modal]: false }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(initialModalState);
  }, []);

  // View change handler
  const handleViewChange = useCallback((viewId: string) => {
    setActiveView(viewId);
    const view = DEFAULT_VIEWS.find(v => v.id === viewId);
    if (view) {
      paginatedLeads.setFilters({
        status: view.filters.status || null,
        partnerId: view.filters.partnerId || null,
        documentsStatus: view.filters.documentsStatus || null,
      });
    }
    setSelectedLeads([]);
  }, [paginatedLeads]);

  // Lead action handlers
  const handleViewLead = useCallback((lead: PaginatedLead) => {
    setSelectedLead(lead);
    openModal('leadDetail');
  }, [openModal]);

  const handleUpdateStatus = useCallback((lead: PaginatedLead) => {
    setSelectedLead(lead);
    openModal('statusUpdate');
  }, [openModal]);

  const handleCompleteLead = useCallback((lead: PaginatedLead) => {
    setSelectedLead(lead);
    openModal('completeLead');
  }, [openModal]);

  const handleVerifyDocs = useCallback(async (lead: PaginatedLead) => {
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
        openModal('docVerification');
      } else {
        toast.info('No documents pending verification for this lead');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    }
  }, [openModal]);

  const handleStatusUpdated = useCallback(() => {
    paginatedLeads.refetch();
    closeModal('statusUpdate');
    setSelectedLead(null);
    toast.success('Lead status has been updated successfully');
  }, [paginatedLeads, closeModal]);

  const handleOpenNewLeadModal = useCallback(() => {
    fetchPartners();
    openModal('newLead');
  }, [fetchPartners, openModal]);

  const handleRefresh = useCallback(() => {
    paginatedLeads.refetch();
    toast.success('Data has been refreshed');
  }, [paginatedLeads]);

  const handleBulkStatusComplete = useCallback(() => {
    paginatedLeads.refetch();
    setSelectedLeads([]);
    closeModal('bulkStatus');
    toast.success(`Updated ${selectedLeads.length} leads`);
  }, [paginatedLeads, closeModal, selectedLeads.length]);

  const handleLeadCompleted = useCallback(() => {
    paginatedLeads.refetch();
    closeModal('completeLead');
    setSelectedLead(null);
    toast.success('Quick lead has been completed successfully');
  }, [paginatedLeads, closeModal]);

  const handleDocVerificationComplete = useCallback(() => {
    paginatedLeads.refetch();
    closeModal('docVerification');
    setSelectedDocument(null);
    setDocumentLeadId(null);
  }, [paginatedLeads, closeModal]);

  const handleOpenLeadById = useCallback(async (leadId: string) => {
    const lead = paginatedLeads.leads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLead(lead);
      openModal('leadDetail');
    } else {
      // Fetch lead if not in current page
      const { data } = await supabase
        .from('leads_new')
        .select(`
          *,
          student:students(*),
          co_applicant:co_applicants(*),
          partner:partners(*),
          lender:lenders(*)
        `)
        .eq('id', leadId)
        .single();
        
      if (data) {
        setSelectedLead(data as any);
        openModal('leadDetail');
      }
    }
  }, [paginatedLeads.leads, openModal]);

  const handleFilterByPartner = useCallback((partnerId: string) => {
    paginatedLeads.setFilters({ partnerId });
    setActiveTab('queue');
  }, [paginatedLeads]);

  return {
    // Paginated leads data & controls
    ...paginatedLeads,
    
    // State
    activeView,
    activeTab,
    selectedLeads,
    selectedLead,
    modals,
    selectedDocument,
    documentLeadId,
    allPartners,
    
    // Setters
    setActiveView,
    setActiveTab,
    setSelectedLeads,
    setSelectedLead,
    
    // Modal controls
    openModal,
    closeModal,
    closeAllModals,
    
    // Action handlers
    handleViewChange,
    handleViewLead,
    handleUpdateStatus,
    handleCompleteLead,
    handleVerifyDocs,
    handleStatusUpdated,
    handleOpenNewLeadModal,
    handleRefresh,
    handleBulkStatusComplete,
    handleLeadCompleted,
    handleDocVerificationComplete,
    handleOpenLeadById,
    handleFilterByPartner,
    fetchPartners,
  };
}
