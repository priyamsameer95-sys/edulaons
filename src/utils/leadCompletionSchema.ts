/**
 * Lead Completion Schema
 * 
 * SINGLE SOURCE OF TRUTH for required/optional fields.
 * Used by:
 * - Lead Queue tooltip (Missing Required Fields)
 * - Complete Lead Modal (form validation + display)
 * - Completeness % calculation
 * 
 * Rules:
 * - Co-applicant fields are required ONLY if co-applicant exists and is not a placeholder
 * - Student PIN code is always required
 * - Salary is required for co-applicant (needed for loan eligibility)
 */

export interface LeadCompletionField {
  key: string;                           // Unique key for the field
  path: string;                          // Dot notation path in lead object (for reading value)
  displayName: string;                   // Human-readable label
  section: 'student' | 'study' | 'co_applicant' | 'lead';
  isRequired: boolean;                   // Base required status
  isConditionallyRequired?: boolean;     // True if requirement depends on other fields
  conditionDescription?: string;         // Description of when field is required
  formFieldKey?: string;                 // Key used in form state (if different from path)
  isEditable?: boolean;                  // Whether this field is editable in Complete Lead form
}

// Student required fields
const STUDENT_REQUIRED_FIELDS: LeadCompletionField[] = [
  { 
    key: 'student_name', 
    path: 'student.name', 
    displayName: 'Student Name', 
    section: 'student', 
    isRequired: true 
  },
  { 
    key: 'student_phone', 
    path: 'student.phone', 
    displayName: 'Student Phone', 
    section: 'student', 
    isRequired: true 
  },
  { 
    key: 'student_email', 
    path: 'student.email', 
    displayName: 'Student Email', 
    section: 'student', 
    isRequired: true 
  },
  { 
    key: 'student_postal_code', 
    path: 'student.postal_code', 
    displayName: 'Student PIN Code', 
    section: 'student', 
    isRequired: true,
    formFieldKey: 'studentPinCode',
    isEditable: true
  },
];

// Study details required fields
const STUDY_REQUIRED_FIELDS: LeadCompletionField[] = [
  { 
    key: 'study_destination', 
    path: 'study_destination', 
    displayName: 'Study Destination', 
    section: 'study', 
    isRequired: true 
  },
  { 
    key: 'loan_amount', 
    path: 'loan_amount', 
    displayName: 'Loan Amount', 
    section: 'study', 
    isRequired: true 
  },
  { 
    key: 'intake_month', 
    path: 'intake_month', 
    displayName: 'Intake Month', 
    section: 'study', 
    isRequired: true 
  },
  { 
    key: 'intake_year', 
    path: 'intake_year', 
    displayName: 'Intake Year', 
    section: 'study', 
    isRequired: true 
  },
];

// Co-applicant fields - conditionally required when co-applicant exists
const CO_APPLICANT_REQUIRED_FIELDS: LeadCompletionField[] = [
  { 
    key: 'co_applicant_name', 
    path: 'co_applicant.name', 
    displayName: 'Co-Applicant Name', 
    section: 'co_applicant', 
    isRequired: true,
    isConditionallyRequired: true,
    conditionDescription: 'Required when co-applicant exists',
    formFieldKey: 'coApplicantName',
    isEditable: true
  },
  { 
    key: 'co_applicant_relationship', 
    path: 'co_applicant.relationship', 
    displayName: 'Relationship', 
    section: 'co_applicant', 
    isRequired: true,
    isConditionallyRequired: true,
    conditionDescription: 'Required when co-applicant exists',
    formFieldKey: 'coApplicantRelationship',
    isEditable: true
  },
  { 
    key: 'co_applicant_phone', 
    path: 'co_applicant.phone', 
    displayName: 'Co-Applicant Phone', 
    section: 'co_applicant', 
    isRequired: true,
    isConditionallyRequired: true,
    conditionDescription: 'Required when co-applicant exists',
    formFieldKey: 'coApplicantPhone',
    isEditable: true
  },
  { 
    key: 'co_applicant_salary', 
    path: 'co_applicant.salary', 
    displayName: 'Co-Applicant Salary', 
    section: 'co_applicant', 
    isRequired: true,
    isConditionallyRequired: true,
    conditionDescription: 'Required for loan eligibility calculation',
    formFieldKey: 'coApplicantSalary',
    isEditable: true
  },
  { 
    key: 'co_applicant_pin_code', 
    path: 'co_applicant.pin_code', 
    displayName: 'Co-Applicant PIN Code', 
    section: 'co_applicant', 
    isRequired: true,
    isConditionallyRequired: true,
    conditionDescription: 'Required when co-applicant exists',
    formFieldKey: 'coApplicantPinCode',
    isEditable: true
  },
];

