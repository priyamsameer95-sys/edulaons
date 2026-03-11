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

// Main country configurations - Complete master list (117 countries)
export const COUNTRY_CONFIGS: CountryConfig[] = [
  { codeISO2: 'AR', label: 'Argentina', dbCountry: 'Argentina', flag: getFlag('AR') },
  { codeISO2: 'AM', label: 'Armenia', dbCountry: 'Armenia', flag: getFlag('AM') },
  { codeISO2: 'AU', label: 'Australia', dbCountry: 'Australia', flag: getFlag('AU') },
  { codeISO2: 'AT', label: 'Austria', dbCountry: 'Austria', flag: getFlag('AT') },
  { codeISO2: 'AZ', label: 'Azerbaijan', dbCountry: 'Azerbaijan', flag: getFlag('AZ') },
  { codeISO2: 'BH', label: 'Bahrain', dbCountry: 'Bahrain', flag: getFlag('BH') },
  { codeISO2: 'BD', label: 'Bangladesh', dbCountry: 'Bangladesh', flag: getFlag('BD') },
  { codeISO2: 'BY', label: 'Belarus', dbCountry: 'Belarus', flag: getFlag('BY') },
  { codeISO2: 'BE', label: 'Belgium', dbCountry: 'Belgium', flag: getFlag('BE') },
  { codeISO2: 'BA', label: 'Bosnia & Herzegovina', dbCountry: 'Bosnia & Herzegovina', flag: getFlag('BA') },
  { codeISO2: 'BR', label: 'Brazil', dbCountry: 'Brazil', flag: getFlag('BR') },
  { codeISO2: 'BN', label: 'Brunei', dbCountry: 'Brunei', flag: getFlag('BN') },
  { codeISO2: 'BG', label: 'Bulgaria', dbCountry: 'Bulgaria', flag: getFlag('BG') },
  { codeISO2: 'CA', label: 'Canada', dbCountry: 'Canada', flag: getFlag('CA') },
  { codeISO2: 'CL', label: 'Chile', dbCountry: 'Chile', flag: getFlag('CL') },
  { codeISO2: 'CN', label: 'China (Mainland)', dbCountry: 'China (Mainland)', flag: getFlag('CN') },
  { codeISO2: 'CO', label: 'Colombia', dbCountry: 'Colombia', flag: getFlag('CO') },
  { codeISO2: 'CR', label: 'Costa Rica', dbCountry: 'Costa Rica', flag: getFlag('CR') },
  { codeISO2: 'HR', label: 'Croatia', dbCountry: 'Croatia', flag: getFlag('HR') },
  { codeISO2: 'CU', label: 'Cuba', dbCountry: 'Cuba', flag: getFlag('CU') },
  { codeISO2: 'CY', label: 'Cyprus', dbCountry: 'Cyprus', flag: getFlag('CY') },
  { codeISO2: 'CZ', label: 'Czechia', dbCountry: 'Czechia', flag: getFlag('CZ') },
  { codeISO2: 'DK', label: 'Denmark', dbCountry: 'Denmark', flag: getFlag('DK') },
  { codeISO2: 'DO', label: 'Dominican Republic', dbCountry: 'Dominican Republic', flag: getFlag('DO') },
  { codeISO2: 'EC', label: 'Ecuador', dbCountry: 'Ecuador', flag: getFlag('EC') },
  { codeISO2: 'EG', label: 'Egypt', dbCountry: 'Egypt', flag: getFlag('EG') },
  { codeISO2: 'EE', label: 'Estonia', dbCountry: 'Estonia', flag: getFlag('EE') },
  { codeISO2: 'ET', label: 'Ethiopia', dbCountry: 'Ethiopia', flag: getFlag('ET') },
  { codeISO2: 'FI', label: 'Finland', dbCountry: 'Finland', flag: getFlag('FI') },
  { codeISO2: 'FR', label: 'France', dbCountry: 'France', flag: getFlag('FR') },
  { codeISO2: 'GE', label: 'Georgia', dbCountry: 'Georgia', flag: getFlag('GE') },
  { codeISO2: 'DE', label: 'Germany', dbCountry: 'Germany', flag: getFlag('DE') },
  { codeISO2: 'GH', label: 'Ghana', dbCountry: 'Ghana', flag: getFlag('GH') },
  { codeISO2: 'GR', label: 'Greece', dbCountry: 'Greece', flag: getFlag('GR') },
  { codeISO2: 'GT', label: 'Guatemala', dbCountry: 'Guatemala', flag: getFlag('GT') },
  { codeISO2: 'HN', label: 'Honduras', dbCountry: 'Honduras', flag: getFlag('HN') },
  { codeISO2: 'HK', label: 'Hong Kong SAR', dbCountry: 'Hong Kong SAR', flag: getFlag('HK') },
  { codeISO2: 'HU', label: 'Hungary', dbCountry: 'Hungary', flag: getFlag('HU') },
  { codeISO2: 'IS', label: 'Iceland', dbCountry: 'Iceland', flag: getFlag('IS') },
  { codeISO2: 'IN', label: 'India', dbCountry: 'India', flag: getFlag('IN') },
  { codeISO2: 'ID', label: 'Indonesia', dbCountry: 'Indonesia', flag: getFlag('ID') },
  { codeISO2: 'IR', label: 'Iran', dbCountry: 'Iran', flag: getFlag('IR') },
  { codeISO2: 'IQ', label: 'Iraq', dbCountry: 'Iraq', flag: getFlag('IQ') },
  { codeISO2: 'IE', label: 'Ireland', dbCountry: 'Ireland', flag: getFlag('IE') },
  { codeISO2: 'IL', label: 'Israel', dbCountry: 'Israel', flag: getFlag('IL') },
  { codeISO2: 'IT', label: 'Italy', dbCountry: 'Italy', flag: getFlag('IT') },
  { codeISO2: 'JP', label: 'Japan', dbCountry: 'Japan', flag: getFlag('JP') },
  { codeISO2: 'JO', label: 'Jordan', dbCountry: 'Jordan', flag: getFlag('JO') },
  { codeISO2: 'KZ', label: 'Kazakhstan', dbCountry: 'Kazakhstan', flag: getFlag('KZ') },
  { codeISO2: 'KE', label: 'Kenya', dbCountry: 'Kenya', flag: getFlag('KE') },
  { codeISO2: 'KW', label: 'Kuwait', dbCountry: 'Kuwait', flag: getFlag('KW') },
  { codeISO2: 'KG', label: 'Kyrgyzstan', dbCountry: 'Kyrgyzstan', flag: getFlag('KG') },
  { codeISO2: 'LV', label: 'Latvia', dbCountry: 'Latvia', flag: getFlag('LV') },
  { codeISO2: 'LB', label: 'Lebanon', dbCountry: 'Lebanon', flag: getFlag('LB') },
  { codeISO2: 'LY', label: 'Libya', dbCountry: 'Libya', flag: getFlag('LY') },
  { codeISO2: 'LT', label: 'Lithuania', dbCountry: 'Lithuania', flag: getFlag('LT') },
  { codeISO2: 'LU', label: 'Luxembourg', dbCountry: 'Luxembourg', flag: getFlag('LU') },
  { codeISO2: 'MO', label: 'Macau SAR', dbCountry: 'Macau SAR', flag: getFlag('MO') },
  { codeISO2: 'MY', label: 'Malaysia', dbCountry: 'Malaysia', flag: getFlag('MY') },
  { codeISO2: 'MT', label: 'Malta', dbCountry: 'Malta', flag: getFlag('MT') },
  { codeISO2: 'MX', label: 'Mexico', dbCountry: 'Mexico', flag: getFlag('MX') },
  { codeISO2: 'MA', label: 'Morocco', dbCountry: 'Morocco', flag: getFlag('MA') },
  { codeISO2: 'NL', label: 'Netherlands', dbCountry: 'Netherlands', flag: getFlag('NL') },
  { codeISO2: 'NZ', label: 'New Zealand', dbCountry: 'New Zealand', flag: getFlag('NZ') },
  { codeISO2: 'NG', label: 'Nigeria', dbCountry: 'Nigeria', flag: getFlag('NG') },
  { codeISO2: 'NC', label: 'Northern Cyprus', dbCountry: 'Northern Cyprus', flag: getFlag('NC') },
  { codeISO2: 'NO', label: 'Norway', dbCountry: 'Norway', flag: getFlag('NO') },
  { codeISO2: 'OM', label: 'Oman', dbCountry: 'Oman', flag: getFlag('OM') },
  { codeISO2: 'PK', label: 'Pakistan', dbCountry: 'Pakistan', flag: getFlag('PK') },
  { codeISO2: 'PS', label: 'Palestine', dbCountry: 'Palestine', flag: getFlag('PS') },
  { codeISO2: 'PA', label: 'Panama', dbCountry: 'Panama', flag: getFlag('PA') },
  { codeISO2: 'PY', label: 'Paraguay', dbCountry: 'Paraguay', flag: getFlag('PY') },
  { codeISO2: 'PE', label: 'Peru', dbCountry: 'Peru', flag: getFlag('PE') },
  { codeISO2: 'PH', label: 'Philippines', dbCountry: 'Philippines', flag: getFlag('PH') },
  { codeISO2: 'PL', label: 'Poland', dbCountry: 'Poland', flag: getFlag('PL') },
  { codeISO2: 'PT', label: 'Portugal', dbCountry: 'Portugal', flag: getFlag('PT') },
  { codeISO2: 'PR', label: 'Puerto Rico', dbCountry: 'Puerto Rico', flag: getFlag('PR') },
  { codeISO2: 'QA', label: 'Qatar', dbCountry: 'Qatar', flag: getFlag('QA') },
  { codeISO2: 'RO', label: 'Romania', dbCountry: 'Romania', flag: getFlag('RO') },
  { codeISO2: 'RU', label: 'Russia', dbCountry: 'Russia', flag: getFlag('RU') },
  { codeISO2: 'SA', label: 'Saudi Arabia', dbCountry: 'Saudi Arabia', flag: getFlag('SA') },
  { codeISO2: 'RS', label: 'Serbia', dbCountry: 'Serbia', flag: getFlag('RS') },
  { codeISO2: 'SG', label: 'Singapore', dbCountry: 'Singapore', flag: getFlag('SG') },
  { codeISO2: 'SK', label: 'Slovakia', dbCountry: 'Slovakia', flag: getFlag('SK') },
  { codeISO2: 'SI', label: 'Slovenia', dbCountry: 'Slovenia', flag: getFlag('SI') },
  { codeISO2: 'ZA', label: 'South Africa', dbCountry: 'South Africa', flag: getFlag('ZA') },
  { codeISO2: 'KR', label: 'South Korea', dbCountry: 'South Korea', flag: getFlag('KR') },
  { codeISO2: 'ES', label: 'Spain', dbCountry: 'Spain', flag: getFlag('ES') },
  { codeISO2: 'LK', label: 'Sri Lanka', dbCountry: 'Sri Lanka', flag: getFlag('LK') },
  { codeISO2: 'SD', label: 'Sudan', dbCountry: 'Sudan', flag: getFlag('SD') },
  { codeISO2: 'SE', label: 'Sweden', dbCountry: 'Sweden', flag: getFlag('SE') },
  { codeISO2: 'CH', label: 'Switzerland', dbCountry: 'Switzerland', flag: getFlag('CH') },
  { codeISO2: 'SY', label: 'Syria', dbCountry: 'Syria', flag: getFlag('SY') },
  { codeISO2: 'TW', label: 'Taiwan', dbCountry: 'Taiwan', flag: getFlag('TW') },
  { codeISO2: 'TH', label: 'Thailand', dbCountry: 'Thailand', flag: getFlag('TH') },
  { codeISO2: 'TN', label: 'Tunisia', dbCountry: 'Tunisia', flag: getFlag('TN') },
  { codeISO2: 'TR', label: 'Türkiye', dbCountry: 'Türkiye', flag: getFlag('TR') },
  { codeISO2: 'UG', label: 'Uganda', dbCountry: 'Uganda', flag: getFlag('UG') },
  { codeISO2: 'UA', label: 'Ukraine', dbCountry: 'Ukraine', flag: getFlag('UA') },
  { codeISO2: 'AE', label: 'United Arab Emirates', dbCountry: 'United Arab Emirates', flag: getFlag('AE') },
  { codeISO2: 'GB', label: 'United Kingdom', dbCountry: 'United Kingdom', flag: getFlag('GB') },
  { codeISO2: 'US', label: 'United States', dbCountry: 'United States', flag: getFlag('US') },
  { codeISO2: 'UY', label: 'Uruguay', dbCountry: 'Uruguay', flag: getFlag('UY') },
  { codeISO2: 'UZ', label: 'Uzbekistan', dbCountry: 'Uzbekistan', flag: getFlag('UZ') },
  { codeISO2: 'VE', label: 'Venezuela', dbCountry: 'Venezuela', flag: getFlag('VE') },
  { codeISO2: 'VN', label: 'Vietnam', dbCountry: 'Vietnam', flag: getFlag('VN') },
  { codeISO2: 'XX', label: 'Other', dbCountry: 'Other', flag: '🌍' },
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
