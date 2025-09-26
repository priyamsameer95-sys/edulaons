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

export const useUniversities = (country: string) => {
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);

  const filteredUniversities = useMemo(() => {
    return universities
      .filter(uni => !country || uni.country.toLowerCase() === country.toLowerCase())
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
  }, [universities, country]);

  useEffect(() => {
    async function fetchUniversities() {
      setLoading(true);
      
      try {
        let query = supabase
          .from('universities')
          .select('*')
          .order('global_rank', { ascending: true, nullsFirst: false });

        if (country) {
          query = query.eq('country', country);
        }

        const { data, error } = await query.limit(1000);

        if (error) {
          console.error('Error fetching universities:', error);
          setUniversities([]);
        } else {
          const transformedData: University[] = (data || []).map((uni: any) => ({
            id: uni.id,
            name: uni.name,
            country: uni.country,
            city: uni.city,
            qs_rank: uni.global_rank,
            popular: uni.global_rank ? uni.global_rank <= 100 : false, // Top 100 are popular
          }));
          
          setUniversities(transformedData);
        }
      } catch (error) {
        console.error('Error in fetchUniversities:', error);
        setUniversities([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUniversities();
  }, [country]);

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