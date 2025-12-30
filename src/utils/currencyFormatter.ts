/**
 * Currency Formatter Utility
 * Provides consistent formatting for monetary values across the platform
 */

// Convert number to words (for Indian number system)
export const numberToWords = (n: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (n === 0) return 'Zero';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  return n.toString();
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

// Convert amount to words in Indian format (Lakhs/Crores)
export const amountToWords = (value: string | number): string => {
  const num = typeof value === 'number' ? value : parseFormattedNumber(value);
  if (num === 0) return '';
  
  // Crores (1 Crore = 10,000,000)
  if (num >= 10000000) {
    const crores = num / 10000000;
    const wholeCrores = Math.floor(crores);
    const decimalPart = Math.round((crores - wholeCrores) * 100);
    if (decimalPart === 0) {
      return `${numberToWords(wholeCrores)} Crore`;
    }
    return `${numberToWords(wholeCrores)}.${decimalPart.toString().padStart(2, '0')} Crore`;
  }
  
  // Lakhs (1 Lakh = 100,000)
  if (num >= 100000) {
    const lakhs = num / 100000;
    const wholeLakhs = Math.floor(lakhs);
    const decimalPart = Math.round((lakhs - wholeLakhs) * 100);
    if (decimalPart === 0) {
      return `${numberToWords(wholeLakhs)} Lakh`;
    }
    return `${numberToWords(wholeLakhs)}.${decimalPart.toString().padStart(2, '0')} Lakh`;
  }
  
  // Thousands (1 Thousand = 1,000)
  if (num >= 1000) {
    const thousands = num / 1000;
    const wholeThousands = Math.floor(thousands);
    const decimalPart = Math.round((thousands - wholeThousands) * 10);
    if (decimalPart === 0) {
      return `${numberToWords(wholeThousands)} Thousand`;
    }
    return `${wholeThousands}.${decimalPart} Thousand`;
  }
  
  return `₹${num.toLocaleString('en-IN')}`;
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
  const words = amountToWords(value);
  
  return { formatted, words };
};
