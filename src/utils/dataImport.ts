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

// Clean stream name by removing count numbers like "(23)" at the end
function cleanStreamName(streamName: string): string {
  if (!streamName) return '';
  return streamName.replace(/\s*\(\d+\)\s*$/, '').trim();
}

// Parse course data from the CSV format with robust multiline handling
export function parseCourseData(rawData: string[][]): CourseData[] {
  const courses: CourseData[] = [];
  const seenCourses = new Set<string>(); // Deduplication
  
  // Skip header row, start from index 1
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Skip empty rows
    if (!row || row.length === 0 || !row[0]) continue;
    
    // Handle both 10 and 11 column formats
    if (row.length >= 10) {
      const [
        university_name,
        , // empty column (column index 1)
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
      
      // Validate required fields
      if (!university_name?.trim() || !degree?.trim() || !stream_name?.trim() || 
          !program_name?.trim() || !study_level?.trim()) {
        continue;
      }
      
      // Clean and normalize data
      const cleanedUniversityName = university_name.trim();
      const cleanedDegree = degree.trim();
      const cleanedStreamName = cleanStreamName(stream_name);
      const cleanedProgramName = program_name.trim();
      const cleanedStudyLevel = study_level.trim();
      
      // Create unique key for deduplication
      const courseKey = `${cleanedUniversityName}|${cleanedProgramName}|${cleanedStudyLevel}|${cleanedDegree}`;
      
      // Skip duplicates
      if (seenCourses.has(courseKey)) {
        continue;
      }
      
      seenCourses.add(courseKey);
      
      courses.push({
        university_name: cleanedUniversityName,
        degree: cleanedDegree,
        stream_name: cleanedStreamName,
        program_name: cleanedProgramName,
        study_level: cleanedStudyLevel,
        course_intensity: course_intensity?.trim() || undefined,
        study_mode: study_mode?.trim() || undefined,
        program_duration: program_duration?.trim() || undefined,
        tuition_fees: tuition_fees?.trim() || undefined,
        starting_month: starting_month?.trim() || undefined,
      });
    }
  }
  
  console.log(`Parsed ${courses.length} unique courses from ${rawData.length - 1} rows`);
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

// Import courses to Supabase with optimized batching and error handling
export async function importCourses(courses: CourseData[], onProgress?: (progress: number, status: string) => void) {
  console.log(`Starting import of ${courses.length} courses...`);
  onProgress?.(0, 'Fetching universities...');
  
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
    universityMap.set(univ.name.trim().toLowerCase(), univ.id);
  });
  
  console.log(`Loaded ${universityMap.size} universities into memory`);
  onProgress?.(5, `Mapping ${courses.length} courses to universities...`);
  
  // Prepare courses with university IDs and track unmatched
  const unmatchedUniversities = new Set<string>();
  const coursesWithIds = courses
    .map(course => {
      const universityId = universityMap.get(course.university_name.trim().toLowerCase());
      if (!universityId) {
        unmatchedUniversities.add(course.university_name);
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
  
  console.log(`✅ Matched ${coursesWithIds.length}/${courses.length} courses to universities`);
  if (unmatchedUniversities.size > 0) {
    console.warn(`⚠️ ${unmatchedUniversities.size} universities not found in database:`, 
      Array.from(unmatchedUniversities).slice(0, 10).join(', '));
  }
  
  onProgress?.(10, `Importing ${coursesWithIds.length} courses in batches...`);
  
  const batchSize = 500; // Reduced for better reliability
  const results = [];
  const errors = [];
  
  for (let i = 0; i < coursesWithIds.length; i += batchSize) {
    const batch = coursesWithIds.slice(i, i + batchSize);
    const progress = 10 + Math.floor((i / coursesWithIds.length) * 85);
    const currentBatch = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(coursesWithIds.length / batchSize);
    
    onProgress?.(progress, `Importing batch ${currentBatch}/${totalBatches} (${i + batch.length}/${coursesWithIds.length} courses)...`);
    
    try {
      const { data, error } = await supabase
        .from('courses')
        .upsert(batch, { 
          onConflict: 'university_id,program_name,study_level,degree',
          ignoreDuplicates: true 
        })
        .select('id, program_name');
      
      if (error) {
        console.error(`❌ Error importing batch ${currentBatch}:`, error);
        errors.push({ batch: currentBatch, error: error.message });
        // Continue with next batch instead of throwing
      } else {
        results.push(...(data || []));
        console.log(`✅ Batch ${currentBatch}/${totalBatches} complete: ${data?.length || 0} courses`);
      }
    } catch (err) {
      console.error(`❌ Exception in batch ${currentBatch}:`, err);
      errors.push({ batch: currentBatch, error: String(err) });
    }
    
    // Small delay to avoid rate limiting
    if (i + batchSize < coursesWithIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  onProgress?.(95, 'Finalizing import...');
  
  console.log('\n=== Import Summary ===');
  console.log(`✅ Successfully imported: ${results.length} courses`);
  console.log(`⚠️ Unmatched universities: ${unmatchedUniversities.size}`);
  console.log(`❌ Errors encountered: ${errors.length}`);
  
  if (errors.length > 0) {
    console.warn('Error details:', errors);
  }
  
  onProgress?.(100, `Import complete! ${results.length} courses imported.`);
  
  return {
    success: results.length,
    total: courses.length,
    matched: coursesWithIds.length,
    errors: errors.length,
    unmatchedUniversities: Array.from(unmatchedUniversities),
  };
}