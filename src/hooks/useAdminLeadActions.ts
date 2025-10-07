import { useState, useCallback } from 'react';
import { RefactoredLead } from '@/types/refactored-lead';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for managing lead-related actions in Admin Dashboard
 * Handles viewing lead details, status updates, document verification
 * 
 * @returns Lead action state and handler functions
 */
export const useAdminLeadActions = () => {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<RefactoredLead | null>(null);
  const [showLeadDetailSheet, setShowLeadDetailSheet] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [quickUpdateLead, setQuickUpdateLead] = useState<RefactoredLead | null>(null);
  const [showDocVerificationModal, setShowDocVerificationModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentLeadId, setDocumentLeadId] = useState<string | null>(null);

  /**
   * Open lead detail sheet for viewing full lead information
   */
  const handleViewLead = useCallback((lead: RefactoredLead) => {
    setSelectedLead(lead);
    setShowLeadDetailSheet(true);
  }, []);

  /**
   * Close lead detail sheet
   */
  const closeLeadDetail = useCallback(() => {
    setShowLeadDetailSheet(false);
    setSelectedLead(null);
  }, []);

  /**
   * Open quick status update modal for a specific lead
   */
  const handleQuickStatusUpdate = useCallback((lead: RefactoredLead) => {
    setQuickUpdateLead(lead);
    setShowStatusUpdateModal(true);
  }, []);

  /**
   * Close status update modal and clear quick update lead
   */
  const closeStatusUpdate = useCallback(() => {
    setShowStatusUpdateModal(false);
    setQuickUpdateLead(null);
  }, []);

  /**
   * Handle document verification
   * Fetches document details and opens verification modal
   */
  const handleVerifyDocument = useCallback(async (documentId: string, leadId: string) => {
    try {
      const { data: document } = await supabase
        .from('lead_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (document) {
        setSelectedDocument(document);
        setDocumentLeadId(leadId);
        setShowDocVerificationModal(true);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      toast({
        title: 'Error',
        description: 'Failed to load document details',
        variant: 'destructive',
      });
    }
  }, [toast]);

  /**
   * Close document verification modal
   */
  const closeDocVerification = useCallback(() => {
    setShowDocVerificationModal(false);
    setSelectedDocument(null);
    setDocumentLeadId(null);
  }, []);

  /**
   * Review a lead by ID (used in gamification components)
   */
  const handleReviewLead = useCallback((leadId: string, leads: RefactoredLead[]) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      handleViewLead(lead);
    }
  }, [handleViewLead]);

  return {
    // Lead detail state
    selectedLead,
    showLeadDetailSheet,
    
    // Status update state
    showStatusUpdateModal,
    quickUpdateLead,
    
    // Document verification state
    showDocVerificationModal,
    selectedDocument,
    documentLeadId,
    
    // Action handlers
    handleViewLead,
    closeLeadDetail,
    handleQuickStatusUpdate,
    closeStatusUpdate,
    handleVerifyDocument,
    closeDocVerification,
    handleReviewLead,
  };
};
