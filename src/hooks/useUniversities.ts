import { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  qs_rank: number | null;
  popular: boolean;
}

// Map study destination codes to database country names
const COUNTRY_MAPPING: Record<string, string> = {
  'USA': 'United States',
  'UK': 'United Kingdom',
  'Canada': 'Canada',
  'Australia': 'Australia',
  'Germany': 'Germany',
  'Ireland': 'Ireland',
  'New Zealand': 'New Zealand',
  'Other': 'Other'
};

export const useUniversities = (country: string) => {
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  
  // Map the country code to actual database country name
  const dbCountryName = COUNTRY_MAPPING[country] || country;

  const filteredUniversities = useMemo(() => {
    return universities
      .filter(uni => !dbCountryName || uni.country.toLowerCase() === dbCountryName.toLowerCase())
      .sort((a, b) => {
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
  }, [universities, dbCountryName]);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    async function fetchUniversities() {
      setLoading(true);
      
      try {
        let query = supabase
          .from('universities')
          .select('*')
          .order('global_rank', { ascending: true, nullsFirst: false });

        if (dbCountryName) {
          query = query.eq('country', dbCountryName);
        }

        const { data, error } = await query.limit(1000);

        // Check if component unmounted or country changed
        if (abortController.signal.aborted || !isMounted) return;

        if (error) {
          console.error('Error fetching universities:', error);
          if (isMounted) setUniversities([]);
        } else {
          const transformedData: University[] = (data || []).map((uni: any) => ({
            id: uni.id,
            name: uni.name,
            country: uni.country,
            city: uni.city,
            qs_rank: uni.global_rank,
            popular: uni.global_rank ? uni.global_rank <= 100 : false, // Top 100 are popular
          }));
          
          if (isMounted) setUniversities(transformedData);
        }
      } catch (error) {
        if (abortController.signal.aborted || !isMounted) return;
        console.error('Error in fetchUniversities:', error);
        if (isMounted) setUniversities([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchUniversities();

    return () => {
      abortController.abort();
      isMounted = false;
    };
  }, [dbCountryName]);

  const searchUniversities = (query: string) => {
    if (!query.trim()) return filteredUniversities;
    
    const searchTerm = query.toLowerCase().trim();
    return filteredUniversities.filter(uni => 
      uni.name.toLowerCase().includes(searchTerm) ||
      uni.city.toLowerCase().includes(searchTerm)
    );
  };

  return {
    universities: filteredUniversities,
    loading,
    searchUniversities,
    totalCount: filteredUniversities.length
  };
};