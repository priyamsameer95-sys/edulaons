/**
 * Student Permissions Constants
 * 
 * Defines which fields are visible/editable to students
 * Per Knowledge Base: Student can view/edit only whitelisted fields
 */

// Fields students can see on their lead
export const STUDENT_VISIBLE_LEAD_FIELDS = [
  'case_id',
  'status',
  'loan_amount',
  'loan_type',
  'study_destination',
  'intake_month',
  'intake_year',
  'documents_status',
  'created_at',
  'updated_at',
] as const;

// Fields students can edit (only before certain statuses)
export const STUDENT_EDITABLE_LEAD_FIELDS = [
  'loan_amount', // Only before doc_review
] as const;

// Fields that must NEVER be shown to students
export const STUDENT_HIDDEN_LEAD_FIELDS = [
  'partner_id',
  'lender_id',
  'target_lender_id',
  'eligibility_score',
  'eligibility_result',
  'case_complexity',
  'pf_amount',
  'pf_paid_at',
  'sanction_amount',
  'sanction_date',
  'sanction_letter_date',
  'property_verification_status',
  'pd_call_scheduled_at',
  'pd_call_status',
  'loan_config_updated_at',
  'loan_config_updated_by',
  'created_by_user_id',
  'created_by_role',
] as const;

// Student visible fields on their own profile
export const STUDENT_VISIBLE_PROFILE_FIELDS = [
  'id',
  'name',
  'email',
  'phone',
  'date_of_birth',
  'gender',
  'nationality',
  'street_address',
  'city',
  'state',
  'postal_code',
  'country',
  'highest_qualification',
  'tenth_percentage',
  'twelfth_percentage',
  'bachelors_percentage',
  'bachelors_cgpa',
] as const;

// Student editable profile fields
export const STUDENT_EDITABLE_PROFILE_FIELDS = [
  'name',
  'date_of_birth',
  'gender',
  'street_address',
  'city',
  'state',
  'postal_code',
  'highest_qualification',
  'tenth_percentage',
  'twelfth_percentage',
  'bachelors_percentage',
  'bachelors_cgpa',
] as const;

// Student hidden profile fields
export const STUDENT_HIDDEN_PROFILE_FIELDS = [
  'credit_score',
  'pin_code_tier',
  'invite_token',
  'invite_sent_at',
  'email_invite_sent',
  'otp_enabled',
  'is_activated',
  'activated_at',
] as const;

// Student-friendly status labels (maps internal status to student-safe labels)
export const STUDENT_STATUS_LABELS: Record<string, string> = {
  'new': 'Application Received',
  'in_progress': 'Under Review',
  'doc_review': 'Documents Under Review',
  'doc_pending': 'Additional Documents Required',
  'bank_login': 'Sent to Lender',
  'bank_processing': 'Lender Processing',
  'pd_scheduled': 'Verification Scheduled',
  'pd_complete': 'Verification Complete',
  'approved': 'Loan Approved! 🎉',
  'disbursed': 'Loan Disbursed',
  'rejected': 'Application Unsuccessful',
  'on_hold': 'Application On Hold',
  'withdrawn': 'Application Withdrawn',
};

// Statuses after which students cannot edit lead data
export const STUDENT_EDIT_LOCKED_STATUSES = [
  'doc_review',
  'bank_login',
  'bank_processing',
  'pd_scheduled',
  'pd_complete',
  'approved',
  'disbursed',
  'rejected',
  'withdrawn',
] as const;

// Document statuses visible to students
export const STUDENT_DOCUMENT_STATUS_LABELS: Record<string, string> = {
  'pending': 'Upload Required',
  'uploaded': 'Submitted',
  'verified': 'Verified ✓',
  'rejected': 'Re-upload Required',
  'resubmission_required': 'Re-upload Required',
};

export type StudentVisibleLeadField = typeof STUDENT_VISIBLE_LEAD_FIELDS[number];
export type StudentEditableLeadField = typeof STUDENT_EDITABLE_LEAD_FIELDS[number];
export type StudentVisibleProfileField = typeof STUDENT_VISIBLE_PROFILE_FIELDS[number];
