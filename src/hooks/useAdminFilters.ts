import { useState, useCallback, useMemo } from 'react';
import { RefactoredLead } from '@/types/refactored-lead';

/**
 * Custom hook for managing Admin Dashboard filters and search
 * Handles partner selection, search term, lead selection for bulk operations
 * 
 * @param leads - Array of leads to filter
 * @returns Filter state, filtered leads, and filter management functions
 */
export const useAdminFilters = (leads: RefactoredLead[]) => {
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  /**
   * Filter leads based on search term
   * Searches across student name, email, case ID, and partner name
   */
  const filteredLeads = useMemo(() => {
    if (!searchTerm.trim()) {
      return leads;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    return leads.filter(lead => 
      lead.student?.name.toLowerCase().includes(lowercaseSearch) ||
      lead.student?.email.toLowerCase().includes(lowercaseSearch) ||
      lead.case_id.toLowerCase().includes(lowercaseSearch) ||
      lead.partner?.name.toLowerCase().includes(lowercaseSearch)
    );
  }, [leads, searchTerm]);

  /**
   * Toggle selection of a single lead
   */
  const handleSelectLead = useCallback((leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  }, []);

  /**
   * Toggle selection of all filtered leads
   */
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  }, [filteredLeads]);

  /**
   * Clear all selections
   */
  const clearSelections = useCallback(() => {
    setSelectedLeads([]);
  }, []);

  /**
   * Reset all filters to default state
   */
  const resetFilters = useCallback(() => {
    setSelectedPartner('all');
    setSearchTerm('');
    setSelectedLeads([]);
  }, []);

  return {
    // Filter state
    selectedPartner,
    searchTerm,
    selectedLeads,
    filteredLeads,
    
    // Filter setters
    setSelectedPartner,
    setSearchTerm,
    
    // Selection handlers
    handleSelectLead,
    handleSelectAll,
    clearSelections,
    resetFilters,
  };
};
