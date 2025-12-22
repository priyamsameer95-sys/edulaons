import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { getCountryNameFromCode } from "@/utils/countryMapping";
import { University, isValidUUID } from "@/types/selection";

interface UseUniversitySelectionOptions {
  country: string;
  initialValue?: string;
}

interface UseUniversitySelectionReturn {
  // Data
  universities: University[];
  totalCount: number;
  
  // State
  loading: boolean;
  error: string | null;
  selectedUniversity: University | null;
  inputValue: string;
  isCustom: boolean;
  
  // Actions
  setInputValue: (value: string) => void;
  selectUniversity: (university: University) => void;
  setCustomValue: (value: string) => void;
  searchUniversities: (query: string) => University[];
  reset: () => void;
  refetch: () => void;
}

export function useUniversitySelection({
  country,
  initialValue,
}: UseUniversitySelectionOptions): UseUniversitySelectionReturn {
  const countryName = country ? getCountryNameFromCode(country) : '';
  
  const [inputValue, setInputValue] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [isCustom, setIsCustom] = useState(false);

  // Fetch universities
  const { data: universities = [], isLoading, error, refetch } = useQuery({
    queryKey: ['universities', countryName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .eq('country', countryName)
        .order('global_rank', { ascending: true, nullsFirst: false })
        .limit(1000);

      if (error) throw new Error(error.message);

      return (data || []).map((uni: any): University => ({
        id: uni.id,
        name: uni.name,
        country: uni.country,
        city: uni.city,
        qs_rank: uni.global_rank,
        popular: uni.global_rank ? uni.global_rank <= 100 : false,
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!countryName,
    retry: 2,
  });

  // Sort universities (popular first, then by rank, then alphabetically)
  const sortedUniversities = useMemo(() => {
    return [...universities].sort((a, b) => {
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      if (a.qs_rank && b.qs_rank) return a.qs_rank - b.qs_rank;
      if (a.qs_rank && !b.qs_rank) return -1;
      if (!a.qs_rank && b.qs_rank) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [universities]);

  // Handle initial value
  useEffect(() => {
    if (!initialValue) {
      setSelectedUniversity(null);
      setInputValue('');
      setIsCustom(false);
      return;
    }

    if (isValidUUID(initialValue)) {
      const university = sortedUniversities.find(u => u.id === initialValue);
      if (university) {
        setSelectedUniversity(university);
        setInputValue(university.name);
        setIsCustom(false);
      }
    } else {
      // Custom university name
      setSelectedUniversity(null);
      setInputValue(initialValue);
      setIsCustom(true);
    }
  }, [initialValue, sortedUniversities]);

  // Reset when country changes
  useEffect(() => {
    if (!country) {
      setInputValue('');
      setSelectedUniversity(null);
      setIsCustom(false);
    }
  }, [country]);

  // Search function
  const searchUniversities = useCallback((query: string): University[] => {
    if (!query.trim()) return sortedUniversities;
    
    const searchTerm = query.toLowerCase().trim();
    return sortedUniversities.filter(uni =>
      uni.name.toLowerCase().includes(searchTerm) ||
      uni.city.toLowerCase().includes(searchTerm)
    );
  }, [sortedUniversities]);

  // Select a university from the list
  const selectUniversity = useCallback((university: University) => {
    setSelectedUniversity(university);
    setInputValue(university.name);
    setIsCustom(false);
  }, []);

  // Set a custom value (not from list)
  const setCustomValue = useCallback((value: string) => {
    setSelectedUniversity(null);
    setInputValue(value);
    setIsCustom(true);
  }, []);

  // Reset selection
  const reset = useCallback(() => {
    setSelectedUniversity(null);
    setInputValue('');
    setIsCustom(false);
  }, []);

  return {
    universities: sortedUniversities,
    totalCount: sortedUniversities.length,
    loading: isLoading,
    error: error?.message || null,
    selectedUniversity,
    inputValue,
    isCustom,
    setInputValue,
    selectUniversity,
    setCustomValue,
    searchUniversities,
    reset,
    refetch,
  };
}
