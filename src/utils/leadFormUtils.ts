/**
 * Shared types and utilities for lead creation forms
 */

import { Validators, validateForm, ValidationResult } from "@/utils/validation";
import { STUDY_DESTINATIONS, RELATIONSHIPS, Relationship, StudyDestination } from "@/types/selection";

// Re-export for convenience
export { STUDY_DESTINATIONS, RELATIONSHIPS };
export type { Relationship, StudyDestination };

/**
 * Quick lead form data structure
 */
export interface QuickLeadFormData {
  student_name: string;
  student_phone: string;
  student_email: string;
  student_pin_code: string;
  country: string;
  university_id: string;
  loan_amount: string;
  co_applicant_relationship: string;
  co_applicant_name: string;
  co_applicant_monthly_salary: string;
}

/**
 * Complete lead form data (additional fields for completing a quick lead)
 */
export interface CompleteLeadFormData {
  course_id: string;
  co_applicant_phone: string;
  co_applicant_pin_code: string;
}

export type QuickLeadFormErrors = Partial<Record<keyof QuickLeadFormData, string>>;
export type CompleteLeadFormErrors = Partial<Record<keyof CompleteLeadFormData, string>>;

/**
 * Initial form data for quick lead creation
 */
export const INITIAL_QUICK_LEAD_FORM: QuickLeadFormData = {
  student_name: "",
  student_phone: "",
  student_email: "",
  student_pin_code: "",
  country: "",
  university_id: "",
  loan_amount: "",
  co_applicant_relationship: "",
  co_applicant_name: "",
  co_applicant_monthly_salary: "",
};

/**
 * Initial form data for completing a lead
 */
export const INITIAL_COMPLETE_LEAD_FORM: CompleteLeadFormData = {
  course_id: "",
  co_applicant_phone: "",
  co_applicant_pin_code: "",
};

/**
 * Validate quick lead form
 */
export function validateQuickLeadForm(data: QuickLeadFormData): { 
  isValid: boolean; 
  errors: QuickLeadFormErrors;
} {
  const schema = {
    student_name: Validators.name("Student name", true, 2),
    student_phone: Validators.phone(true),
    student_email: Validators.email(false), // optional
    student_pin_code: Validators.pinCode(true),
    country: Validators.required("Study destination"),
    university_id: { validate: () => ({ isValid: true }) }, // optional
    loan_amount: Validators.currency("Loan amount", 100000, 10000000, true),
    co_applicant_relationship: Validators.required("Relationship"),
    co_applicant_name: Validators.name("Co-applicant name", true, 2),
    co_applicant_monthly_salary: Validators.currency("Monthly salary", 10000, undefined, true),
  };

  return validateForm(data, schema);
}

/**
 * Validate complete lead form
 */
export function validateCompleteLeadForm(data: CompleteLeadFormData): {
  isValid: boolean;
  errors: CompleteLeadFormErrors;
} {
  const schema = {
    course_id: {
      validate: (value: string) => {
        if (!value.trim()) {
          return { isValid: false, error: "Please select or enter a course/program" };
        }
        return { isValid: true };
      },
    },
    co_applicant_phone: Validators.phone(true),
    co_applicant_pin_code: Validators.pinCode(true),
  };

  return validateForm(data, schema);
}

/**
 * Format currency input for Indian numbering system
 */
export function formatCurrencyInput(value: string): string {
  const num = value.replace(/,/g, '').replace(/\D/g, '');
  if (!num) return '';
  return parseInt(num).toLocaleString('en-IN');
}

/**
 * Parse currency string to number
 */
export function parseCurrencyInput(value: string): number {
  return parseInt(value.replace(/,/g, '') || '0');
}

/**
 * Number to words for Indian currency
 */
export function numberToWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  return n.toString();
}

/**
 * Convert amount to words with Indian denomination
 */
export function getAmountInWords(value: string | number): string {
  const num = typeof value === 'string' ? parseInt(value.replace(/,/g, '') || '0') : value;
  if (num === 0) return '';
  
  if (num >= 10000000) {
    const crores = num / 10000000;
    const wholeCrores = Math.floor(crores);
    const decimalPart = Math.round((crores - wholeCrores) * 100);
    if (decimalPart === 0) {
      return `${numberToWords(wholeCrores)} Crore`;
    }
    return `${numberToWords(wholeCrores)}.${decimalPart.toString().padStart(2, '0')} Crore`;
  }
  
  if (num >= 100000) {
    const lakhs = num / 100000;
    const wholeLakhs = Math.floor(lakhs);
    const decimalPart = Math.round((lakhs - wholeLakhs) * 100);
    if (decimalPart === 0) {
      return `${numberToWords(wholeLakhs)} Lakh`;
    }
    return `${numberToWords(wholeLakhs)}.${decimalPart.toString().padStart(2, '0')} Lakh`;
  }
  
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
}

/**
 * Calculate lead quality score based on filled fields
 */
export function calculateLeadQualityScore(data: QuickLeadFormData): {
  score: number;
  missingFields: string[];
  message: string;
  stars: number;
} {
  let score = 0;
  const missingFields: string[] = [];
  
  if (data.student_email.trim()) {
    score += 20;
  } else {
    missingFields.push('email');
  }
  
  if (data.university_id) {
    score += 20;
  } else {
    missingFields.push('university');
  }
  
  if (data.co_applicant_name.trim() && data.co_applicant_monthly_salary) {
    score += 20;
  }
  
  // Loan amount in sweet spot (15-50L)
  const loanNum = parseCurrencyInput(data.loan_amount);
  if (loanNum >= 1500000 && loanNum <= 5000000) {
    score += 20;
  } else if (loanNum > 0) {
    score += 10;
  }
  
  if (data.student_pin_code.trim()) {
    score += 20;
  }
  
  let message = "Complete profile for better lender matching";
  if (score >= 80) {
    message = "Great lead! High conversion potential.";
  } else if (missingFields.includes('email')) {
    message = "Adding email improves student response by 40%";
  } else if (missingFields.includes('university')) {
    message = "University selection speeds up lender matching";
  }
  
  return {
    score,
    missingFields,
    message,
    stars: Math.round(score / 20),
  };
}

/**
 * Prepare quick lead data for API submission
 */
export function prepareQuickLeadPayload(data: QuickLeadFormData) {
  return {
    student_name: data.student_name.trim(),
    student_phone: data.student_phone.replace(/\D/g, ''),
    student_email: data.student_email.trim() || undefined,
    student_pin_code: data.student_pin_code.trim(),
    country: data.country,
    university_id: data.university_id || undefined,
    loan_amount: parseCurrencyInput(data.loan_amount),
    co_applicant_relationship: data.co_applicant_relationship,
    co_applicant_name: data.co_applicant_name.trim(),
    co_applicant_monthly_salary: parseCurrencyInput(data.co_applicant_monthly_salary),
  };
}

/**
 * Months for intake selection
 */
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

/**
 * Format intake date from month and year
 */
export function formatIntakeDate(month: number | null, year: number | null): string | null {
  if (month && year) {
    return `${MONTHS[month - 1]} ${year}`;
  }
  return null;
}
