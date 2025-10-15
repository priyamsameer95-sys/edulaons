import { useState, useMemo } from 'react';

export interface FilterConfig<T = any> {
  searchFields: string[];
  filters: Record<string, (item: T, value: any) => boolean>;
}

export const useTableFilters = <T>(data: T[], config: FilterConfig<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const matchesSearch = !searchTerm || config.searchFields.some(field => {
        const value = (item as any)[field];
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });

      // Active filters
      const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
        const filterFn = config.filters[key];
        return !filterFn || filterFn(item, value);
      });

      return matchesSearch && matchesFilters;
    });
  }, [data, searchTerm, activeFilters, config]);

  const setFilter = (key: string, value: any) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setActiveFilters({});
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return {
    filteredData,
    searchTerm,
    setSearchTerm,
    activeFilters,
    setFilter,
    clearFilters,
    clearSearch
  };
};
