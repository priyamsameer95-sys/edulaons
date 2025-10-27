import { useMemo, useState } from 'react';
import { StudentApplication } from './useStudentApplications';

export type SortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low';
export type StatusFilter = 'all' | 'new' | 'in_progress' | 'approved' | 'rejected';

export const useApplicationSearch = (applications: StudentApplication[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const filteredAndSortedApplications = useMemo(() => {
    let result = [...applications];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(app => 
        app.case_id.toLowerCase().includes(search) ||
        app.study_destination.toLowerCase().includes(search) ||
        app.universities?.some(uni => uni.name.toLowerCase().includes(search))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(app => app.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'amount-high':
          return b.loan_amount - a.loan_amount;
        case 'amount-low':
          return a.loan_amount - b.loan_amount;
        default:
          return 0;
      }
    });

    return result;
  }, [applications, searchTerm, statusFilter, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || sortBy !== 'newest';

  return {
    filteredApplications: filteredAndSortedApplications,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    clearFilters,
    hasActiveFilters,
  };
};
