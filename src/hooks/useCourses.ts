import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  program_name: string;
  degree: string;
  study_level: string;
  stream_name: string;
  program_duration: string;
  tuition_fees: string;
  starting_month: string;
  study_mode: string;
  course_intensity: string;
  university_id: string;
}

export const useCourses = (universityId?: string) => {
  const { data: courses = [], isLoading, error, refetch } = useQuery({
    queryKey: ['courses', universityId],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select('*')
        .order('program_name', { ascending: true });

      if (universityId) {
        query = query.eq('university_id', universityId);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw new Error(error.message);

      return (data || []) as Course[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!universityId,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const groupedCourses = useMemo(() => {
    const groups: Record<string, Course[]> = {};
    courses.forEach(course => {
      const level = course.study_level || 'Other';
      if (!groups[level]) groups[level] = [];
      groups[level].push(course);
    });
    return groups;
  }, [courses]);

  const searchCourses = (query: string) => {
    if (!query.trim()) return courses;
    
    const searchTerm = query.toLowerCase().trim();
    return courses.filter(course => 
      course.program_name.toLowerCase().includes(searchTerm) ||
      course.degree.toLowerCase().includes(searchTerm) ||
      course.stream_name.toLowerCase().includes(searchTerm)
    );
  };

  return {
    courses,
    groupedCourses,
    loading: isLoading,
    error: error?.message || null,
    searchCourses,
    totalCount: courses.length,
    refetch,
  };
};
