/**
 * Helper functions for student application data transformation
 */
import type { StudentApplicationData, EdgeFunctionPayload } from '@/types/student-application';

/**
 * Clean phone number - remove +91 prefix and non-digits
 */
export const cleanPhoneNumber = (phone: string): string => {
  return phone.trim().replace(/^\+91/, '').replace(/\D/g, '');
};

/**
 * Validate if a string is a UUID
 */
export const isUUID = (str: string): boolean => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
};

/**
 * Separate university UUIDs from custom names
 */
export const separateUniversities = (universities: string[]) => {
  const uuids: string[] = [];
  const custom: string[] = [];
  
  universities.forEach(uni => {
    if (isUUID(uni)) {
      uuids.push(uni);
    } else {
      custom.push(uni);
    }
  });
  
  return { uuids, custom };
};

/**
 * Clean and filter test scores - remove empty or invalid entries
 */
export const cleanTestScores = (tests?: Array<any>) => {
  if (!tests || !Array.isArray(tests)) return undefined;
  
  const cleaned = tests.filter(test => 
    test.testType && 
    test.testScore && 
    test.testScore > 0
  );
  
  return cleaned.length > 0 ? cleaned : undefined;
};

/**
 * Clean and filter universities - remove empty or whitespace-only strings
 */
export const cleanUniversities = (universities?: string[]) => {
  if (!universities || !Array.isArray(universities)) return [];
  
  const cleaned = universities.filter(uni => uni && uni.trim().length > 0);
  
  return cleaned;
};

/**
 * Transform application data to edge function payload
 */
export const transformToEdgeFunctionPayload = (
  data: StudentApplicationData,
  userEmail: string
): EdgeFunctionPayload => {
  return {
    // Student fields - prefer form email over auth email
    student_name: data.name.trim(),
    student_email: data.email?.trim() || userEmail,
    student_phone: cleanPhoneNumber(data.phone),
    student_pin_code: data.postalCode.trim(),
    date_of_birth: data.dateOfBirth,
    gender: data.gender,
    city: data.city,
    state: data.state,
    nationality: data.nationality,
    
    // Academic fields
    highest_qualification: data.highestQualification,
    tenth_percentage: data.tenthPercentage,
    twelfth_percentage: data.twelfthPercentage,
    bachelors_percentage: data.bachelorsPercentage,
    bachelors_cgpa: data.bachelorsCgpa,
    tests: cleanTestScores(data.tests),
    
    // Study fields
    universities: cleanUniversities(data.universities),
    country: data.studyDestination, // Send country code directly (UK, USA, etc.)
    course_name: data.courseName,
    loan_type: data.loanType,
    intake_month: data.intakeMonth,
    intake_year: data.intakeYear,
    amount_requested: data.loanAmount,
    
    // Co-applicant fields
    co_applicant_name: data.coApplicantName.trim(),
    co_applicant_relationship: data.coApplicantRelationship,
    co_applicant_phone: cleanPhoneNumber(data.coApplicantPhone),
    co_applicant_email: data.coApplicantEmail.trim(),
    co_applicant_monthly_salary: data.coApplicantMonthlySalary,
    co_applicant_employment_type: data.coApplicantEmploymentType,
    co_applicant_occupation: data.coApplicantOccupation,
    co_applicant_employer: data.coApplicantEmployer,
    co_applicant_employment_duration: data.coApplicantEmploymentDuration,
    co_applicant_pin_code: data.coApplicantPinCode.trim(),
    
    // Optional credit scores
    student_credit_score: data.creditScore,
    co_applicant_credit_score: data.coApplicantCreditScore,
  };
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (currentStep: number, totalSteps: number): number => {
  return Math.round(((currentStep + 1) / totalSteps) * 100);
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format currency in lakhs
 */
export const formatLakhs = (amount: number): string => {
  const lakhs = amount / 100000;
  return `₹${lakhs.toFixed(2)} Lakhs`;
};

/**
 * Get intake display string
 */
export const formatIntake = (month: number, year: number): string => {
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  return `${monthName} ${year}`;
};
