import { supabase } from "@/integrations/supabase/client";

// Sample university data to import directly
const universityData = [
  { name: 'Massachusetts Institute of Technology (MIT)', country: 'United States', city: 'Cambridge', rank: 1, score: 100.0, url: 'https://www.topuniversities.com/universities/massachusetts-institute-technology-mit' },
  { name: 'University of Cambridge', country: 'United Kingdom', city: 'Cambridge', rank: 2, score: 97.2, url: 'https://www.topuniversities.com/universities/university-cambridge' },
  { name: 'ETH Zurich', country: 'Switzerland', city: 'Zurich', rank: 3, score: 96.7, url: 'https://www.topuniversities.com/universities/eth-zurich' },
  { name: 'University of Toronto', country: 'Canada', city: 'Toronto', rank: 4, score: 93.9, url: 'https://www.topuniversities.com/universities/university-toronto' },
  { name: 'University of British Columbia', country: 'Canada', city: 'Vancouver', rank: 5, score: 93.7, url: 'https://www.topuniversities.com/universities/university-british-columbia' },
  { name: 'McGill University', country: 'Canada', city: 'Montreal', rank: 6, score: 93.2, url: 'https://www.topuniversities.com/universities/mcgill-university' },
  { name: 'Université de Montréal', country: 'Canada', city: 'Montreal', rank: 7, score: 91.8, url: 'https://www.topuniversities.com/universities/university-montreal' },
  { name: 'University of Waterloo', country: 'Canada', city: 'Waterloo', rank: 8, score: 90.5, url: 'https://www.topuniversities.com/universities/university-waterloo' },
  { name: 'University of Alberta', country: 'Canada', city: 'Edmonton', rank: 9, score: 89.2, url: 'https://www.topuniversities.com/universities/university-alberta' },
  { name: 'University of Calgary', country: 'Canada', city: 'Calgary', rank: 10, score: 88.7, url: 'https://www.topuniversities.com/universities/university-calgary' },
  { name: 'Queen\'s University at Kingston', country: 'Canada', city: 'Kingston', rank: 11, score: 87.3, url: 'https://www.topuniversities.com/universities/queens-university-kingston' },
  { name: 'University of Ottawa', country: 'Canada', city: 'Ottawa', rank: 12, score: 86.9, url: 'https://www.topuniversities.com/universities/university-ottawa' },
  { name: 'Dalhousie University', country: 'Canada', city: 'Halifax', rank: 13, score: 85.1, url: 'https://www.topuniversities.com/universities/dalhousie-university' },
  { name: 'Western University', country: 'Canada', city: 'London', rank: 14, score: 84.7, url: 'https://www.topuniversities.com/universities/university-western-ontario' },
  { name: 'Simon Fraser University', country: 'Canada', city: 'Burnaby', rank: 15, score: 83.2, url: 'https://www.topuniversities.com/universities/simon-fraser-university' }
];

// Import universities
async function importUniversitiesNow() {
  console.log('Importing universities...');
  
  const { data, error } = await supabase
    .from('universities')
    .insert(universityData)
    .select();
    
  if (error) {
    console.error('Error importing universities:', error);
    return;
  }
  
  console.log('Universities imported successfully:', data?.length);
  
  // Now import courses
  const courseData = [
    { university_id: data![0].id, degree: 'Bachelor', stream_name: 'Engineering and Technology', program_name: 'Computer Science', study_level: 'Bachelors', course_intensity: 'Full Time', study_mode: 'On Campus', program_duration: '48 Months', tuition_fees: '58160 USD', starting_month: 'Sep' },
    { university_id: data![1].id, degree: 'Master', stream_name: 'Business and Management', program_name: 'Master of Business Administration', study_level: 'Masters', course_intensity: 'Full Time', study_mode: 'On Campus', program_duration: '20 Months', tuition_fees: '65000 GBP', starting_month: 'Sep' },
    { university_id: data![3].id, degree: 'Bachelor', stream_name: 'Medicine and Health', program_name: 'Bachelor of Medicine', study_level: 'Bachelors', course_intensity: 'Full Time', study_mode: 'On Campus', program_duration: '48 Months', tuition_fees: '25000 CAD', starting_month: 'Sep' },
    { university_id: data![3].id, degree: 'Master', stream_name: 'Engineering and Technology', program_name: 'Master of Engineering', study_level: 'Masters', course_intensity: 'Full Time', study_mode: 'On Campus', program_duration: '16 Months', tuition_fees: '45000 CAD', starting_month: 'Sep' },
    { university_id: data![4].id, degree: 'Bachelor', stream_name: 'Natural Sciences', program_name: 'Bachelor of Science', study_level: 'Bachelors', course_intensity: 'Full Time', study_mode: 'On Campus', program_duration: '48 Months', tuition_fees: '40000 CAD', starting_month: 'Sep' },
    { university_id: data![5].id, degree: 'Master', stream_name: 'Business and Management', program_name: 'MBA', study_level: 'Masters', course_intensity: 'Full Time', study_mode: 'On Campus', program_duration: '20 Months', tuition_fees: '55000 CAD', starting_month: 'Sep' },
    { university_id: data![7].id, degree: 'Bachelor', stream_name: 'Engineering and Technology', program_name: 'Software Engineering', study_level: 'Bachelors', course_intensity: 'Full Time', study_mode: 'On Campus', program_duration: '48 Months', tuition_fees: '35000 CAD', starting_month: 'Sep' },
    { university_id: data![10].id, degree: 'Master', stream_name: 'Business and Management', program_name: 'Master of Management', study_level: 'Masters', course_intensity: 'Full Time', study_mode: 'On Campus', program_duration: '12 Months', tuition_fees: '50000 CAD', starting_month: 'Sep' }
  ];
  
  const { data: courseResult, error: courseError } = await supabase
    .from('courses')
    .insert(courseData);
    
  if (courseError) {
    console.error('Error importing courses:', courseError);
  } else {
    console.log('Courses imported successfully');
  }
}

// Run immediately
importUniversitiesNow();

console.log('Direct import script loaded and running...');