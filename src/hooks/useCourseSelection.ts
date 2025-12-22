import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Course, isValidUUID } from "@/types/selection";

interface UseCourseSelectionOptions {
  universityId?: string;
  initialValue?: string;
}

interface UseCourseSelectionReturn {
  // Data
  courses: Course[];
  groupedCourses: Record<string, Course[]>;
  totalCount: number;
  
  // State
  loading: boolean;
  error: string | null;
  selectedCourse: Course | null;
  inputValue: string;
  isCustom: boolean;
  isUniversityValid: boolean;
  
  // Actions
  setInputValue: (value: string) => void;
  selectCourse: (course: Course) => void;
  setCustomValue: (value: string) => void;
  searchCourses: (query: string) => Course[];
  reset: () => void;
  refetch: () => void;
}

export function useCourseSelection({
  universityId,
  initialValue,
}: UseCourseSelectionOptions): UseCourseSelectionReturn {
  const [inputValue, setInputValue] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  
  // Only fetch courses if we have a valid UUID for university
  const isUniversityValid = !!universityId && isValidUUID(universityId);

  // Fetch courses
  const { data: courses = [], isLoading, error, refetch } = useQuery({
    queryKey: ['courses', universityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('university_id', universityId)
        .order('program_name', { ascending: true })
        .limit(1000);

      if (error) throw new Error(error.message);

      return (data || []) as Course[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: isUniversityValid,
    retry: 2,
  });

  // Group courses by study level
  const groupedCourses = useMemo(() => {
    const groups: Record<string, Course[]> = {};
    courses.forEach(course => {
      const level = course.study_level || 'Other';
      if (!groups[level]) groups[level] = [];
      groups[level].push(course);
    });
    return groups;
  }, [courses]);

  // Handle initial value
  useEffect(() => {
    if (!initialValue) {
      setSelectedCourse(null);
      setInputValue('');
      setIsCustom(false);
      return;
    }

    if (isValidUUID(initialValue)) {
      const course = courses.find(c => c.id === initialValue);
      if (course) {
        setSelectedCourse(course);
        setInputValue(course.program_name);
        setIsCustom(false);
      }
    } else {
      // Custom course name
      setSelectedCourse(null);
      setInputValue(initialValue);
      setIsCustom(true);
    }
  }, [initialValue, courses]);

  // Search function
  const searchCourses = useCallback((query: string): Course[] => {
    if (!query.trim()) return courses;
    
    const searchTerm = query.toLowerCase().trim();
    return courses.filter(course =>
      course.program_name.toLowerCase().includes(searchTerm) ||
      course.degree.toLowerCase().includes(searchTerm) ||
      course.stream_name.toLowerCase().includes(searchTerm)
    );
  }, [courses]);

  // Select a course from the list
  const selectCourse = useCallback((course: Course) => {
    setSelectedCourse(course);
    setInputValue(course.program_name);
    setIsCustom(false);
  }, []);

  // Set a custom value (not from list)
  const setCustomValue = useCallback((value: string) => {
    setSelectedCourse(null);
    setInputValue(value);
    setIsCustom(true);
  }, []);

  // Reset selection
  const reset = useCallback(() => {
    setSelectedCourse(null);
    setInputValue('');
    setIsCustom(false);
  }, []);

  return {
    courses,
    groupedCourses,
    totalCount: courses.length,
    loading: isLoading,
    error: error?.message || null,
    selectedCourse,
    inputValue,
    isCustom,
    isUniversityValid,
    setInputValue,
    selectCourse,
    setCustomValue,
    searchCourses,
    reset,
    refetch,
  };
}
