// New types for the refactored database schema
export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: Date | null;
  nationality: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoApplicant {
  id: string;
  name: string;
  relationship: 'parent' | 'spouse' | 'sibling' | 'guardian' | 'other';
  salary: number;
  pin_code: string;
  phone: string | null;
  email: string | null;
  occupation: string | null;
  employer: string | null;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lender {
  id: string;
  name: string;
  code: string;
  description: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicTest {
  id: string;
  student_id: string;
  test_type: 'IELTS' | 'TOEFL' | 'PTE' | 'GRE' | 'GMAT' | 'SAT' | 'Other';
  score: string;
  test_date: Date | null;
  expiry_date: Date | null;
  certificate_number: string | null;
  created_at: string;
  updated_at: string;
}

// Extended lead status type matching 18-step process flow
export type LeadStatusType = 
  | 'new' | 'contacted' | 'in_progress' | 'document_review' | 'approved' | 'rejected' | 'withdrawn'
  | 'lead_intake' | 'first_contact' | 'lenders_mapped' | 'checklist_shared'
  | 'docs_uploading' | 'docs_submitted' | 'docs_verified' | 'logged_with_lender'
  | 'counselling_done' | 'pd_scheduled' | 'pd_completed' | 'additional_docs_pending'
  | 'property_verification' | 'credit_assessment' | 'sanctioned'
  | 'pf_pending' | 'pf_paid' | 'sanction_letter_issued'
  | 'docs_dispatched' | 'security_creation' | 'ops_verification' | 'disbursed';

export interface RefactoredLead {
  id: string;
  case_id: string;
  student_id: string;
  co_applicant_id: string;
  partner_id: string | null;
  lender_id: string;
  loan_amount: number;
  loan_type: 'secured' | 'unsecured';
  study_destination: 'Australia' | 'Canada' | 'Germany' | 'Ireland' | 'New Zealand' | 'UK' | 'USA' | 'Other';
  intake_month: number | null;
  intake_year: number | null;
  status: LeadStatusType;
  documents_status: 'pending' | 'uploaded' | 'verified' | 'rejected' | 'resubmission_required';
  is_quick_lead: boolean | null;
  quick_lead_completed_at: string | null;
  created_at: string;
  updated_at: string;
  
  // New TAT tracking fields
  lan_number?: string | null;
  sanction_amount?: number | null;
  sanction_date?: string | null;
  pd_call_scheduled_at?: string | null;
  pd_call_status?: 'scheduled' | 'completed' | 'rescheduled' | 'cancelled' | null;
  pf_amount?: number | null;
  pf_paid_at?: string | null;
  sanction_letter_date?: string | null;
  current_stage_started_at?: string | null;
  property_verification_status?: 'pending' | 'scheduled' | 'completed' | 'failed' | null;
  
  // Relations
  student?: Student;
  co_applicant?: CoApplicant;
  partner?: Partner;
  lender?: Lender;
  academic_tests?: AcademicTest[];
}

// Database row types (from Supabase)
export interface DbStudent {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  nationality: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRefactoredLead {
  id: string;
  case_id: string;
  student_id: string;
  co_applicant_id: string;
  partner_id: string | null;
  lender_id: string;
  loan_amount: string | number;
  loan_type: string;
  study_destination: string;
  intake_month: number | null;
  intake_year: number | null;
  status: string;
  documents_status: string;
  is_quick_lead: boolean | null;
  quick_lead_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Utility function to map database lead to frontend lead
export const mapDbRefactoredLeadToLead = (dbLead: DbRefactoredLead & {
  students?: DbStudent;
  co_applicants?: any;
  partners?: any;
  lenders?: any;
}): RefactoredLead => ({
  id: dbLead.id,
  case_id: dbLead.case_id,
  student_id: dbLead.student_id,
  co_applicant_id: dbLead.co_applicant_id,
  partner_id: dbLead.partner_id,
  lender_id: dbLead.lender_id,
  loan_amount: typeof dbLead.loan_amount === 'string' ? parseFloat(dbLead.loan_amount) : dbLead.loan_amount,
  loan_type: dbLead.loan_type as 'secured' | 'unsecured',
  study_destination: dbLead.study_destination as RefactoredLead['study_destination'],
  intake_month: dbLead.intake_month,
  intake_year: dbLead.intake_year,
  status: dbLead.status as RefactoredLead['status'],
  documents_status: dbLead.documents_status as RefactoredLead['documents_status'],
  is_quick_lead: dbLead.is_quick_lead,
  quick_lead_completed_at: dbLead.quick_lead_completed_at,
  created_at: dbLead.created_at,
  updated_at: dbLead.updated_at,
  student: dbLead.students ? {
    ...dbLead.students,
    date_of_birth: dbLead.students.date_of_birth ? new Date(dbLead.students.date_of_birth) : null
  } : undefined,
  co_applicant: dbLead.co_applicants,
  partner: dbLead.partners,
  lender: dbLead.lenders,
});