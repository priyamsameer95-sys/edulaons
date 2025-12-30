/**
 * Currency Formatter Utility
 * Provides consistent formatting for monetary values across the platform
 * Using Indian numbering system: Thousand, Lakh, Crore
 */

// Word arrays for conversion
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

/**
 * Convert a number less than 100 to words
 */
const convertTwoDigits = (n: number): string => {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return tens[ten] + (one ? ' ' + ones[one] : '');
};

/**
 * Convert a number less than 1000 to words (handles hundreds)
 */
const convertHundreds = (n: number): string => {
  if (n === 0) return '';
  if (n < 100) return convertTwoDigits(n);
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  return ones[hundred] + ' Hundred' + (remainder ? ' ' + convertTwoDigits(remainder) : '');
};

/**
 * Convert any positive integer to words in Indian numbering system
 * Format: Crore, Lakh, Thousand, Hundred, remainder
 * Example: 45,50,010 => "Forty Five Lakh Fifty Thousand Ten"
 */
export const numberToWords = (n: number): string => {
  if (n === 0) return 'Zero';
  if (n < 0) return 'Negative ' + numberToWords(Math.abs(n));
  if (!Number.isFinite(n) || isNaN(n)) return '';
  
  // Round to integer - we don't handle decimals
  n = Math.round(n);
  
  const parts: string[] = [];
  
  // Crores (1 Crore = 1,00,00,000 = 10,000,000)
  if (n >= 10000000) {
    const crores = Math.floor(n / 10000000);
    parts.push(convertHundreds(crores) + ' Crore');
    n %= 10000000;
  }
  
  // Lakhs (1 Lakh = 1,00,000 = 100,000)
  if (n >= 100000) {
    const lakhs = Math.floor(n / 100000);
    parts.push(convertTwoDigits(lakhs) + ' Lakh');
    n %= 100000;
  }
  
  // Thousands (1 Thousand = 1,000)
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    parts.push(convertTwoDigits(thousands) + ' Thousand');
    n %= 1000;
  }
  
  // Hundreds and remainder
  if (n > 0) {
    parts.push(convertHundreds(n));
  }
  
  return parts.join(' ').trim();
};

/**
 * Convert amount to full Indian Rupee words format
 * Example: 450000 => "Rupees Four Lakh Fifty Thousand Only"
 * Example: 0 => "" (empty string)
 */
export const convertINRToWords = (value: string | number): string => {
  const num = typeof value === 'number' ? value : parseFormattedNumber(value);
  if (num === 0 || isNaN(num)) return '';
  
  const words = numberToWords(num);
  if (!words || words === 'Zero') return '';
  
  return `Rupees ${words} Only`;
};

/**
 * Legacy function - Convert amount to short words (for backward compatibility)
 * @deprecated Use convertINRToWords instead for full format
 */
export const amountToWords = (value: string | number): string => {
  return convertINRToWords(value);
};

// Format number with Indian comma separators (1,00,000)
export const formatIndianNumber = (value: string | number): string => {
  const numStr = typeof value === 'number' ? value.toString() : value;
  const num = numStr.replace(/,/g, '').replace(/\D/g, '');
  if (!num) return '';
  return parseInt(num).toLocaleString('en-IN');
};

// Parse formatted number to raw number
export const parseFormattedNumber = (value: string): number => {
  const num = value.replace(/,/g, '').replace(/\D/g, '');
  return parseInt(num) || 0;
};

// Format currency in compact Indian format (₹5L, ₹2Cr)
export const formatIndianCurrency = (value: number, compact = false): string => {
  if (!value || value === 0) return '₹0';
  
  if (compact) {
    if (value >= 10000000) {
      const crores = value / 10000000;
      return `₹${crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(1)}Cr`;
    }
    if (value >= 100000) {
      const lakhs = value / 100000;
      return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
    }
    if (value >= 1000) {
      const thousands = value / 1000;
      return `₹${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
    }
  }
  
  return `₹${value.toLocaleString('en-IN')}`;
};

// Format with rupee symbol and words display
export const formatCurrencyWithWords = (value: string | number): { formatted: string; words: string } => {
  const formatted = typeof value === 'number' 
    ? value.toLocaleString('en-IN') 
    : formatIndianNumber(value);
  const words = convertINRToWords(value);
  
  return { formatted, words };
};
