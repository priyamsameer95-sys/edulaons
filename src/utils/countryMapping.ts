/**
 * Country code mapping utilities
 * Maps frontend country codes to database country names
 */

// Map frontend country codes to database country names
export const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  // Primary codes used in StudentLanding
  'USA': 'United States',
  'US': 'United States',
  'UK': 'United Kingdom',
  'GB': 'United Kingdom',
  'Canada': 'Canada',
  'Australia': 'Australia',
  'Germany': 'Germany',
  'Ireland': 'Ireland',
  'IE': 'Ireland',
  'NZ': 'New Zealand',
  'New Zealand': 'New Zealand',
  'SG': 'Singapore',
  'Singapore': 'Singapore',
  'HK': 'Hong Kong SAR',
  'Hong Kong': 'Hong Kong SAR',
  'JP': 'Japan',
  'Japan': 'Japan',
  'CH': 'Switzerland',
  'Switzerland': 'Switzerland',
  'CN': 'China',
  'China': 'China',
  'Other': 'Other',
  // Pass-through for full country names
  'United States': 'United States',
  'United Kingdom': 'United Kingdom',
};

// Reverse mapping for display purposes
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'United States': 'USA',
  'United Kingdom': 'UK',
  'Canada': 'Canada',
  'Australia': 'Australia',
  'Germany': 'Germany',
  'New Zealand': 'NZ',
  'Singapore': 'SG',
  'Hong Kong SAR': 'HK',
  'Japan': 'JP',
  'Switzerland': 'CH',
  'China': 'CN',
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
 * Get all possible database values for a country code to ensure robust matching
 */
export const getCountrySearchTerms = (code: string): string[] => {
  const primary = COUNTRY_CODE_TO_NAME[code] || code;
  const terms = new Set([code, primary]);

  // Add common variations
  if (code === 'USA' || code === 'US' || primary === 'United States') {
    terms.add('USA');
    terms.add('US');
    terms.add('United States');
    terms.add('United States of America');
    terms.add('U.S.A.');
  } else if (code === 'UK' || code === 'GB' || primary === 'United Kingdom') {
    terms.add('UK');
    terms.add('GB');
    terms.add('United Kingdom');
    terms.add('Britain');
    terms.add('Great Britain');
  } else if (code === 'UAE' || primary === 'United Arab Emirates') {
    terms.add('UAE');
    terms.add('United Arab Emirates');
  }

  // Add uppercase versions of all terms to handle case inconsistencies
  const upperTerms = new Set<string>();
  terms.forEach(term => {
    upperTerms.add(term.toUpperCase());
    // Also title case if needed, but primary list usually has it.
    // Adding 'United states' just in case of bad capitalization
    upperTerms.add(term.charAt(0).toUpperCase() + term.slice(1).toLowerCase());
  });

  // Merge sets
  upperTerms.forEach(t => terms.add(t));

  return Array.from(terms);
};

/**
 * Convert country name to code for display
 * @param name - Full country name (e.g., "United Kingdom")
 * @returns Country code (e.g., "UK")
 */
export const getCountryCodeFromName = (name: string): string => {
  return COUNTRY_NAME_TO_CODE[name] || name;
};
