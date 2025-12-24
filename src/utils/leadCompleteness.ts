/**
 * Lead Completeness Utility
 * 
 * Per Knowledge Base:
 * - Missing field detection works universally (not just quick leads)
 * - Admin can complete/edit ANY lead regardless of origin
 */

import { PaginatedLead } from '@/hooks/usePaginatedLeads';

export interface LeadCompletenessResult {
  missingRequired: MissingField[];
  missingOptional: MissingField[];
  completenessScore: number;
  isComplete: boolean;
  totalFields: number;
  filledFields: number;
}

export interface MissingField {
  fieldName: string;
  displayName: string;
  section: 'student' | 'study' | 'co_applicant' | 'lead';
  isRequired: boolean;
}

// Required fields that block processing
const REQUIRED_FIELDS: { path: string; displayName: string; section: MissingField['section'] }[] = [
  // Student Details
  { path: 'student.name', displayName: 'Student Name', section: 'student' },
  { path: 'student.phone', displayName: 'Student Phone', section: 'student' },
  { path: 'student.email', displayName: 'Student Email', section: 'student' },
  { path: 'student.postal_code', displayName: 'Student PIN Code', section: 'student' },
  
  // Study Details
  { path: 'study_destination', displayName: 'Study Destination', section: 'study' },
  { path: 'loan_amount', displayName: 'Loan Amount', section: 'study' },
  { path: 'intake_month', displayName: 'Intake Month', section: 'study' },
  { path: 'intake_year', displayName: 'Intake Year', section: 'study' },
  
  // Co-Applicant Details
  { path: 'co_applicant.name', displayName: 'Co-Applicant Name', section: 'co_applicant' },
  { path: 'co_applicant.relationship', displayName: 'Relationship', section: 'co_applicant' },
  { path: 'co_applicant.phone', displayName: 'Co-Applicant Phone', section: 'co_applicant' },
  { path: 'co_applicant.salary', displayName: 'Co-Applicant Salary', section: 'co_applicant' },
  { path: 'co_applicant.pin_code', displayName: 'Co-Applicant PIN Code', section: 'co_applicant' },
];

// Optional fields for a more complete profile
const OPTIONAL_FIELDS: { path: string; displayName: string; section: MissingField['section'] }[] = [
  { path: 'student.date_of_birth', displayName: 'Date of Birth', section: 'student' },
  { path: 'student.city', displayName: 'City', section: 'student' },
  { path: 'student.state', displayName: 'State', section: 'student' },
  { path: 'loan_type', displayName: 'Loan Type', section: 'study' },
  { path: 'co_applicant.occupation', displayName: 'Co-Applicant Occupation', section: 'co_applicant' },
  { path: 'co_applicant.employer', displayName: 'Co-Applicant Employer', section: 'co_applicant' },
  { path: 'partner_id', displayName: 'Partner Assignment', section: 'lead' },
];

/**
 * Get a nested value from an object using dot notation
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
function isFieldFilled(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (typeof value === 'number' && value === 0) return false;
  return true;
}

/**
 * Calculate which fields are missing regardless of lead origin
 */
export function getLeadCompleteness(lead: PaginatedLead & { 
  student?: any; 
  co_applicant?: any 
}): LeadCompletenessResult {
  const missingRequired: MissingField[] = [];
  const missingOptional: MissingField[] = [];
  
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    const value = getNestedValue(lead, field.path);
    if (!isFieldFilled(value)) {
      missingRequired.push({
        fieldName: field.path,
        displayName: field.displayName,
        section: field.section,
        isRequired: true,
      });
    }
  }
  
  // Check optional fields
  for (const field of OPTIONAL_FIELDS) {
    const value = getNestedValue(lead, field.path);
    if (!isFieldFilled(value)) {
      missingOptional.push({
        fieldName: field.path,
        displayName: field.displayName,
        section: field.section,
        isRequired: false,
      });
    }
  }
  
  const totalFields = REQUIRED_FIELDS.length + OPTIONAL_FIELDS.length;
  const filledFields = totalFields - missingRequired.length - missingOptional.length;
  const completenessScore = Math.round((filledFields / totalFields) * 100);
  
  return {
    missingRequired,
    missingOptional,
    completenessScore,
    isComplete: missingRequired.length === 0,
    totalFields,
    filledFields,
  };
}

/**
 * Get a quick badge color based on completeness
 */
export function getCompletenessColor(score: number): string {
  if (score >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 70) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

/**
 * Get missing fields grouped by section
 */
export function getMissingFieldsBySection(result: LeadCompletenessResult): Record<string, MissingField[]> {
  const allMissing = [...result.missingRequired, ...result.missingOptional];
  
  return allMissing.reduce((acc, field) => {
    if (!acc[field.section]) {
      acc[field.section] = [];
    }
    acc[field.section].push(field);
    return acc;
  }, {} as Record<string, MissingField[]>);
}

/**
 * Check if a lead needs admin attention for missing fields
 */
export function needsFieldCompletion(lead: PaginatedLead & { student?: any; co_applicant?: any }): boolean {
  const result = getLeadCompleteness(lead);
  return result.missingRequired.length > 0;
}

/**
 * Get a human-readable summary of missing fields
 */
export function getMissingSummary(result: LeadCompletenessResult): string {
  if (result.isComplete) {
    return 'All required fields complete';
  }
  
  const count = result.missingRequired.length;
  return `${count} required field${count === 1 ? '' : 's'} missing`;
}
