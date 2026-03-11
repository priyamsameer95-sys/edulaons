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
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahrain', 'Bangladesh',
  'Belarus', 'Belgium', 'Bosnia & Herzegovina', 'Brazil', 'Brunei', 'Bulgaria', 'Canada',
  'Chile', 'China (Mainland)', 'Colombia', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czechia', 'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'Estonia', 'Ethiopia',
  'Finland', 'France', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Honduras',
  'Hong Kong SAR', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan',
  'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Luxembourg', 'Macau SAR', 'Malaysia', 'Malta',
  'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Nigeria', 'Northern Cyprus', 'Norway',
  'Oman', 'Pakistan', 'Palestine', 'Panama', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Puerto Rico', 'Qatar', 'Romania', 'Russia', 'Saudi Arabia', 'Serbia',
  'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka',
  'Sudan', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Thailand', 'Tunisia', 'Türkiye',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
  'Uzbekistan', 'Venezuela', 'Vietnam', 'Other'
];
