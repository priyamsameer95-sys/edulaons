import { supabase } from "@/integrations/supabase/client";
import { parseUniversityData, parseCourseData, importUniversities, importCourses, type UniversityData, type CourseData } from "@/utils/dataImport";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Load and parse the university Excel data
async function loadUniversityData(): Promise<UniversityData[]> {
  try {
    console.log('Loading university data from Excel file...');
    
    // Fetch the Excel file
    const response = await fetch('/src/data/University_Level_data-2.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    
    // Parse Excel file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to array of arrays
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    console.log(`Loaded ${rawData.length - 1} universities from Excel file`);
    return parseUniversityData(rawData);
  } catch (error) {
    console.error('Error loading university data from Excel:', error);
    console.log('Falling back to sample data...');
    
    // Fallback to sample data including Canadian universities
    const sampleData = [
      ['Rank', 'Score', 'Link', 'Name', 'Location'],
      ['1', '100.0', 'https://www.topuniversities.com/universities/massachusetts-institute-technology-mit', 'Massachusetts Institute of Technology (MIT)', 'Cambridge, United States'],
      ['2', '97.2', 'https://www.topuniversities.com/universities/university-cambridge', 'University of Cambridge', 'Cambridge, United Kingdom'],
      ['3', '96.7', 'https://www.topuniversities.com/universities/eth-zurich', 'ETH Zurich', 'Zurich, Switzerland'],
      ['4', '93.9', 'https://www.topuniversities.com/universities/university-toronto', 'University of Toronto', 'Toronto, Canada'],
      ['5', '93.7', 'https://www.topuniversities.com/universities/university-british-columbia', 'University of British Columbia', 'Vancouver, Canada'],
      ['6', '93.2', 'https://www.topuniversities.com/universities/mcgill-university', 'McGill University', 'Montreal, Canada'],
      ['7', '91.8', 'https://www.topuniversities.com/universities/university-montreal', 'Université de Montréal', 'Montreal, Canada'],
      ['8', '90.5', 'https://www.topuniversities.com/universities/university-waterloo', 'University of Waterloo', 'Waterloo, Canada'],
      ['9', '89.2', 'https://www.topuniversities.com/universities/university-alberta', 'University of Alberta', 'Edmonton, Canada'],
      ['10', '88.7', 'https://www.topuniversities.com/universities/university-calgary', 'University of Calgary', 'Calgary, Canada'],
      ['11', '87.3', 'https://www.topuniversities.com/universities/queens-university-kingston', 'Queen\'s University at Kingston', 'Kingston, Canada'],
      ['12', '86.9', 'https://www.topuniversities.com/universities/university-ottawa', 'University of Ottawa', 'Ottawa, Canada'],
      ['13', '85.1', 'https://www.topuniversities.com/universities/dalhousie-university', 'Dalhousie University', 'Halifax, Canada'],
      ['14', '84.7', 'https://www.topuniversities.com/universities/university-western-ontario', 'Western University', 'London, Canada'],
      ['15', '83.2', 'https://www.topuniversities.com/universities/simon-fraser-university', 'Simon Fraser University', 'Burnaby, Canada'],
    ];
    
    return parseUniversityData(sampleData);
  }
}

// Load and parse the course CSV data
async function loadCourseData(): Promise<CourseData[]> {
  try {
    console.log('Loading course data from CSV file...');
    
    // Fetch the CSV file
    const response = await fetch('/src/data/Program_level_combined_output-2.csv');
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
    console.log('Falling back to sample data...');
    
    // Fallback to sample data including Canadian courses
    const sampleData = [
      ['University', '', 'Degree', 'Stream', 'Program Name', 'Study Level', 'Course Intensity', 'Study Mode', 'Duration', 'Tuition Fees', 'Starting Month'],
      ['University of Toronto', '', 'Bachelor', 'Engineering and Technology', 'Computer Science', 'Bachelors', 'Full Time', 'On Campus', '48 Months', '58160 CAD', 'Sep'],
      ['University of British Columbia', '', 'Master', 'Business and Management', 'Master of Business Administration', 'Masters', 'Full Time', 'On Campus', '20 Months', '65000 CAD', 'Sep'],
      ['McGill University', '', 'Bachelor', 'Medicine and Health', 'Bachelor of Medicine', 'Bachelors', 'Full Time', 'On Campus', '48 Months', '25000 CAD', 'Sep'],
      ['University of Toronto', '', 'Master', 'Engineering and Technology', 'Master of Engineering', 'Masters', 'Full Time', 'On Campus', '16 Months', '45000 CAD', 'Sep'],
      ['University of British Columbia', '', 'Bachelor', 'Natural Sciences', 'Bachelor of Science', 'Bachelors', 'Full Time', 'On Campus', '48 Months', '40000 CAD', 'Sep'],
      ['McGill University', '', 'Master', 'Business and Management', 'MBA', 'Masters', 'Full Time', 'On Campus', '20 Months', '55000 CAD', 'Sep'],
      ['University of Waterloo', '', 'Bachelor', 'Engineering and Technology', 'Software Engineering', 'Bachelors', 'Full Time', 'On Campus', '48 Months', '35000 CAD', 'Sep'],
      ['Queen\'s University at Kingston', '', 'Master', 'Business and Management', 'Master of Management', 'Masters', 'Full Time', 'On Campus', '12 Months', '50000 CAD', 'Sep'],
    ];
    
    return parseCourseData(sampleData);
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

console.log('Data import functions loaded. Run runDataImport() in console to start.');