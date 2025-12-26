import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RefactoredLead, mapDbRefactoredLeadToLead } from '@/types/refactored-lead';
import { logger } from '@/utils/logger';

/**
 * Hook to fetch leads with optional partner filtering
 * Includes debounced real-time updates for performance
 * @param partnerId - Optional partner ID to filter leads (for partner dashboard)
 *                    If not provided, fetches all leads (for admin dashboard)
 */
export function useRefactoredLeads(partnerId?: string) {
  const [leads, setLeads] = useState<RefactoredLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce timer ref for real-time updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialFetchRef = useRef(true);

  const fetchLeads = useCallback(async (showLoading = true) => {
    try {
      if (showLoading && isInitialFetchRef.current) {
        setLoading(true);
      }
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
      isInitialFetchRef.current = false;
    } catch (err) {
      logger.error('[useRefactoredLeads] Exception:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  // Debounced refetch for real-time updates (300ms debounce)
  const debouncedRefetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchLeads(false); // Don't show loading for real-time updates
    }, 300);
  }, [fetchLeads]);

  const refetch = useCallback(() => {
    isInitialFetchRef.current = true;
    fetchLeads(true);
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Set up real-time subscription with debouncing
  useEffect(() => {
    const channelName = partnerId ? `leads_partner_${partnerId}` : 'leads_all';
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads_new',
          ...(partnerId ? { filter: `partner_id=eq.${partnerId}` } : {})
        },
        () => {
          debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [partnerId, debouncedRefetch]);

  return {
    leads,
    loading,
    error,
    refetch
  };
}
