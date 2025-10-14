/**
 * Validation utilities for create-lead edge function
 */

export const REQUIRED_FIELDS = [
  'student_name', 'student_phone', 'student_pin_code',
  'co_applicant_name', 'co_applicant_phone', 'co_applicant_monthly_salary',
  'co_applicant_relationship', 'co_applicant_pin_code',
  'country', 'intake_month', 'loan_type', 'amount_requested'
] as const;

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(body: any): void {
  const missingFields: string[] = [];
  
  for (const field of REQUIRED_FIELDS) {
    if (!body[field]) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Check if a string is a valid UUID
 */
export function isUUID(str: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}

/**
 * Separate university UUIDs from custom names
 */
export function separateUniversities(universities: string[]) {
  const uuids: string[] = [];
  const custom: string[] = [];
  
  universities.forEach(uni => {
    if (uni && uni.trim()) {
      if (isUUID(uni)) {
        uuids.push(uni);
      } else {
        custom.push(uni.trim());
      }
    }
  });
  
  return { uuids, custom };
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
  'New Zealand': 'New Zealand'
};

/**
 * Normalize country code to full name
 */
export function normalizeCountry(country: string): string {
  return COUNTRY_MAPPING[country] || country;
}

/**
 * Clean phone number - remove +91 and non-digits
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.trim().replace(/^\+91/, '').replace(/\D/g, '');
}
