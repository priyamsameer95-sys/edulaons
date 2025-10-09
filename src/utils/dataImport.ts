import { supabase } from "@/integrations/supabase/client";

export interface UniversityData {
  name: string;
  country: string;
  city: string;
  global_rank?: number;
  score?: number;
  url?: string;
}

export interface CourseData {
  university_name: string;
  degree: string;
  stream_name: string;
  program_name: string;
  study_level: string;
  course_intensity?: string;
  study_mode?: string;
  program_duration?: string;
  tuition_fees?: string;
  starting_month?: string;
}

// Parse university data from the CSV format: Global_Rank,score,name,city,country
export function parseUniversityData(rawData: string[][]): UniversityData[] {
  const universities: UniversityData[] = [];
  
  // Skip header row, start from index 1
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (row.length >= 5) {
      const [rankStr, scoreStr, name, city, country] = row;
      
      // Handle rank ranges like "711-720" or "1001-1200" - take the first number
      let globalRank: number | undefined;
      if (rankStr && rankStr.trim()) {
        const rankMatch = rankStr.trim().match(/^\d+/);
        globalRank = rankMatch ? parseInt(rankMatch[0]) : undefined;
      }
      
      universities.push({
        name: name?.trim() || '',
        country: country?.trim() || '',
        city: city?.trim() || '',
        global_rank: globalRank,
        score: scoreStr && scoreStr.trim() ? parseFloat(scoreStr.trim()) : undefined,
        url: undefined, // URL not provided in new CSV format
      });
    }
  }
  
  return universities;
}

// Parse course data from the CSV format
export function parseCourseData(rawData: string[][]): CourseData[] {
  const courses: CourseData[] = [];
  
  // Skip header row, start from index 1
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (row.length >= 10) {
      const [
        university_name,
        , // empty column
        degree,
        stream_name,
        program_name,
        study_level,
        course_intensity,
        study_mode,
        program_duration,
        tuition_fees,
        starting_month,
      ] = row;
      
      if (university_name && degree && stream_name && program_name && study_level) {
        // Clean stream_name by removing count numbers like "(1)" at the end
        const cleanStreamName = stream_name.replace(/\s*\(\d+\)\s*$/, '').trim();
        
        courses.push({
          university_name: university_name.trim(),
          degree: degree.trim(),
          stream_name: cleanStreamName,
          program_name: program_name.trim(),
          study_level: study_level.trim(),
          course_intensity: course_intensity?.trim(),
          study_mode: study_mode?.trim(),
          program_duration: program_duration?.trim(),
          tuition_fees: tuition_fees?.trim(),
          starting_month: starting_month?.trim(),
        });
      }
    }
  }
  
  return courses;
}

// Import universities to Supabase
export async function importUniversities(universities: UniversityData[]) {
  console.log(`Importing ${universities.length} universities...`);
  
  const batchSize = 1000;
  const results = [];
  
  for (let i = 0; i < universities.length; i += batchSize) {
    const batch = universities.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('universities')
      .insert(batch)
      .select('id, name');
    
    if (error) {
      console.error(`Error importing universities batch ${i}:`, error);
      throw error;
    }
    
    results.push(...(data || []));
    console.log(`Imported ${Math.min(i + batchSize, universities.length)}/${universities.length} universities`);
  }
  
  return results;
}

// Import courses to Supabase
export async function importCourses(courses: CourseData[]) {
  console.log(`Importing ${courses.length} courses...`);
  
  // First, get all universities to create a name-to-id mapping
  const { data: universities, error: univError } = await supabase
    .from('universities')
    .select('id, name');
  
  if (univError) {
    console.error('Error fetching universities:', univError);
    throw univError;
  }
  
  const universityMap = new Map<string, string>();
  universities?.forEach(univ => {
    universityMap.set(univ.name, univ.id);
  });
  
  // Prepare courses with university IDs
  const coursesWithIds = courses
    .map(course => {
      const universityId = universityMap.get(course.university_name);
      if (!universityId) {
        console.warn(`University not found: ${course.university_name}`);
        return null;
      }
      
      return {
        university_id: universityId,
        degree: course.degree,
        stream_name: course.stream_name,
        program_name: course.program_name,
        study_level: course.study_level,
        course_intensity: course.course_intensity,
        study_mode: course.study_mode,
        program_duration: course.program_duration,
        tuition_fees: course.tuition_fees,
        starting_month: course.starting_month,
      };
    })
    .filter(Boolean) as any[];
  
  console.log(`Matched ${coursesWithIds.length}/${courses.length} courses to universities`);
  
  const batchSize = 1000;
  const results = [];
  
  for (let i = 0; i < coursesWithIds.length; i += batchSize) {
    const batch = coursesWithIds.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('courses')
      .insert(batch)
      .select('id, program_name');
    
    if (error) {
      console.error(`Error importing courses batch ${i}:`, error);
      throw error;
    }
    
    results.push(...(data || []));
    console.log(`Imported ${Math.min(i + batchSize, coursesWithIds.length)}/${coursesWithIds.length} courses`);
  }
  
  return results;
}