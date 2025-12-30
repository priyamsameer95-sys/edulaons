/**
 * Shared loan configuration constants
 * Used across partner modals for consistent validation
 */

export const LOAN_LIMITS = {
  MIN: 100000,        // 1 Lakh
  MAX: 100000000,     // 10 Crore
  DEFAULT: 3000000,   // 30 Lakh
} as const;

export const SALARY_LIMITS = {
  MIN: 10000,         // 10 Thousand
  MAX: 100000000,     // 10 Crore
} as const;

export const formatLoanAmount = (amount: number): string => {
  if (amount >= 10000000) {
    const crores = amount / 10000000;
    return `₹${crores.toFixed(crores % 1 === 0 ? 0 : 2)} Cr`;
  }
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(lakhs % 1 === 0 ? 0 : 2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};
