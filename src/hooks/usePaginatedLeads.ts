import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';

export interface PaginatedLead {
  id: string;
  case_id: string;
  student_id: string;
  co_applicant_id: string;
  partner_id: string | null;
  lender_id: string;
  loan_amount: number;
  loan_type: 'secured' | 'unsecured';
  study_destination: string;
  intake_month: number | null;
  intake_year: number | null;
  status: string;
  documents_status: string;
  created_at: string;
  updated_at: string;
  // Joined data
  student?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  partner?: {
    id: string;
    name: string;
    partner_code: string;
  };
  lender?: {
    id: string;
    name: string;
    code: string;
  };
  co_applicant?: {
    id: string;
    name: string;
    relationship: string;
  };
}

export interface PaginationFilters {
  search: string;
  status: string | null;
  partnerId: string | null;
}

export interface UsePaginatedLeadsReturn {
  leads: PaginatedLead[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: Partial<PaginationFilters>) => void;
  filters: PaginationFilters;
  refetch: () => void;
}

export function usePaginatedLeads(initialPageSize = 50): UsePaginatedLeadsReturn {
  const [leads, setLeads] = useState<PaginatedLead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<PaginationFilters>({
    search: '',
    status: null,
    partnerId: null,
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the server-side search function
      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_leads', {
          search_query: debouncedSearch || '',
          status_filter: filters.status || null,
          partner_filter: filters.partnerId || null,
          page_num: page,
          page_size: pageSize,
        });

      if (searchError) {
        console.error('Search error:', searchError);
        throw searchError;
      }

      if (!searchResults || searchResults.length === 0) {
        setLeads([]);
        setTotalCount(0);
        setIsLoading(false);
        return;
      }

      // Get total count from first result
      const total = searchResults[0]?.total_count || 0;
      setTotalCount(Number(total));

      // Get lead IDs for fetching related data
      const leadIds = searchResults.map((r: { id: string }) => r.id);

      // Fetch full lead data with relationships
      const { data: fullLeads, error: leadsError } = await supabase
        .from('leads_new')
        .select(`
          *,
          student:students(id, name, email, phone),
          partner:partners(id, name, partner_code),
          lender:lenders(id, name, code),
          co_applicant:co_applicants(id, name, relationship)
        `)
        .in('id', leadIds)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // Map to preserve the order from search results
      const orderedLeads = leadIds.map((id: string) => 
        fullLeads?.find(l => l.id === id)
      ).filter(Boolean) as PaginatedLead[];

      setLeads(orderedLeads);
    } catch (err) {
      console.error('Error fetching paginated leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filters.status, filters.partnerId, page, pageSize]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.partnerId]);

  const setFilters = useCallback((newFilters: Partial<PaginationFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const totalPages = useMemo(() => 
    Math.ceil(totalCount / pageSize), 
    [totalCount, pageSize]
  );

  return {
    leads,
    totalCount,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    setPage,
    setPageSize,
    setFilters,
    filters,
    refetch: fetchLeads,
  };
}