// Optional fields (for completeness % but not blocking)
const OPTIONAL_FIELDS: LeadCompletionField[] = [
  { 
    key: 'student_dob', 
    path: 'student.date_of_birth', 
    displayName: 'Date of Birth', 
    section: 'student', 
    isRequired: false,
    formFieldKey: 'studentDob',
    isEditable: true
  },
  { 
    key: 'student_gender', 
    path: 'student.gender', 
    displayName: 'Gender', 
    section: 'student', 
    isRequired: false,
    formFieldKey: 'studentGender',
    isEditable: true
  },
  { 
    key: 'student_city', 
    path: 'student.city', 
    displayName: 'City', 
    section: 'student', 
    isRequired: false,
    formFieldKey: 'studentCity',
    isEditable: true
  },
  { 
    key: 'student_state', 
    path: 'student.state', 
    displayName: 'State', 
    section: 'student', 
    isRequired: false,
    formFieldKey: 'studentState',
    isEditable: true
  },
  // Phase 9: New student optional fields
  { 
    key: 'student_nationality', 
    path: 'student.nationality', 
    displayName: 'Nationality', 
    section: 'student', 
    isRequired: false,
    formFieldKey: 'studentNationality',
    isEditable: true
  },
  { 
    key: 'student_street_address', 
    path: 'student.street_address', 
    displayName: 'Street Address', 
    section: 'student', 
    isRequired: false,
    formFieldKey: 'studentStreetAddress',
    isEditable: true
  },
  { 
    key: 'student_highest_qualification', 
    path: 'student.highest_qualification', 
    displayName: 'Highest Qualification', 
    section: 'student', 
    isRequired: false,
    formFieldKey: 'studentHighestQualification',
    isEditable: true
  },
  { 
    key: 'student_tenth_percentage', 
    path: 'student.tenth_percentage', 
    displayName: '10th Percentage', 
    section: 'student', 
    isRequired: false,
    formFieldKey: 'studentTenthPercentage',
    isEditable: true
  },
  { 
    key: 'student_twelfth_percentage', 
    path: 'student.twelfth_percentage', 
    displayName: '12th Percentage', 
    section: 'student', 
    isRequired: false,
    formFieldKey: 'studentTwelfthPercentage',
    isEditable: true
  },
  { 
    key: 'student_bachelors_percentage', 
    path: 'student.bachelors_percentage', 
    displayName: "Bachelor's Percentage", 
    section: 'student', 
    isRequired: false,
    formFieldKey: 'studentBachelorsPercentage',
    isEditable: true
  },
  { 
    key: 'student_bachelors_cgpa', 
    path: 'student.bachelors_cgpa', 
    displayName: "Bachelor's CGPA", 
    section: 'student', 
    isRequired: false,
    formFieldKey: 'studentBachelorsCgpa',
    isEditable: true
  },
  { 
    key: 'student_credit_score', 
    path: 'student.credit_score', 
    displayName: 'Student Credit Score', 
    section: 'student', 
    isRequired: false,
    formFieldKey: 'studentCreditScore',
    isEditable: true
  },
  { 
    key: 'loan_type', 
    path: 'loan_type', 
    displayName: 'Loan Type', 
    section: 'study', 
    isRequired: false 
  },
  { 
    key: 'co_applicant_email', 
    path: 'co_applicant.email', 
    displayName: 'Co-Applicant Email', 
    section: 'co_applicant', 
    isRequired: false,
    isConditionallyRequired: true,
    formFieldKey: 'coApplicantEmail',
    isEditable: true
  },
  { 
    key: 'co_applicant_occupation', 
    path: 'co_applicant.occupation', 
    displayName: 'Co-Applicant Occupation', 
    section: 'co_applicant', 
    isRequired: false,
    isConditionallyRequired: true,
    formFieldKey: 'coApplicantOccupation',
    isEditable: true
  },
  { 
    key: 'co_applicant_employer', 
    path: 'co_applicant.employer', 
    displayName: 'Co-Applicant Employer', 
    section: 'co_applicant', 
    isRequired: false,
    isConditionallyRequired: true,
    formFieldKey: 'coApplicantEmployer',
    isEditable: true
  },
  { 
    key: 'co_applicant_employment_type', 
    path: 'co_applicant.employment_type', 
    displayName: 'Employment Type', 
    section: 'co_applicant', 
    isRequired: false,
    isConditionallyRequired: true,
    formFieldKey: 'coApplicantEmploymentType',
    isEditable: true
  },
  { 
    key: 'co_applicant_employment_duration', 
    path: 'co_applicant.employment_duration_years', 
    displayName: 'Employment Duration', 
    section: 'co_applicant', 
    isRequired: false,
    isConditionallyRequired: true,
    formFieldKey: 'coApplicantEmploymentDuration',
    isEditable: true
  },
  // Phase 9: New co-applicant optional field
  { 
    key: 'co_applicant_credit_score', 
    path: 'co_applicant.credit_score', 
    displayName: 'Co-Applicant Credit Score', 
    section: 'co_applicant', 
    isRequired: false,
    isConditionallyRequired: true,
    formFieldKey: 'coApplicantCreditScore',
    isEditable: true
  },
  { 
    key: 'partner_id', 
    path: 'partner_id', 
    displayName: 'Partner Assignment', 
    section: 'lead', 
    isRequired: false 
  },
];

