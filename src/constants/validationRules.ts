/**
 * Validation rules and constraints for student application
 */

export const VALIDATION_RULES = {
  // Personal Details
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s.'-]+$/,
  },
  PHONE: {
    LENGTH: 10,
    PATTERN: /^[6-9]\d{9}$/,
  },
  POSTAL_CODE: {
    LENGTH: 6,
    PATTERN: /^\d{6}$/,
  },
  
  // Academic
  PERCENTAGE: {
    MIN: 0,
    MAX: 100,
  },
  CGPA: {
    MIN: 0,
    MAX: 10,
  },
  
  // Test Scores
  TEST_SCORES: {
    IELTS: { MIN: 0, MAX: 9 },
    TOEFL: { MIN: 0, MAX: 120 },
    PTE: { MIN: 10, MAX: 90 },
    GRE: { MIN: 260, MAX: 340 },
    GMAT: { MIN: 200, MAX: 800 },
    SAT: { MIN: 400, MAX: 1600 },
  },
  
  // Study Details
  UNIVERSITIES: {
    MIN_COUNT: 1,
    MAX_COUNT: 3,
  },
  LOAN_AMOUNT: {
    MIN: 100000, // ₹1 Lakh
    MAX: 10000000, // ₹1 Crore
  },
  COURSE_NAME: {
    MAX_LENGTH: 200,
  },
  
  // Co-Applicant
  SALARY: {
    MIN: 0,
    MAX: 10000000, // ₹1 Crore/month
  },
} as const;

export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  
  // Personal
  NAME_INVALID: 'Name should only contain letters, spaces, and hyphens',
  NAME_TOO_SHORT: `Name must be at least ${VALIDATION_RULES.NAME.MIN_LENGTH} characters`,
  NAME_TOO_LONG: `Name cannot exceed ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`,
  PHONE_INVALID: 'Please enter a valid 10-digit Indian mobile number',
  POSTAL_CODE_INVALID: 'Please enter a valid 6-digit PIN code',
  
  // Academic
  PERCENTAGE_INVALID: 'Percentage must be between 0 and 100',
  CGPA_INVALID: 'CGPA must be between 0 and 10',
  
  // Study
  UNIVERSITIES_MIN: 'Please select at least one university',
  UNIVERSITIES_MAX: 'You can select up to 3 universities',
  LOAN_AMOUNT_TOO_LOW: `Minimum loan amount is ₹${(VALIDATION_RULES.LOAN_AMOUNT.MIN / 100000).toFixed(0)} Lakhs`,
  LOAN_AMOUNT_TOO_HIGH: `Maximum loan amount is ₹${(VALIDATION_RULES.LOAN_AMOUNT.MAX / 100000).toFixed(0)} Lakhs`,
  
  // Co-Applicant
  SALARY_INVALID: 'Please enter a valid monthly salary',
} as const;
