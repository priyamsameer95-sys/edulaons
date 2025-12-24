/**
 * Role-based Permission Utilities
 * 
 * Per Knowledge Base:
 * - Student can view/edit only whitelisted fields
 * - Internal notes, partner data, commercial fields must be hidden
 * - All edits must be attributable
 */

import {
  STUDENT_VISIBLE_LEAD_FIELDS,
  STUDENT_EDITABLE_LEAD_FIELDS,
  STUDENT_VISIBLE_PROFILE_FIELDS,
  STUDENT_EDIT_LOCKED_STATUSES,
  STUDENT_STATUS_LABELS,
  STUDENT_DOCUMENT_STATUS_LABELS,
} from '@/constants/studentPermissions';

export type AppRole = 'admin' | 'super_admin' | 'partner' | 'student' | 'kam';

/**
 * Filter lead data for student view
 * Removes all internal/commercial fields
 */
export function filterLeadForStudent<T extends Record<string, any>>(lead: T): Partial<T> {
  const filtered: Partial<T> = {};
  
  for (const field of STUDENT_VISIBLE_LEAD_FIELDS) {
    if (field in lead) {
      filtered[field as keyof T] = lead[field];
    }
  }
  
  return filtered;
}

/**
 * Filter student profile for student view
 */
export function filterProfileForStudent<T extends Record<string, any>>(profile: T): Partial<T> {
  const filtered: Partial<T> = {};
  
  for (const field of STUDENT_VISIBLE_PROFILE_FIELDS) {
    if (field in profile) {
      filtered[field as keyof T] = profile[field];
    }
  }
  
  return filtered;
}

/**
 * Check if student can edit a specific field on their lead
 */
export function canStudentEditLeadField(
  fieldName: string, 
  currentStatus: string
): boolean {
  // Check if field is in editable list
  if (!STUDENT_EDITABLE_LEAD_FIELDS.includes(fieldName as any)) {
    return false;
  }
  
  // Check if lead is in a locked status
  if (STUDENT_EDIT_LOCKED_STATUSES.includes(currentStatus as any)) {
    return false;
  }
  
  return true;
}

/**
 * Check if student can edit their profile
 */
export function canStudentEditProfile(currentStatus: string): boolean {
  // Students can always edit their profile, but some lead-related data
  // might be locked after certain statuses
  return !STUDENT_EDIT_LOCKED_STATUSES.includes(currentStatus as any);
}

/**
 * Get student-friendly status label
 */
export function getStudentStatusLabel(internalStatus: string): string {
  return STUDENT_STATUS_LABELS[internalStatus] || internalStatus;
}

/**
 * Get student-friendly document status label
 */
export function getStudentDocumentStatusLabel(internalStatus: string): string {
  return STUDENT_DOCUMENT_STATUS_LABELS[internalStatus] || internalStatus;
}

/**
 * Filter comments/notes to remove internal-only content
 */
export function filterCommentsForStudent<T extends { is_internal?: boolean }>(
  comments: T[]
): T[] {
  return comments.filter(comment => !comment.is_internal);
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(role: AppRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Check if user can view internal notes
 */
export function canViewInternalNotes(role: AppRole): boolean {
  return role === 'admin' || role === 'super_admin' || role === 'kam';
}

/**
 * Check if user can assign lenders
 */
export function canAssignLender(role: AppRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Check if user can map students to partners
 */
export function canMapStudentToPartner(role: AppRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Get fields that should be hidden based on role
 */
export function getHiddenFieldsForRole(role: AppRole): string[] {
  switch (role) {
    case 'student':
      return [
        'partner_id', 'lender_id', 'target_lender_id',
        'eligibility_score', 'eligibility_result', 'case_complexity',
        'pf_amount', 'sanction_amount', 'created_by_user_id', 'created_by_role'
      ];
    case 'partner':
      return [
        'eligibility_score', 'pf_amount', 'sanction_amount',
        'created_by_user_id', 'created_by_role'
      ];
    default:
      return [];
  }
}
