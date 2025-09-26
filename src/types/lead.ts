export interface Lead {
  id: string;
  case_id: string;
  student_name: string;
  student_phone: string;
  student_email?: string;
  student_pin_code?: string;
  country?: string;
  universities?: string[];
  primary_university?: string;
  intake_month?: string; // "YYYY-MM" format or number
  loan_type: string;
  amount_requested?: number;
  loan_amount: number;
  status: string;
  sub_status?: string;
  lender: string;
  docs_verified?: number;
  docs_required?: number;
  updated_at: string;
  created_at: string;
  study_destination: string;
  intake_year?: number;
  co_applicant_name: string;
  co_applicant_salary: number;
  co_applicant_relationship: string;
  co_applicant_pin: string;
  documents_status: string;
  // Test scores (optional)
  gmat_score?: number;
  gre_score?: number;
  toefl_score?: number;
  pte_score?: number;
  ielts_score?: number;
}

// Database lead type (matches Supabase schema)
export interface DbLead {
  id: string;
  case_id: string;
  student_name: string;
  student_phone: string;
  student_email?: string;
  student_dob?: string;
  test_type?: string;
  test_score?: string;
  lender: string;
  loan_type: string;
  loan_amount: number;
  study_destination: string;
  intake_month?: number;
  intake_year?: number;
  co_applicant_name: string;
  co_applicant_salary: number;
  co_applicant_relationship: string;
  co_applicant_pin: string;
  status: string;
  documents_status: string;
  created_at: string;
  updated_at: string;
}

// Utility function to map database lead to display lead
export const mapDbLeadToLead = (dbLead: DbLead): Lead => ({
  ...dbLead,
  amount_requested: dbLead.loan_amount,
  country: dbLead.study_destination,
  student_pin_code: '000000', // Default since not in current schema
  universities: [],
  primary_university: dbLead.study_destination,
  intake_month: dbLead.intake_month && dbLead.intake_year ? 
    `${dbLead.intake_year}-${String(dbLead.intake_month).padStart(2, '0')}` : '',
  docs_verified: 0, // Default since not in current schema  
  docs_required: 5, // Default since not in current schema
});