import { useState, useMemo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FilterConfig<T = any> {
  searchFields: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: Record<string, (item: T, value: any) => boolean>;
}

export const useTableFilters = <T>(data: T[], config: FilterConfig<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const matchesSearch = !searchTerm || config.searchFields.some(field => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
