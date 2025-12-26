import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RefactoredLead, mapDbRefactoredLeadToLead } from '@/types/refactored-lead';
import { logger } from '@/utils/logger';

/**
 * Hook to fetch leads with optional partner filtering
 * Includes debounced real-time updates for performance
 */
export function useRefactoredLeads(partnerId?: string) {
  const [leads, setLeads] = useState<RefactoredLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('leads_new')
        .select(`
          *,
          students!leads_new_student_id_fkey (
            id, name, email, phone, date_of_birth, nationality,
            street_address, city, state, country, postal_code,
            created_at, updated_at
          ),
          co_applicants!leads_new_co_applicant_id_fkey (
            id, name, relationship, salary, pin_code, phone,
            email, occupation, employer, created_at, updated_at
          ),
          partners!leads_new_partner_id_fkey (
            id, name, email, phone, address, is_active,
            created_at, updated_at
          ),
          lenders!leads_new_lender_id_fkey (
            id, name, code, description, website, contact_email,
            contact_phone, is_active, created_at, updated_at
          )
        `)
        .order('created_at', { ascending: false });

      if (partnerId) {
        query = query.eq('partner_id', partnerId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        logger.error('[useRefactoredLeads] Error:', fetchError);
        setError(fetchError.message);
        return;
      }

      const mappedLeads = (data as any)?.map(mapDbRefactoredLeadToLead) || [];
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

  // Initial fetch
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Real-time subscription with debouncing
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
          // Debounce real-time updates
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }
          debounceRef.current = setTimeout(() => {
            fetchLeads();
          }, 300);
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [partnerId, fetchLeads]);

  return { leads, loading, error, refetch };
}
