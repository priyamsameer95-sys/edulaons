/**
 * Lead Completeness Utility
 * 
 * Per Knowledge Base:
 * - Missing field detection works universally (not just quick leads)
 * - Admin can complete/edit ANY lead regardless of origin
 * 
 * This file now uses the unified leadCompletionSchema for consistency
 * between tooltip and Complete Lead form.
 */

import { PaginatedLead } from '@/hooks/usePaginatedLeads';
import { 
  getLeadMissingFields, 
  LeadCompletionResult,
  MissingFieldResult 
} from './leadCompletionSchema';

// Re-export types for backward compatibility
export interface MissingField {
  fieldName: string;
  displayName: string;
  section: 'student' | 'study' | 'co_applicant' | 'lead';
  isRequired: boolean;
}

export interface LeadCompletenessResult {
  missingRequired: MissingField[];
  missingOptional: MissingField[];
  completenessScore: number;
  isComplete: boolean;
  totalFields: number;
  filledFields: number;
}

/**
 * Convert new schema result to legacy format for backward compatibility
 */
function convertToLegacyFormat(result: LeadCompletionResult): LeadCompletenessResult {
  const convertField = (f: MissingFieldResult): MissingField => ({
    fieldName: f.key,
    displayName: f.displayName,
    section: f.section,
    isRequired: f.isRequired,
  });
  
  return {
    missingRequired: result.missingRequired.map(convertField),
    missingOptional: result.missingOptional.map(convertField),
    completenessScore: result.completenessScore,
    isComplete: result.isComplete,
    totalFields: result.totalFields,
    filledFields: result.filledFields,
  };
}

/**
 * Calculate which fields are missing regardless of lead origin
 * Now uses the unified schema from leadCompletionSchema.ts
 */
export function getLeadCompleteness(lead: PaginatedLead & { 
  student?: any; 
  co_applicant?: any 
}): LeadCompletenessResult {
  const result = getLeadMissingFields(lead);
  return convertToLegacyFormat(result);
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
