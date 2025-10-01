import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RefactoredLead, mapDbRefactoredLeadToLead } from '@/types/refactored-lead';

export function useRefactoredLeads() {
  const [leads, setLeads] = useState<RefactoredLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [useRefactoredLeads] Starting fetch...');

      const { data, error } = await supabase
        .from('leads_new')
        .select(`
          *,
          students (
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
          co_applicants (
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
          partners (
            id,
            name,
            email,
            phone,
            address,
            is_active,
            created_at,
            updated_at
          ),
          lenders (
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

      if (error) {
        console.error('❌ [useRefactoredLeads] Error fetching leads:', error);
        setError(error.message);
        return;
      }

      console.log('✅ [useRefactoredLeads] Fetched leads:', data?.length || 0);

      const mappedLeads = data?.map(mapDbRefactoredLeadToLead) || [];
      console.log('✅ [useRefactoredLeads] Mapped leads:', mappedLeads.length);
      setLeads(mappedLeads);
    } catch (err) {
      console.error('❌ [useRefactoredLeads] Exception:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchLeads();
  };

  useEffect(() => {
    fetchLeads();
  }, []);

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
  }, []);

  return {
    leads,
    loading,
    error,
    refetch
  };
}