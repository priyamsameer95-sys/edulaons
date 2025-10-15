import { RefactoredLead } from '@/types/refactored-lead';
import { useTableFilters, FilterConfig } from './useTableFilters';

export const useLeadFiltering = (leads: RefactoredLead[]) => {
  const filterConfig: FilterConfig<RefactoredLead> = {
    searchFields: ['case_id', 'student_name', 'student_email'],
    filters: {
      partner: (lead, partnerId) => 
        !partnerId || partnerId === 'all' || lead.partner_id === partnerId,
      status: (lead, status) => 
        !status || status === 'all' || lead.status === status,
      lender: (lead, lenderId) => 
        !lenderId || lenderId === 'all' || lead.lender_id === lenderId,
      documentsStatus: (lead, docStatus) =>
        !docStatus || docStatus === 'all' || lead.documents_status === docStatus,
    }
  };

  return useTableFilters(leads, filterConfig);
};
