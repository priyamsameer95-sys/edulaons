import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LeadInfo } from '@/types/lead';

interface UseLeadInfoReturn {
  lead: LeadInfo | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useLeadInfo(leadId: string | undefined): UseLeadInfoReturn {
  const [lead, setLead] = useState<LeadInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeadInfo = useCallback(async () => {
    if (!leadId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('leads_new')
        .select(`
          id,
          case_id,
          loan_amount,
          study_destination,
          student:students(name, email, phone)
        `)
        .eq('id', leadId)
        .single();

      if (fetchError) throw fetchError;
      setLead(data as unknown as LeadInfo);
    } catch (err) {
      console.error('Error fetching lead:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch lead'));
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLeadInfo();
  }, [fetchLeadInfo]);

  return { lead, loading, error, refetch: fetchLeadInfo };
}
