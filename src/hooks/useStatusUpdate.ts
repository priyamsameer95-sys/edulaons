import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LeadStatus, DocumentStatus } from '@/utils/statusUtils';

interface UpdateStatusParams {
  leadId: string;
  status?: LeadStatus;
  documentsStatus?: DocumentStatus;
  reason?: string;
  notes?: string;
}

export function useStatusUpdate() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateStatus = async ({ leadId, status, documentsStatus, reason, notes }: UpdateStatusParams) => {
    try {
      setLoading(true);

      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (documentsStatus !== undefined) updateData.documents_status = documentsStatus;

      const { error } = await supabase
        .from('leads_new')
        .update(updateData)
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update lead status',
          variant: 'destructive',
        });
        return false;
      }

      // If reason or notes provided, update the status history record
      if (reason || notes) {
        const { error: historyError } = await supabase
          .from('lead_status_history')
          .update({
            change_reason: reason,
            notes: notes,
          })
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (historyError) {
          console.error('Error updating status history:', historyError);
        }
      }

      toast({
        title: 'Success',
        description: 'Lead status updated successfully',
      });

      return true;
    } catch (err) {
      console.error('Error in updateStatus:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
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

      const { error } = await supabase
        .from('leads_new')
        .update({ status })
        .in('id', leadIds);

      if (error) {
        console.error('Error bulk updating lead status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update lead statuses',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Success',
        description: `Updated ${leadIds.length} lead(s) successfully`,
      });

      return true;
    } catch (err) {
      console.error('Error in bulkUpdateStatus:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateStatus,
    bulkUpdateStatus,
    loading,
  };
}