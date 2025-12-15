import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StatusHistoryRecord {
  id: string;
  old_status: string | null;
  new_status: string;
  old_documents_status: string | null;
  new_documents_status: string | null;
  change_reason: string | null;
  notes: string | null;
  created_at: string;
  changed_by: string | null;
  changer_email: string | null;
}

export function useLeadStatusHistory(leadId: string) {
  const [history, setHistory] = useState<StatusHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('lead_status_history')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching status history:', error);
        setError(error.message);
        return;
      }

      // Map the data (no FK join available for changed_by)
      const mappedData = (data || []).map((record: any) => ({
        ...record,
        changer_email: null, // No FK relationship exists
      }));

      setHistory(mappedData);
    } catch (err) {
      console.error('Error in fetchHistory:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchHistory();
    }
  }, [leadId]);

  // Set up real-time subscription for status history
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`lead_status_history_${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_status_history',
          filter: `lead_id=eq.${leadId}`
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory
  };
}