import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RefactoredLead, mapDbRefactoredLeadToLead } from '@/types/refactored-lead';
import { useDebounce } from '@/hooks/use-debounce';

interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface UsePartnerPaginatedLeadsResult {
  leads: RefactoredLead[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refetch: () => void;
}

export function usePartnerPaginatedLeads(
  partnerId?: string,
  pageSize: number = 25
): UsePartnerPaginatedLeadsResult {
  const [leads, setLeads] = useState<RefactoredLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(totalCount / pageSizeState)), 
    [totalCount, pageSizeState]
  );

  const fetchLeads = useCallback(async () => {
    if (!partnerId) {
      setLeads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get total count first
      const { count, error: countError } = await supabase
        .from('leads_new')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId);

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Fetch paginated leads
      const from = (page - 1) * pageSizeState;
      const to = from + pageSizeState - 1;

      const { data, error: fetchError } = await supabase
        .from('leads_new')
        .select(`
          *,
          students!leads_new_student_id_fkey(*),
          co_applicants!leads_new_co_applicant_id_fkey(*),
          lenders!leads_new_lender_id_fkey(id, name, code, logo_url),
          partners!leads_new_partner_id_fkey(id, name, partner_code)
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      const mappedLeads = (data || []).map(lead => mapDbRefactoredLeadToLead(lead as any));
      setLeads(mappedLeads);
    } catch (err: any) {
      console.error('Error fetching paginated leads:', err);
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [partnerId, page, pageSizeState]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset to page 1 when pageSize changes
  const handleSetPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  // Ensure page is within valid range
  const handleSetPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  return {
    leads,
    loading,
    error,
    pagination: {
      page,
      pageSize: pageSizeState,
      totalCount,
      totalPages,
    },
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    refetch: fetchLeads,
  };
}
