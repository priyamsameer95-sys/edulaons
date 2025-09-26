import { supabase } from "@/integrations/supabase/client";
import { parseUniversityData, parseCourseData, importUniversities, importCourses, type UniversityData, type CourseData } from "@/utils/dataImport";
import Papa from 'papaparse';

// Load and parse the university CSV data
async function loadUniversityData(): Promise<UniversityData[]> {
  try {
    console.log('Loading university data from CSV file...');
    
    // Fetch the comprehensive CSV file
    const response = await fetch('/src/data/University_Level_data-3.csv');
    const csvText = await response.text();
    
    // Parse CSV
    const result = Papa.parse(csvText, {
      skipEmptyLines: true,
      header: false
    });
    
    console.log(`Loaded ${result.data.length - 1} universities from CSV file`);
    return parseUniversityData(result.data as string[][]);
  } catch (error) {
    console.error('Error loading university data from CSV:', error);
    throw error; // No fallback - we should fix the CSV loading issue instead
  }
}

// Load and parse the course CSV data
async function loadCourseData(): Promise<CourseData[]> {
  try {
    console.log('Loading course data from CSV file...');
    
    // Fetch the CSV file
    const response = await fetch('/src/data/Program_level_combined_output-4.csv');
    const csvText = await response.text();
    
    // Parse CSV
    const result = Papa.parse(csvText, {
      skipEmptyLines: true,
      header: false
    });
    
    console.log(`Loaded ${result.data.length - 1} courses from CSV file`);
    return parseCourseData(result.data as string[][]);
  } catch (error) {
    console.error('Error loading course data from CSV:', error);
    throw error; // No fallback - courses will be imported separately
  }
}

// University data import script
export async function importUniversityData() {
  console.log('Starting university data import...');
  
  try {
    const universityData = await loadUniversityData();
    return await importUniversities(universityData);
  } catch (error) {
    console.error('Failed to import university data:', error);
    throw error;
  }
}

// Course data import script  
export async function importCourseData() {
  console.log('Starting course data import...');
  
  try {
    const courseData = await loadCourseData();
    return await importCourses(courseData);
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

console.log('🌟 University Import Script Loaded');
console.log('📚 Ready to import 1,474 universities from comprehensive dataset');
console.log('🚀 Run importUniversityData() in console to start importing all universities');
console.log('💡 Or run runDataImport() to import both universities and courses');