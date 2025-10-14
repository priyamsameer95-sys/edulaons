/**
 * Country code mapping utilities
 * Maps frontend country codes to database country names
 */

// Map frontend country codes to database country names
export const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  'USA': 'United States',
  'UK': 'United Kingdom',
  'Canada': 'Canada',
  'Australia': 'Australia',
  'Germany': 'Germany',
  'Ireland': 'Ireland',
  'New Zealand': 'New Zealand',
  'Other': 'Other'
};

// Reverse mapping for display purposes
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'United States': 'USA',
  'United Kingdom': 'UK',
  'Canada': 'Canada',
  'Australia': 'Australia',
  'Germany': 'Germany',
  'Ireland': 'Ireland',
  'New Zealand': 'New Zealand',
  'Other': 'Other'
};

/**
 * Convert country code to full country name for database queries
 * @param code - Country code (e.g., "UK", "USA")
 * @returns Full country name (e.g., "United Kingdom", "United States")
 */
export const getCountryNameFromCode = (code: string): string => {
  return COUNTRY_CODE_TO_NAME[code] || code;
};

/**
 * Convert country name to code for display
 * @param name - Full country name (e.g., "United Kingdom")
 * @returns Country code (e.g., "UK")
 */
export const getCountryCodeFromName = (name: string): string => {
  return COUNTRY_NAME_TO_CODE[name] || name;
};
