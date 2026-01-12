import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { getCountryNameFromCode } from "@/utils/countryMapping";

interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  qs_rank: number | null;
  popular: boolean;
}

export const useUniversities = (country: string) => {
  // The country parameter may already be the full name (e.g., "United States") 
  // or a code (e.g., "US"). Try to normalize.
  const countryName = country ? getCountryNameFromCode(country) : '';
  
  // DEBUG: Log what we're querying (dev only)
  if (import.meta.env.DEV) {
    console.log('[useUniversities] input:', country, '→ resolved:', countryName);
  }

  const { data: universities = [], isLoading, error, refetch } = useQuery({
    queryKey: ['universities', countryName],
    queryFn: async () => {
      if (import.meta.env.DEV) {
        console.log('[useUniversities] fetching for country:', countryName);
      }
      
      let query = supabase
        .from('universities')
        .select('*')
        .order('global_rank', { ascending: true, nullsFirst: false });

      if (countryName) {
        query = query.eq('country', countryName);
      }

      const { data, error } = await query.limit(1000);

      if (error) {
        console.error('[useUniversities] query error:', error.message);
        throw new Error(error.message);
      }
      
      if (import.meta.env.DEV) {
        console.log('[useUniversities] fetched', data?.length || 0, 'universities');
      }

      return (data || []).map((uni: any) => ({
        id: uni.id,
        name: uni.name,
        country: uni.country,
        city: uni.city,
        qs_rank: uni.global_rank,
        popular: uni.global_rank ? uni.global_rank <= 100 : false,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    enabled: !!countryName, // Only fetch if country is selected
    retry: 2, // Retry twice on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Sort universities
  const sortedUniversities = useMemo(() => {
    return [...universities].sort((a, b) => {
      // Popular universities first, then by QS rank (lower is better)
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      
      // Both popular or both not popular, sort by rank
      if (a.qs_rank && b.qs_rank) return a.qs_rank - b.qs_rank;
      if (a.qs_rank && !b.qs_rank) return -1;
      if (!a.qs_rank && b.qs_rank) return 1;
      
      // Both have no rank, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [universities]);


  const searchUniversities = (query: string) => {
    if (!query.trim()) return sortedUniversities;
    
    const searchTerm = query.toLowerCase().trim();
    return sortedUniversities.filter(uni => 
      uni.name.toLowerCase().includes(searchTerm) ||
      uni.city.toLowerCase().includes(searchTerm)
    );
  };

  return {
    universities: sortedUniversities,
    loading: isLoading,
    error: error?.message || null,
    searchUniversities,
    totalCount: sortedUniversities.length,
    refetch,
  };
};