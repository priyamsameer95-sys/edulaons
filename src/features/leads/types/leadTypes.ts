import { User, GraduationCap, Users, CheckCircle } from "lucide-react";

export interface LeadFormData {
  student_name: string;
  student_phone: string;
  student_email: string;
  student_pin_code: string;
  student_dob: string;
  student_gender: string;
  qualification: string;
  country: string;
  universities: string[];
  course_type: string;
  intake_month: string;
  loan_type: 'secured' | 'unsecured' | '';
  amount_requested: string;
  co_applicant_name: string;
  co_applicant_email: string;
  co_applicant_phone: string;
  co_applicant_salary: string;
  co_applicant_employment_type: string;
  co_applicant_relationship: string;
  co_applicant_pin_code: string;
}

export type Step = 'student' | 'study' | 'co_applicant' | 'documents';

export const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'student', label: 'Student', icon: User },
  { id: 'study', label: 'Study Details', icon: GraduationCap },
  { id: 'co_applicant', label: 'Co-Applicant', icon: Users },
  { id: 'documents', label: 'Documents', icon: CheckCircle },
];

export const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia',
  'Germany', 'France', 'Netherlands', 'Singapore', 'Ireland', 'New Zealand'
];