// Export all field definitions
export const LEAD_COMPLETION_FIELDS = {
  student: STUDENT_REQUIRED_FIELDS,
  study: STUDY_REQUIRED_FIELDS,
  coApplicant: CO_APPLICANT_REQUIRED_FIELDS,
  optional: OPTIONAL_FIELDS,
};

// Get all required fields (base + co-applicant when applicable)
export function getRequiredFields(hasCoApplicant: boolean): LeadCompletionField[] {
  const baseRequired = [...STUDENT_REQUIRED_FIELDS, ...STUDY_REQUIRED_FIELDS];
  
  if (hasCoApplicant) {
    return [...baseRequired, ...CO_APPLICANT_REQUIRED_FIELDS];
  }
  
  return baseRequired;
}

// Get all optional fields
export function getOptionalFields(hasCoApplicant: boolean): LeadCompletionField[] {
  if (hasCoApplicant) {
    return OPTIONAL_FIELDS;
  }
  // Exclude co-applicant optional fields if no co-applicant
  return OPTIONAL_FIELDS.filter(f => f.section !== 'co_applicant');
}

/**
 * Check if a lead has a valid co-applicant (not a placeholder)
 */
export function hasValidCoApplicant(lead: {
  co_applicant?: {
    name?: string | null;
    salary?: number | null;
    relationship?: string | null;
  } | null;
  co_applicant_id?: string | null;
}): boolean {
  // Must have a co_applicant_id
  if (!lead.co_applicant_id) return false;
  
  // If co_applicant data exists, check if it's not a placeholder
  if (lead.co_applicant) {
    const name = lead.co_applicant.name;
    // Placeholder check: "Co-Applicant" is the default placeholder name
    if (!name || name === 'Co-Applicant' || name.trim() === '') {
      // Check if there's any real data (salary or relationship set)
      const hasSalary = lead.co_applicant.salary && lead.co_applicant.salary > 0;
      const hasRelationship = lead.co_applicant.relationship && lead.co_applicant.relationship !== '';
      
      // If has salary or relationship, it's a real co-applicant even with placeholder name
      return hasSalary || hasRelationship;
    }
    return true;
  }
  
  // Has co_applicant_id but no co_applicant data loaded - assume it exists
  return true;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Check if a value is considered "filled"
 */
function isFieldFilled(value: any, fieldKey: string): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  
  // Special cases for placeholder values
  if (fieldKey === 'student_postal_code' || fieldKey === 'co_applicant_pin_code') {
    // "000000" is a placeholder PIN code
    if (value === '000000' || value === 0) return false;
  }
  
  if (fieldKey === 'co_applicant_name') {
    // "Co-Applicant" is a placeholder name
    if (value === 'Co-Applicant') return false;
  }
  
  if (fieldKey === 'co_applicant_salary') {
    // 0 is not a valid salary
    if (typeof value === 'number' && value === 0) return false;
  }
  
  return true;
}

export interface MissingFieldResult {
  key: string;
  displayName: string;
  section: LeadCompletionField['section'];
  isRequired: boolean;
  formFieldKey?: string;
  isEditable?: boolean;
}

export interface LeadCompletionResult {
  missingRequired: MissingFieldResult[];
  missingOptional: MissingFieldResult[];
  completenessScore: number;
  isComplete: boolean;
  totalFields: number;
  filledFields: number;
  hasCoApplicant: boolean;
}

/**
 * Calculate missing fields for a lead
 * This is the SINGLE SOURCE OF TRUTH used by tooltip and form
 */
