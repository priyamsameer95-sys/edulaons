/**
 * Validation utilities for create-lead edge function
 * Uses shared validation module for consistency
 */

import {
  validateCreateLeadRequest,
  formatValidationErrors,
  isUUID,
  separateUniversities,
  cleanPhoneNumber,
  normalizeCountry,
  type ValidationResult,
  type ValidationError,
} from '../_shared/validation.ts';

// Re-export shared utilities
export { isUUID, separateUniversities, cleanPhoneNumber, normalizeCountry };

/**
 * Required fields for full lead creation (partner/admin)
 */
export const REQUIRED_FIELDS = [
  'student_name',
  'student_phone',
  'student_pin_code',
  'co_applicant_name',
  'co_applicant_phone',
  'co_applicant_monthly_salary',
  'co_applicant_relationship',
  'co_applicant_pin_code',
  'country',
  'intake_month',
  'intake_year',
  'loan_type',
] as const;

// Field that holds amount - check both for compatibility
const AMOUNT_FIELDS = ['amount_requested', 'loan_amount'] as const;

/**
 * Validate required fields exist (basic presence check)
 * @deprecated Use validateLeadData for comprehensive validation
 */
export function validateRequiredFields(body: any): void {
  const missingFields: string[] = [];
  
  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missingFields.push(field);
    }
  }
  
  // Check for amount in either field
  const hasAmount = AMOUNT_FIELDS.some(field => 
    body[field] !== undefined && body[field] !== null && body[field] !== ''
  );
  if (!hasAmount) {
    missingFields.push('amount_requested');
  }
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Comprehensive lead data validation
 * Validates all fields with proper format checks
 */
export function validateLeadData(body: any): ValidationResult {
  return validateCreateLeadRequest(body);
}

/**
 * Validate and throw if errors exist
 */
export function validateOrThrow(body: any): void {
  // First check required fields exist
  validateRequiredFields(body);
  
  // Then run comprehensive validation
  const result = validateLeadData(body);
  
  if (!result.isValid) {
    throw new Error(formatValidationErrors(result.errors));
  }
}

/**
 * Country code mapping for validation
 */
const COUNTRY_MAPPING: Record<string, string> = {
  'USA': 'United States',
  'UK': 'United Kingdom',
  'Canada': 'Canada',
  'Australia': 'Australia',
  'Germany': 'Germany',
  'Ireland': 'Ireland',
  'New Zealand': 'New Zealand',
  'United States': 'United States',
  'United Kingdom': 'United Kingdom',
};

/**
 * Normalize country code to full name
 * @deprecated Use normalizeCountry from shared validation
 */
export function normalizeCountryLegacy(country: string): string {
  return COUNTRY_MAPPING[country] || country;
}

/**
 * Map country to database enum value
 */
export function mapCountryToEnum(country: string): string {
  const mapping: Record<string, string> = {
    'United Kingdom': 'UK',
    'United States': 'USA',
    'United States of America': 'USA',
    'New Zealand': 'New Zealand',
    'Australia': 'Australia',
    'Canada': 'Canada',
    'Germany': 'Germany',
    'Ireland': 'Ireland',
    'UK': 'UK',
    'USA': 'USA',
  };
  return mapping[country] || 'Other';
}
