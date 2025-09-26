import { supabase } from "@/integrations/supabase/client";

// University data import script
export async function importUniversityData() {
  console.log('Starting university data import...');
  
  // Sample data based on the uploaded Excel file structure
  const universityData = [
    { 
      name: 'Massachusetts Institute of Technology (MIT)', 
      country: 'United States', 
      city: 'Cambridge', 
      global_rank: 1, 
      score: 100.0, 
      url: 'https://www.topuniversities.com/universities/massachusetts-institute-technology-mit' 
    },
    { 
      name: 'Imperial College London', 
      country: 'United Kingdom', 
      city: 'London', 
      global_rank: 2, 
      score: 99.4, 
      url: 'https://www.topuniversities.com/universities/imperial-college-london' 
    },
    { 
      name: 'Stanford University', 
      country: 'United States', 
      city: 'Stanford', 
      global_rank: 3, 
      score: 98.9, 
      url: 'https://www.topuniversities.com/universities/stanford-university' 
    },
    { 
      name: 'University of Oxford', 
      country: 'United Kingdom', 
      city: 'Oxford', 
      global_rank: 4, 
      score: 97.9, 
      url: 'https://www.topuniversities.com/universities/university-oxford' 
    },
    { 
      name: 'Harvard University', 
      country: 'United States', 
      city: 'Cambridge', 
      global_rank: 5, 
      score: 97.7, 
      url: 'https://www.topuniversities.com/universities/harvard-university' 
    },
    { 
      name: 'University of Cambridge', 
      country: 'United Kingdom', 
      city: 'Cambridge', 
      global_rank: 6, 
      score: 97.2, 
      url: 'https://www.topuniversities.com/universities/university-cambridge' 
    },
    { 
      name: 'ETH Zurich', 
      country: 'Switzerland', 
      city: 'Zürich', 
      global_rank: 7, 
      score: 96.7, 
      url: 'https://www.topuniversities.com/universities/eth-zurich' 
    },
    { 
      name: 'National University of Singapore (NUS)', 
      country: 'Singapore', 
      city: 'Singapore', 
      global_rank: 8, 
      score: 95.9, 
      url: 'https://www.topuniversities.com/universities/national-university-singapore-nus' 
    },
    { 
      name: 'UCL', 
      country: 'United Kingdom', 
      city: 'London', 
      global_rank: 9, 
      score: 95.8, 
      url: 'https://www.topuniversities.com/universities/ucl' 
    },
    { 
      name: 'California Institute of Technology (Caltech)', 
      country: 'United States', 
      city: 'Pasadena', 
      global_rank: 10, 
      score: 94.3, 
      url: 'https://www.topuniversities.com/universities/california-institute-technology-caltech' 
    },
    // Add more universities here from the Excel data...
  ];

  try {
    const { data, error } = await supabase
      .from('universities')
      .insert(universityData)
      .select();

    if (error) {
      console.error('Error importing universities:', error);
      throw error;
    }

    console.log(`Successfully imported ${data?.length} universities`);
    return data;
  } catch (error) {
    console.error('Failed to import university data:', error);
    throw error;
  }
}

// Course data import script  
export async function importCourseData() {
  console.log('Starting course data import...');

  // First, get all universities to create name-to-id mapping
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

  // Sample course data based on the CSV structure
  const courseData = [
    {
      university_name: 'Massachusetts Institute of Technology (MIT)',
      degree: 'MBA',
      stream_name: 'Others',
      program_name: 'Executive MBA',
      study_level: 'MBA',
      course_intensity: 'Full Time',
      study_mode: 'On Campus',
      program_duration: '20 Months',
      tuition_fees: null,
      starting_month: null
    },
    {
      university_name: 'Imperial College London',
      degree: 'Bachelor',
      stream_name: 'Business and Management',
      program_name: 'BSc Economics, Finance and Data Science',
      study_level: 'Bachelors',
      course_intensity: 'Full Time',
      study_mode: 'On Campus',
      program_duration: '36 Months',
      tuition_fees: '40700 GBP',
      starting_month: 'Oct'
    },
    {
      university_name: 'Imperial College London',
      degree: 'Bachelor',
      stream_name: 'Engineering and Technology',
      program_name: 'BEng Computing',
      study_level: 'Bachelors',
      course_intensity: 'Full Time',
      study_mode: 'On Campus',
      program_duration: '36 Months',
      tuition_fees: '43300 GBP',
      starting_month: 'Oct'
    },
    // Add more courses from the CSV data...
  ];

  // Prepare courses with university IDs
  const coursesWithIds = courseData
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

  try {
    const { data, error } = await supabase
      .from('courses')
      .insert(coursesWithIds)
      .select();

    if (error) {
      console.error('Error importing courses:', error);
      throw error;
    }

    console.log(`Successfully imported ${data?.length} courses`);
    return data;
  } catch (error) {
    console.error('Failed to import course data:', error);
    throw error;
  }
}

// Main import function
export async function runDataImport() {
  try {
    console.log('🚀 Starting data import process...');
    
    // Import universities first
    await importUniversityData();
    
    // Then import courses (requires universities to exist)
    await importCourseData();
    
    console.log('✅ Data import completed successfully!');
  } catch (error) {
    console.error('❌ Data import failed:', error);
    throw error;
  }
}

// Export for direct use in console
(window as any).runDataImport = runDataImport;
(window as any).importUniversityData = importUniversityData;
(window as any).importCourseData = importCourseData;

console.log('Data import functions loaded. Run runDataImport() in console to start.');