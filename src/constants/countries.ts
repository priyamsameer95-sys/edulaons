// Centralized country configuration - single source of truth
// Flags derived from ISO2 codes using Regional Indicator Symbol pairs

export interface CountryConfig {
  codeISO2: string;       // ISO 3166-1 alpha-2 code (e.g., "US")
  label: string;          // Display label (e.g., "USA")
  dbCountry: string;      // Database value (e.g., "United States")
  flag: string;           // Emoji flag (computed from ISO2)
}

// Convert ISO2 code to flag emoji (e.g., "US" -> 🇺🇸)
export const getFlag = (iso2: string): string => {
  if (!iso2 || iso2.length !== 2) return '🌍';
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Main country configurations
export const COUNTRY_CONFIGS: CountryConfig[] = [
  { codeISO2: 'US', label: 'USA', dbCountry: 'United States', flag: getFlag('US') },
  { codeISO2: 'GB', label: 'UK', dbCountry: 'United Kingdom', flag: getFlag('GB') },
  { codeISO2: 'CA', label: 'Canada', dbCountry: 'Canada', flag: getFlag('CA') },
  { codeISO2: 'AU', label: 'Australia', dbCountry: 'Australia', flag: getFlag('AU') },
  { codeISO2: 'DE', label: 'Germany', dbCountry: 'Germany', flag: getFlag('DE') },
  { codeISO2: 'IE', label: 'Ireland', dbCountry: 'Ireland', flag: getFlag('IE') },
  { codeISO2: 'NZ', label: 'New Zealand', dbCountry: 'New Zealand', flag: getFlag('NZ') },
];

// Helper to get country config by ISO2 code
export const getCountryByISO2 = (iso2: string): CountryConfig | undefined => {
  return COUNTRY_CONFIGS.find((c) => c.codeISO2.toLowerCase() === iso2.toLowerCase());
};

// Helper to get country config by dbCountry value
export const getCountryByDbValue = (dbValue: string): CountryConfig | undefined => {
  return COUNTRY_CONFIGS.find((c) => c.dbCountry.toLowerCase() === dbValue.toLowerCase());
};

// For backward compatibility with existing code
export const STUDY_DESTINATIONS = COUNTRY_CONFIGS.map((c) => ({
  code: c.codeISO2,
  name: c.label,
  flag: c.flag,
  value: c.dbCountry,
}));

// Get dbCountry from any variant (ISO2, label, or already dbCountry)
export const normalizeToDbCountry = (input: string): string => {
  if (!input) return '';
  
  const byISO2 = getCountryByISO2(input);
  if (byISO2) return byISO2.dbCountry;
  
  const byDb = getCountryByDbValue(input);
  if (byDb) return byDb.dbCountry;
  
  // Check if it matches a label
  const byLabel = COUNTRY_CONFIGS.find(
    (c) => c.label.toLowerCase() === input.toLowerCase()
  );
  if (byLabel) return byLabel.dbCountry;
  
  // Return as-is if no match
  return input;
};
