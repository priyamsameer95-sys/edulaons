import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { LeadStatus, DocumentStatus } from '@/utils/statusUtils';

interface StatusUpdateParams {
  leadId: string;
  newStatus?: LeadStatus;
  newDocumentsStatus?: DocumentStatus;
  reason?: string;
  reasonCode?: string;
  notes?: string;
  additionalData?: Record<string, unknown>;
}

interface StatusHistoryEntry {
  lead_id: string;
  old_status?: LeadStatus;
  new_status?: LeadStatus;
  old_documents_status?: DocumentStatus;
  new_documents_status?: DocumentStatus;
  change_reason?: string;
  reason_code?: string;
  notes?: string;
  changed_by?: string;
}

export function useStatusManager() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getCurrentStatus = async (leadId: string) => {
    const { data, error } = await supabase
      .from('leads_new')
      .select('status, documents_status')
      .eq('id', leadId)
      .single();

    if (error) {
      console.error('Error fetching current status:', error);
      return null;
    }

    return data;
  };

  const createStatusHistory = async (params: StatusHistoryEntry) => {
    const { data: userData } = await supabase.auth.getUser();
    
    // Using raw insert since reason_code column was just added
    const { error } = await supabase
      .from('lead_status_history')
      .insert({
        lead_id: params.lead_id,
        old_status: params.old_status,
        new_status: params.new_status,
        old_documents_status: params.old_documents_status,
        new_documents_status: params.new_documents_status,
        change_reason: params.change_reason,
        notes: params.notes,
        changed_by: userData.user?.id,
        reason_code: params.reason_code, // New field for structured tracking
      } as any);

    if (error) {
      console.error('Error creating status history:', error);
      throw error;
    }
  };

  const updateLeadStatus = async (params: StatusUpdateParams) => {
    try {
      setLoading(true);

      // Get current status first
      const currentStatus = await getCurrentStatus(params.leadId);
      if (!currentStatus) {
        throw new Error('Could not fetch current lead status');
      }

      // Prepare update data
      const updateData: any = {};
      let statusChanged = false;
      let documentsStatusChanged = false;

      if (params.newStatus && params.newStatus !== currentStatus.status) {
        updateData.status = params.newStatus;
        statusChanged = true;
      }

      if (params.newDocumentsStatus && params.newDocumentsStatus !== currentStatus.documents_status) {
        updateData.documents_status = params.newDocumentsStatus;
        documentsStatusChanged = true;
      }

      // Merge additional data (for conditional fields like LAN, sanction amount, etc.)
      if (params.additionalData) {
        Object.assign(updateData, params.additionalData);
      }

      // If no changes, return early
      if (!statusChanged && !documentsStatusChanged) {
        toast({
          title: 'No Changes',
          description: 'No status changes were made.',
          variant: 'default',
        });
        return true;
      }

      // Update the lead status
      const { error: updateError } = await supabase
        .from('leads_new')
        .update(updateData)
        .eq('id', params.leadId);

      if (updateError) {
        console.error('Error updating lead:', updateError);
        throw updateError;
      }

      // Create status history entry
      await createStatusHistory({
        lead_id: params.leadId,
        old_status: statusChanged ? currentStatus.status : undefined,
        new_status: statusChanged ? params.newStatus : undefined,
        old_documents_status: documentsStatusChanged ? currentStatus.documents_status : undefined,
        new_documents_status: documentsStatusChanged ? params.newDocumentsStatus : undefined,
        change_reason: params.reason,
        reason_code: params.reasonCode,
        notes: params.notes,
      });

      toast({
        title: 'Success',
        description: 'Lead status updated successfully',
      });

      return true;
    } catch (error) {
      console.error('Error in updateLeadStatus:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update lead status',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateStatus = async (leadIds: string[], status: LeadStatus, reason?: string) => {
    try {
      setLoading(true);

      // Get current statuses for history tracking
      const { data: currentLeads } = await supabase
        .from('leads_new')
        .select('id, status')
        .in('id', leadIds);

      if (!currentLeads) {
        throw new Error('Could not fetch current lead statuses');
      }

      // Update all leads
      const { error: updateError } = await supabase
        .from('leads_new')
        .update({ status })
        .in('id', leadIds);

      if (updateError) {
        throw updateError;
      }

      // Create history entries for each lead
      const historyEntries = currentLeads.map(lead => ({
        lead_id: lead.id,
        old_status: lead.status as LeadStatus,
        new_status: status,
        change_reason: reason,
      }));

      for (const entry of historyEntries) {
        await createStatusHistory(entry);
      }

      toast({
        title: 'Success',
        description: `Updated ${leadIds.length} lead(s) successfully`,
      });

      return true;
    } catch (error) {
      console.error('Error in bulkUpdateStatus:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to bulk update lead statuses',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateLeadStatus,
    bulkUpdateStatus,
    loading,
  };
}