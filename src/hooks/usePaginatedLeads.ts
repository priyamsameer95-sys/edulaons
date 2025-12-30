import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';

export type LoanClassification = 'unsecured' | 'secured_fd' | 'secured_property';
export type CaseComplexity = 'straightforward' | 'nri_case' | 'low_credit_case' | 'late_intake_case' | 'rejected_case';

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
  is_quick_lead: boolean | null;
  quick_lead_completed_at: string | null;
  // TAT tracking fields
  current_stage_started_at: string | null;
  lan_number: string | null;
  sanction_amount: number | null;
  sanction_date: string | null;
  pd_call_scheduled_at: string | null;
  pd_call_status: string | null;
  pf_amount: number | null;
  pf_paid_at: string | null;
  property_verification_status: string | null;
  // Loan configuration fields
  loan_classification: LoanClassification | null;
  target_lender_id: string | null;
  case_complexity: CaseComplexity | null;
  loan_config_updated_at: string | null;
  loan_config_updated_by: string | null;
  // Phase 10: Expanded joined data with all fields for completeness tooltips
  student?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    postal_code?: string;
    date_of_birth?: string;
    gender?: string;
    city?: string;
    state?: string;
    nationality?: string;
    street_address?: string;
    highest_qualification?: string;
    tenth_percentage?: number;
    twelfth_percentage?: number;
    bachelors_percentage?: number;
    bachelors_cgpa?: number;
    credit_score?: number;
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
    phone?: string;
    email?: string;
    salary?: number;
    pin_code?: string;
    occupation?: string;
    employer?: string;
    employment_type?: string;
    employment_duration_years?: number;
    credit_score?: number;
  };
}

export interface PaginationFilters {
  search: string;
  status: string | null;
  partnerId: string | null;
  documentsStatus: string | null;
  isQuickLead: boolean | null;
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
    documentsStatus: null,
    isQuickLead: null,
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

      // Phase 10: Fetch full lead data with ALL fields for completeness tooltips
      // Use explicit relationship hints due to multiple foreign keys
      const { data: fullLeads, error: leadsError } = await supabase
        .from('leads_new')
        .select(`
          *,
          student:students!leads_new_student_id_fkey(
            id, name, email, phone, postal_code,
            date_of_birth, gender, city, state,
            nationality, street_address, highest_qualification,
            tenth_percentage, twelfth_percentage,
            bachelors_percentage, bachelors_cgpa, credit_score
          ),
          partner:partners!leads_new_partner_id_fkey(id, name, partner_code),
          lender:lenders!leads_new_lender_id_fkey(id, name, code),
          co_applicant:co_applicants!leads_new_co_applicant_id_fkey(
            id, name, relationship, phone, email, salary, pin_code,
            occupation, employer, employment_type,
            employment_duration_years, credit_score
          )
        `)
        .in('id', leadIds)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // Map to preserve the order from search results
      let orderedLeads = leadIds.map((id: string) => 
        fullLeads?.find(l => l.id === id)
      ).filter(Boolean) as PaginatedLead[];

      // Apply client-side documents_status filter if set
      if (filters.documentsStatus) {
        orderedLeads = orderedLeads.filter(
          lead => lead.documents_status === filters.documentsStatus
        );
      }

      // Apply client-side quick lead filter if set (incomplete quick leads only)
      if (filters.isQuickLead === true) {
        orderedLeads = orderedLeads.filter(
          lead => lead.is_quick_lead === true && !lead.quick_lead_completed_at
        );
      }

      setLeads(orderedLeads);
    } catch (err) {
      console.error('Error fetching paginated leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filters.status, filters.partnerId, filters.documentsStatus, filters.isQuickLead, page, pageSize]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.partnerId, filters.documentsStatus, filters.isQuickLead]);

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
