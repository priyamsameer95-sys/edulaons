import { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  program_name: string;
  stream_name: string;
  degree: string;
  study_level: string;
  tuition_fees: string | null;
  program_duration: string | null;
  study_mode: string | null;
  course_intensity: string | null;
  starting_month: string | null;
  university_id: string;
}

export const useCourses = (universityIds: string[], studyLevel?: string, stream?: string) => {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    async function fetchCourses() {
      if (!universityIds || universityIds.length === 0) {
        setCourses([]);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        let query = supabase
          .from('courses')
          .select('*')
          .in('university_id', universityIds)
          .order('program_name', { ascending: true });

        if (studyLevel) {
          query = query.eq('study_level', studyLevel);
        }

        if (stream) {
          query = query.eq('stream_name', stream);
        }

        const { data, error: fetchError } = await query.limit(500);

        if (abortController.signal.aborted || !isMounted) return;

        if (fetchError) {
          console.error('Error fetching courses:', fetchError);
          setError(fetchError.message);
          if (isMounted) setCourses([]);
        } else {
          if (isMounted) setCourses(data || []);
        }
      } catch (err: any) {
        if (abortController.signal.aborted || !isMounted) return;
        console.error('Error in fetchCourses:', err);
        setError(err.message);
        if (isMounted) setCourses([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCourses();

    return () => {
      abortController.abort();
      isMounted = false;
    };
  }, [universityIds.join(','), studyLevel, stream]);

  const searchCourses = useMemo(() => {
    return (query: string) => {
      if (!query.trim()) return courses;
      
      const searchTerm = query.toLowerCase().trim();
      return courses.filter(course => 
        course.program_name.toLowerCase().includes(searchTerm) ||
        course.stream_name.toLowerCase().includes(searchTerm) ||
        course.degree.toLowerCase().includes(searchTerm)
      );
    };
  }, [courses]);

  return {
    courses,
    loading,
    error,
    searchCourses,
    totalCount: courses.length
  };
};
