import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RefactoredLead, mapDbRefactoredLeadToLead } from '@/types/refactored-lead';
import { logger } from '@/utils/logger';

/**
 * Hook to fetch leads with optional partner filtering
 * @param partnerId - Optional partner ID to filter leads (for partner dashboard)
 *                    If not provided, fetches all leads (for admin dashboard)
 */
export function useRefactoredLeads(partnerId?: string) {
  const [leads, setLeads] = useState<RefactoredLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info('[useRefactoredLeads] Starting fetch...', { partnerId });

      let query = supabase
        .from('leads_new')
        .select(`
          *,
          students!leads_new_student_id_fkey (
            id,
            name,
            email,
            phone,
            date_of_birth,
            nationality,
            street_address,
            city,
            state,
            country,
            postal_code,
            created_at,
            updated_at
          ),
          co_applicants!leads_new_co_applicant_id_fkey (
            id,
            name,
            relationship,
            salary,
            pin_code,
            phone,
            email,
            occupation,
            employer,
            created_at,
            updated_at
          ),
          partners!leads_new_partner_id_fkey (
            id,
            name,
            email,
            phone,
            address,
            is_active,
            created_at,
            updated_at
          ),
          lenders!leads_new_lender_id_fkey (
            id,
            name,
            code,
            description,
            website,
            contact_email,
            contact_phone,
            is_active,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by partner if partnerId is provided
      if (partnerId) {
        query = query.eq('partner_id', partnerId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[useRefactoredLeads] Error fetching leads:', error);
        setError(error.message);
        return;
      }

      logger.info('[useRefactoredLeads] Fetched leads:', data?.length || 0);

      const mappedLeads = (data as any)?.map(mapDbRefactoredLeadToLead) || [];
      logger.info('[useRefactoredLeads] Mapped leads:', mappedLeads.length);
      setLeads(mappedLeads);
    } catch (err) {
      logger.error('[useRefactoredLeads] Exception:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  const refetch = useCallback(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('leads_new_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads_new'
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    refetch
  };
}