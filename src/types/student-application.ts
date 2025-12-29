/**
 * Centralized types for student application flow
 */

export type TestType = 'IELTS' | 'TOEFL' | 'GRE' | 'GMAT' | 'PTE' | 'SAT';
export type LoanType = 'secured' | 'unsecured';
export type CourseType = 'masters_stem' | 'bachelors_stem' | 'mba_management' | 'others';
export type Relationship = 'parent' | 'spouse' | 'sibling' | 'guardian' | 'other';
export type EmploymentType = 'salaried' | 'self_employed' | 'business_owner';
export type HighestQualification = 'phd' | 'masters' | 'bachelors' | 'diploma' | '12th';

export interface TestScore {
  testType: TestType;
  testScore: number;
  testCertificateNumber?: string;
  testDate?: string;
}

export interface PersonalDetails {
  name: string;
  phone: string;
  email?: string; // Email for communication
  dateOfBirth: string;
  gender?: string;
  city?: string;
  state?: string;
  postalCode: string;
  nationality: string;
  creditScore?: number; // Optional CIBIL score (300-900)
  phoneVerified?: boolean; // Flag to indicate phone was verified via OTP
}

export interface AcademicBackground {
  highestQualification: HighestQualification;
  tenthPercentage?: number;
  twelfthPercentage?: number;
  bachelorsPercentage?: number;
  bachelorsCgpa?: number;
  mastersPercentage?: number;
  mastersCgpa?: number;
  tests?: TestScore[];
}

export interface StudyDetails {
  universities: string[];
  studyDestination: string;
  courseName?: string;
  courseType?: CourseType;
  selectedCourseId?: string; // Link to courses table
  loanType: LoanType;
  intakeMonth: number;
  intakeYear: number;
  loanAmount: number;
}

export interface CoApplicantDetails {
  coApplicantName: string;
  coApplicantRelationship: Relationship;
  coApplicantPhone: string;
  coApplicantEmail: string;
  coApplicantMonthlySalary: number;
  coApplicantEmploymentType: EmploymentType;
  coApplicantOccupation?: string;
  coApplicantEmployer?: string;
  coApplicantEmploymentDuration?: number;
  coApplicantPinCode: string;
  coApplicantCreditScore?: number; // Optional CIBIL score (300-900)
}

export interface StudentApplicationData 
  extends PersonalDetails, 
          AcademicBackground, 
          StudyDetails, 
          CoApplicantDetails {}

export interface ApplicationStep {
  id: number;
  title: string;
  description: string;
  isComplete: (data: Partial<StudentApplicationData>) => boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface EdgeFunctionPayload {
  // Student fields
  student_name: string;
  student_email: string;
  student_phone: string;
  student_pin_code: string;
  date_of_birth?: string;
  gender?: string;
  city?: string;
  state?: string;
  nationality: string;
  
  // Academic fields
  highest_qualification: string;
  tenth_percentage?: number;
  twelfth_percentage?: number;
  bachelors_percentage?: number;
  bachelors_cgpa?: number;
  tests?: TestScore[];
  
  // Study fields
  universities: string[];
  country: string;
  course_name?: string;
  course_type?: CourseType;
  loan_type: LoanType;
  intake_month: number;
  intake_year: number;
  amount_requested: number;
  
  // Co-applicant fields
  co_applicant_name: string;
  co_applicant_relationship: Relationship;
  co_applicant_phone: string;
  co_applicant_email: string;
  co_applicant_monthly_salary: number;
  co_applicant_employment_type: EmploymentType;
  co_applicant_occupation?: string;
  co_applicant_employer?: string;
  co_applicant_employment_duration?: number;
  co_applicant_pin_code: string;
  
  // Optional credit scores
  student_credit_score?: number;
  co_applicant_credit_score?: number;
}