export function getLeadMissingFields(lead: {
  student?: any;
  co_applicant?: any;
  co_applicant_id?: string | null;
  [key: string]: any;
}): LeadCompletionResult {
  const hasCoApp = hasValidCoApplicant(lead);
  const requiredFields = getRequiredFields(hasCoApp);
  const optionalFields = getOptionalFields(hasCoApp);
  
  const missingRequired: MissingFieldResult[] = [];
  const missingOptional: MissingFieldResult[] = [];
  
  // Check required fields
  for (const field of requiredFields) {
    const value = getNestedValue(lead, field.path);
    if (!isFieldFilled(value, field.key)) {
      missingRequired.push({
        key: field.key,
        displayName: field.displayName,
        section: field.section,
        isRequired: true,
        formFieldKey: field.formFieldKey,
        isEditable: field.isEditable,
      });
    }
  }
  
  // Check optional fields
  for (const field of optionalFields) {
    const value = getNestedValue(lead, field.path);
    if (!isFieldFilled(value, field.key)) {
      missingOptional.push({
        key: field.key,
        displayName: field.displayName,
        section: field.section,
        isRequired: false,
        formFieldKey: field.formFieldKey,
        isEditable: field.isEditable,
      });
    }
  }
  
  const totalFields = requiredFields.length + optionalFields.length;
  const filledFields = totalFields - missingRequired.length - missingOptional.length;
  const completenessScore = Math.round((filledFields / totalFields) * 100);
  
  return {
    missingRequired,
    missingOptional,
    completenessScore,
    isComplete: missingRequired.length === 0,
    totalFields,
    filledFields,
    hasCoApplicant: hasCoApp,
  };
}

/**
 * Get fields that are editable in the Complete Lead form
 * These are the fields that should appear in the form when missing
 */
export function getEditableRequiredFields(): LeadCompletionField[] {
  // Student PIN and all co-applicant fields are editable in Complete Lead
  return [
    STUDENT_REQUIRED_FIELDS.find(f => f.key === 'student_postal_code')!,
    ...CO_APPLICANT_REQUIRED_FIELDS,
  ];
}

/**
 * Get all editable fields (required + optional) for Complete Lead form
 */
export function getAllEditableFields(): LeadCompletionField[] {
  const editableRequired = [
    STUDENT_REQUIRED_FIELDS.find(f => f.key === 'student_postal_code')!,
    ...CO_APPLICANT_REQUIRED_FIELDS,
  ];
  
  const editableOptional = OPTIONAL_FIELDS.filter(f => f.isEditable);
  
  return [...editableRequired, ...editableOptional];
}

/**
 * Check if a field is editable in the Complete Lead form
 */
export function isFieldEditableInCompleteForm(fieldKey: string): boolean {
  const allFields = [...STUDENT_REQUIRED_FIELDS, ...CO_APPLICANT_REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
  const field = allFields.find(f => f.key === fieldKey);
  return field?.isEditable ?? false;
}

// Constants for dropdowns
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

export const QUALIFICATION_OPTIONS = [
  { value: '10th', label: '10th' },
  { value: '12th', label: '12th' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's" },
  { value: 'phd', label: 'PhD' },
] as const;

export const OCCUPATION_OPTIONS = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'professional', label: 'Professional' },
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'retired', label: 'Retired' },
  { value: 'other', label: 'Other' },
] as const;

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
] as const;

// Employer type options for conditional display based on occupation
export const EMPLOYER_TYPE_OPTIONS = [
  { value: 'private_company', label: 'Private Company' },
  { value: 'government', label: 'Government' },
  { value: 'psu', label: 'PSU' },
  { value: 'mnc', label: 'MNC' },
] as const;

// Salary quick-select chip options (in INR)
export const SALARY_QUICK_OPTIONS = [
  { value: 25000, label: '₹25K' },
  { value: 40000, label: '₹40K' },
  { value: 50000, label: '₹50K' },
  { value: 75000, label: '₹75K' },
  { value: 100000, label: '₹1L+' },
] as const;

// Relationship options with icons for chip display
export const RELATIONSHIP_OPTIONS = [
  { value: 'parent', label: 'Parent', icon: '👨‍👩‍👦' },
  { value: 'spouse', label: 'Spouse', icon: '💑' },
  { value: 'sibling', label: 'Sibling', icon: '👫' },
  { value: 'guardian', label: 'Guardian', icon: '🛡️' },
  { value: 'other', label: 'Other', icon: '👤' },
] as const;

// Phase 3 & 7: Test types for academic tests
export const TEST_TYPES = [
  { value: 'ielts', label: 'IELTS', maxScore: 9, minScore: 0, category: 'language' },
  { value: 'toefl', label: 'TOEFL', maxScore: 120, minScore: 0, category: 'language' },
  { value: 'pte', label: 'PTE', maxScore: 90, minScore: 0, category: 'language' },
  { value: 'duolingo', label: 'Duolingo', maxScore: 160, minScore: 0, category: 'language' },
  { value: 'gre', label: 'GRE', maxScore: 340, minScore: 260, category: 'aptitude' },
  { value: 'gmat', label: 'GMAT', maxScore: 800, minScore: 200, category: 'aptitude' },
  { value: 'sat', label: 'SAT', maxScore: 1600, minScore: 400, category: 'aptitude' },
] as const;

export const TEST_CATEGORIES = {
  language: ['ielts', 'toefl', 'pte', 'duolingo'],
  aptitude: ['gre', 'gmat', 'sat'],
} as const;
