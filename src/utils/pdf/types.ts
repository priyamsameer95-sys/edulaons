/**
 * PDF Generation Types
 * 
 * Shared types for the PDF generation module.
 */

import type { LeadCompletionField } from '@/utils/leadCompletionSchema';

export interface StudentData {
  name: string;
  phone: string;
  email?: string;
  postal_code?: string;
  city?: string;
  state?: string;
  date_of_birth?: string;
  highest_qualification?: string;
  tenth_percentage?: number;
  twelfth_percentage?: number;
  bachelors_cgpa?: number;
  bachelors_percentage?: number;
  credit_score?: number;
  gender?: string;
  street_address?: string;
  nationality?: string;
}

export interface CoApplicantData {
  name: string;
  relationship: string;
  salary: number;
  phone?: string;
  email?: string;
  pin_code?: string;
  occupation?: string;
  employer?: string;
  employment_type?: string;
  employment_duration_years?: number;
  credit_score?: number;
  monthly_salary?: number;
}

export interface TestScore {
  test_type: string;
  score: string;
  test_date?: string;
  expiry_date?: string;
}

export interface StatusHistoryRecord {
  new_status: string;
  created_at: string;
  changed_by?: string;
}

export interface LeadData {
  id: string;
  case_id: string;
  student?: StudentData;
  co_applicant?: CoApplicantData;
  loan_amount: number;
  loan_type: string;
  loan_classification?: string;
  lender?: {
    name: string;
    code?: string;
  };
  partner?: {
    name: string;
    partner_code: string;
  };
  study_destination: string;
  intake_month?: number;
  intake_year?: number;
  status: string;
  created_at: string;
  test_scores?: TestScore[];
  status_history?: StatusHistoryRecord[];
  sanction_amount?: number;
  sanction_date?: string;
}

export interface LeadUniversity {
  name: string;
  city: string;
  country: string;
}

export interface LeadDocument {
  id: string;
  document_type_id: string;
  original_filename: string;
  file_path: string;
  verification_status?: string;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
  ai_validation_status?: string;
  uploaded_at?: string;
  document_types?: {
    name: string;
    category: string;
    required?: boolean;
  } | null;
}

export interface PDFField {
  label: string;
  value: string;
}

export interface PDFColors {
  primaryBlue: readonly [number, number, number];
  lightBlue: readonly [number, number, number];
  darkGray: readonly [number, number, number];
  black: readonly [number, number, number];
  gray: readonly [number, number, number];
  lightGray: readonly [number, number, number];
  green: readonly [number, number, number];
  amber: readonly [number, number, number];
  red: readonly [number, number, number];
  white: readonly [number, number, number];
}
