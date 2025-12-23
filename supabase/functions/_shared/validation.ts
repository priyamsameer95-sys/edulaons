/**
 * Unified Validation Module for Edge Functions
 * 
 * This module provides comprehensive validation rules that match
 * the frontend validationRules.ts for consistent data integrity.
 */

// ============================================
// VALIDATION RULES (mirroring frontend constants)
// ============================================

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
  EMAIL: {
    MAX_LENGTH: 255,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
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
  
  // Intake
  INTAKE_MONTH: {
    MIN: 1,
    MAX: 12,
  },
  INTAKE_YEAR: {
    MIN_OFFSET: 0, // Current year minimum
    MAX_OFFSET: 3, // Max 3 years in future
  },
} as const;

// ============================================
// VALIDATION ERROR TYPES
// ============================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================
// INDIVIDUAL VALIDATORS
// ============================================

/**
 * Validate a name field (student, co-applicant)
 */
export function validateName(name: any, fieldName: string = 'name'): ValidationError | null {
  if (!name || typeof name !== 'string') {
    return { field: fieldName, message: `${fieldName} is required`, code: 'REQUIRED' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < VALIDATION_RULES.NAME.MIN_LENGTH) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${VALIDATION_RULES.NAME.MIN_LENGTH} characters`,
      code: 'TOO_SHORT',
      value: trimmed,
    };
  }
  
  if (trimmed.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
    return {
      field: fieldName,
      message: `${fieldName} cannot exceed ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`,
      code: 'TOO_LONG',
      value: trimmed,
    };
  }
  
  if (!VALIDATION_RULES.NAME.PATTERN.test(trimmed)) {
    return {
      field: fieldName,
      message: `${fieldName} should only contain letters, spaces, and hyphens`,
      code: 'INVALID_FORMAT',
      value: trimmed,
    };
  }
  
  return null;
}

/**
 * Clean and validate phone number
 */
export function cleanPhoneNumber(phone: string): string {
  return String(phone || '').trim().replace(/^\+91/, '').replace(/\D/g, '');
}

export function validatePhone(phone: any, fieldName: string = 'phone'): ValidationError | null {
  if (!phone) {
    return { field: fieldName, message: `${fieldName} is required`, code: 'REQUIRED' };
  }
  
  const cleaned = cleanPhoneNumber(phone);
  
  if (cleaned.length !== VALIDATION_RULES.PHONE.LENGTH) {
    return {
      field: fieldName,
      message: `${fieldName} must be exactly 10 digits`,
      code: 'INVALID_LENGTH',
      value: cleaned,
    };
  }
  
  if (!VALIDATION_RULES.PHONE.PATTERN.test(cleaned)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid Indian mobile number (starting with 6-9)`,
      code: 'INVALID_FORMAT',
      value: cleaned,
    };
  }
  
  return null;
}

/**
 * Validate postal/PIN code
 */
export function validatePostalCode(code: any, fieldName: string = 'postal_code'): ValidationError | null {
  if (!code) {
    return { field: fieldName, message: `${fieldName} is required`, code: 'REQUIRED' };
  }
  
  const trimmed = String(code).trim();
  
  if (!VALIDATION_RULES.POSTAL_CODE.PATTERN.test(trimmed)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid 6-digit PIN code`,
      code: 'INVALID_FORMAT',
      value: trimmed,
    };
  }
  
  return null;
}

/**
 * Validate email address
 */
export function validateEmail(email: any, fieldName: string = 'email', required: boolean = true): ValidationError | null {
  if (!email) {
    if (required) {
      return { field: fieldName, message: `${fieldName} is required`, code: 'REQUIRED' };
    }
    return null;
  }
  
  const trimmed = String(email).trim().toLowerCase();
  
  if (trimmed.length > VALIDATION_RULES.EMAIL.MAX_LENGTH) {
    return {
      field: fieldName,
      message: `${fieldName} cannot exceed ${VALIDATION_RULES.EMAIL.MAX_LENGTH} characters`,
      code: 'TOO_LONG',
      value: trimmed,
    };
  }
  
  if (!VALIDATION_RULES.EMAIL.PATTERN.test(trimmed)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid email address`,
      code: 'INVALID_FORMAT',
      value: trimmed,
    };
  }
  
  return null;
}

/**
 * Validate loan amount
 */
export function validateLoanAmount(amount: any, fieldName: string = 'loan_amount'): ValidationError | null {
  if (amount === undefined || amount === null || amount === '') {
    return { field: fieldName, message: `${fieldName} is required`, code: 'REQUIRED' };
  }
  
  const numAmount = typeof amount === 'number' ? amount : parseInt(String(amount), 10);
  
  if (isNaN(numAmount)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      code: 'INVALID_TYPE',
      value: amount,
    };
  }
  
  if (numAmount < VALIDATION_RULES.LOAN_AMOUNT.MIN) {
    return {
      field: fieldName,
      message: `Minimum loan amount is ₹${(VALIDATION_RULES.LOAN_AMOUNT.MIN / 100000).toFixed(0)} Lakhs`,
      code: 'TOO_LOW',
      value: numAmount,
    };
  }
  
  if (numAmount > VALIDATION_RULES.LOAN_AMOUNT.MAX) {
    return {
      field: fieldName,
      message: `Maximum loan amount is ₹${(VALIDATION_RULES.LOAN_AMOUNT.MAX / 100000).toFixed(0)} Lakhs`,
      code: 'TOO_HIGH',
      value: numAmount,
    };
  }
  
  return null;
}

/**
 * Validate monthly salary
 */
export function validateSalary(salary: any, fieldName: string = 'monthly_salary'): ValidationError | null {
  if (salary === undefined || salary === null || salary === '') {
    return { field: fieldName, message: `${fieldName} is required`, code: 'REQUIRED' };
  }
  
  const numSalary = typeof salary === 'number' ? salary : parseFloat(String(salary));
  
  if (isNaN(numSalary)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      code: 'INVALID_TYPE',
      value: salary,
    };
  }
  
  if (numSalary < VALIDATION_RULES.SALARY.MIN) {
    return {
      field: fieldName,
      message: `${fieldName} cannot be negative`,
      code: 'TOO_LOW',
      value: numSalary,
    };
  }
  
  if (numSalary > VALIDATION_RULES.SALARY.MAX) {
    return {
      field: fieldName,
      message: `${fieldName} exceeds maximum allowed value`,
      code: 'TOO_HIGH',
      value: numSalary,
    };
  }
  
  return null;
}

/**
 * Validate intake month and year
 */
export function validateIntake(month: any, year: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Validate month
  if (month === undefined || month === null || month === '') {
    errors.push({ field: 'intake_month', message: 'Intake month is required', code: 'REQUIRED' });
  } else {
    const numMonth = typeof month === 'number' ? month : parseInt(String(month), 10);
    
    if (isNaN(numMonth) || numMonth < VALIDATION_RULES.INTAKE_MONTH.MIN || numMonth > VALIDATION_RULES.INTAKE_MONTH.MAX) {
      errors.push({
        field: 'intake_month',
        message: 'Intake month must be between 1 and 12',
        code: 'INVALID_RANGE',
        value: month,
      });
    }
  }
  
  // Validate year
  if (year === undefined || year === null || year === '') {
    errors.push({ field: 'intake_year', message: 'Intake year is required', code: 'REQUIRED' });
  } else {
    const numYear = typeof year === 'number' ? year : parseInt(String(year), 10);
    const minYear = currentYear + VALIDATION_RULES.INTAKE_YEAR.MIN_OFFSET;
    const maxYear = currentYear + VALIDATION_RULES.INTAKE_YEAR.MAX_OFFSET;
    
    if (isNaN(numYear) || numYear < minYear || numYear > maxYear) {
      errors.push({
        field: 'intake_year',
        message: `Intake year must be between ${minYear} and ${maxYear}`,
        code: 'INVALID_RANGE',
        value: year,
      });
    }
    
    // Check if intake is in the past
    if (!isNaN(numYear) && month !== undefined) {
      const numMonth = typeof month === 'number' ? month : parseInt(String(month), 10);
      if (numYear === currentYear && numMonth < currentMonth) {
        errors.push({
          field: 'intake_month',
          message: 'Intake date cannot be in the past',
          code: 'IN_PAST',
          value: `${numMonth}/${numYear}`,
        });
      }
    }
  }
  
  return errors;
}

/**
 * Validate relationship enum
 */
const VALID_RELATIONSHIPS = ['parent', 'spouse', 'sibling', 'guardian', 'other'];

export function validateRelationship(relationship: any, fieldName: string = 'relationship'): ValidationError | null {
  if (!relationship) {
    return { field: fieldName, message: `${fieldName} is required`, code: 'REQUIRED' };
  }
  
  const trimmed = String(relationship).trim().toLowerCase();
  
  if (!VALID_RELATIONSHIPS.includes(trimmed)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${VALID_RELATIONSHIPS.join(', ')}`,
      code: 'INVALID_ENUM',
      value: relationship,
    };
  }
  
  return null;
}

/**
 * Validate country/study destination
 */
const VALID_COUNTRIES = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'Ireland', 'New Zealand', 'Other'];
const COUNTRY_MAPPING: Record<string, string> = {
  'United States': 'USA',
  'United States of America': 'USA',
  'United Kingdom': 'UK',
  'England': 'UK',
};

export function normalizeCountry(country: string): string {
  const trimmed = String(country).trim();
  return COUNTRY_MAPPING[trimmed] || trimmed;
}

export function validateCountry(country: any, fieldName: string = 'country'): ValidationError | null {
  if (!country) {
    return { field: fieldName, message: `${fieldName} is required`, code: 'REQUIRED' };
  }
  
  const normalized = normalizeCountry(country);
  
  if (!VALID_COUNTRIES.includes(normalized)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${VALID_COUNTRIES.join(', ')}`,
      code: 'INVALID_ENUM',
      value: country,
    };
  }
  
  return null;
}

/**
 * Validate loan type
 */
const VALID_LOAN_TYPES = ['secured', 'unsecured', 'hybrid'];

export function validateLoanType(loanType: any, fieldName: string = 'loan_type'): ValidationError | null {
  if (!loanType) {
    return { field: fieldName, message: `${fieldName} is required`, code: 'REQUIRED' };
  }
  
  const trimmed = String(loanType).trim().toLowerCase();
  
  if (!VALID_LOAN_TYPES.includes(trimmed)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${VALID_LOAN_TYPES.join(', ')}`,
      code: 'INVALID_ENUM',
      value: loanType,
    };
  }
  
  return null;
}

/**
 * Validate percentage (0-100)
 */
export function validatePercentage(value: any, fieldName: string, required: boolean = false): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    if (required) {
      return { field: fieldName, message: `${fieldName} is required`, code: 'REQUIRED' };
    }
    return null;
  }
  
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  
  if (isNaN(numValue)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      code: 'INVALID_TYPE',
      value,
    };
  }
  
  if (numValue < VALIDATION_RULES.PERCENTAGE.MIN || numValue > VALIDATION_RULES.PERCENTAGE.MAX) {
    return {
      field: fieldName,
      message: `${fieldName} must be between 0 and 100`,
      code: 'INVALID_RANGE',
      value: numValue,
    };
  }
  
  return null;
}

/**
 * Validate CGPA (0-10)
 */
export function validateCGPA(value: any, fieldName: string, required: boolean = false): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    if (required) {
      return { field: fieldName, message: `${fieldName} is required`, code: 'REQUIRED' };
    }
    return null;
  }
  
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  
  if (isNaN(numValue)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      code: 'INVALID_TYPE',
      value,
    };
  }
  
  if (numValue < VALIDATION_RULES.CGPA.MIN || numValue > VALIDATION_RULES.CGPA.MAX) {
    return {
      field: fieldName,
      message: `${fieldName} must be between 0 and 10`,
      code: 'INVALID_RANGE',
      value: numValue,
    };
  }
  
  return null;
}

/**
 * Validate test score based on test type
 */
export function validateTestScore(
  testType: string, 
  score: any, 
  fieldName: string = 'score'
): ValidationError | null {
  if (score === undefined || score === null || score === '') {
    return { field: fieldName, message: `${fieldName} is required for ${testType}`, code: 'REQUIRED' };
  }
  
  const numScore = typeof score === 'number' ? score : parseFloat(String(score));
  const upperTestType = testType.toUpperCase() as keyof typeof VALIDATION_RULES.TEST_SCORES;
  const rules = VALIDATION_RULES.TEST_SCORES[upperTestType];
  
  if (!rules) {
    return {
      field: 'test_type',
      message: `Unknown test type: ${testType}`,
      code: 'INVALID_ENUM',
      value: testType,
    };
  }
  
  if (isNaN(numScore)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      code: 'INVALID_TYPE',
      value: score,
    };
  }
  
  if (numScore < rules.MIN || numScore > rules.MAX) {
    return {
      field: fieldName,
      message: `${testType} score must be between ${rules.MIN} and ${rules.MAX}`,
      code: 'INVALID_RANGE',
      value: numScore,
    };
  }
  
  return null;
}

// ============================================
// COMPREHENSIVE VALIDATORS
// ============================================

/**
 * Validate student data
 */
export function validateStudentData(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Required fields
  const nameError = validateName(data.student_name, 'student_name');
  if (nameError) errors.push(nameError);
  
  const phoneError = validatePhone(data.student_phone, 'student_phone');
  if (phoneError) errors.push(phoneError);
  
  const pinCodeError = validatePostalCode(data.student_pin_code, 'student_pin_code');
  if (pinCodeError) errors.push(pinCodeError);
  
  // Optional email (validate format if provided)
  const emailError = validateEmail(data.student_email, 'student_email', false);
  if (emailError) errors.push(emailError);
  
  // Optional academic scores
  if (data.tenth_percentage !== undefined) {
    const tenthError = validatePercentage(data.tenth_percentage, 'tenth_percentage');
    if (tenthError) errors.push(tenthError);
  }
  
  if (data.twelfth_percentage !== undefined) {
    const twelfthError = validatePercentage(data.twelfth_percentage, 'twelfth_percentage');
    if (twelfthError) errors.push(twelfthError);
  }
  
  if (data.bachelors_percentage !== undefined) {
    const bachelorsError = validatePercentage(data.bachelors_percentage, 'bachelors_percentage');
    if (bachelorsError) errors.push(bachelorsError);
  }
  
  if (data.bachelors_cgpa !== undefined) {
    const cgpaError = validateCGPA(data.bachelors_cgpa, 'bachelors_cgpa');
    if (cgpaError) errors.push(cgpaError);
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validate co-applicant data
 */
export function validateCoApplicantData(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Required fields
  const nameError = validateName(data.co_applicant_name, 'co_applicant_name');
  if (nameError) errors.push(nameError);
  
  const phoneError = validatePhone(data.co_applicant_phone, 'co_applicant_phone');
  if (phoneError) errors.push(phoneError);
  
  const pinCodeError = validatePostalCode(data.co_applicant_pin_code, 'co_applicant_pin_code');
  if (pinCodeError) errors.push(pinCodeError);
  
  const relationshipError = validateRelationship(data.co_applicant_relationship, 'co_applicant_relationship');
  if (relationshipError) errors.push(relationshipError);
  
  const salaryError = validateSalary(data.co_applicant_monthly_salary, 'co_applicant_monthly_salary');
  if (salaryError) errors.push(salaryError);
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validate loan/study details
 */
export function validateLoanDetails(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Country validation
  const countryError = validateCountry(data.country, 'country');
  if (countryError) errors.push(countryError);
  
  // Loan amount validation
  const loanAmountField = data.loan_amount !== undefined ? 'loan_amount' : 'amount_requested';
  const loanAmount = data.loan_amount || data.amount_requested;
  const amountError = validateLoanAmount(loanAmount, loanAmountField);
  if (amountError) errors.push(amountError);
  
  // Loan type validation (optional, defaults to 'unsecured')
  if (data.loan_type) {
    const loanTypeError = validateLoanType(data.loan_type, 'loan_type');
    if (loanTypeError) errors.push(loanTypeError);
  }
  
  // Intake validation
  const intakeErrors = validateIntake(data.intake_month, data.intake_year);
  errors.push(...intakeErrors);
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validate test scores array
 */
export function validateTestScores(tests: any[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!Array.isArray(tests)) {
    return { isValid: true, errors: [] }; // Optional field
  }
  
  tests.forEach((test, index) => {
    if (!test.test_type) {
      errors.push({
        field: `tests[${index}].test_type`,
        message: 'Test type is required',
        code: 'REQUIRED',
      });
      return;
    }
    
    const scoreError = validateTestScore(test.test_type, test.score, `tests[${index}].score`);
    if (scoreError) errors.push(scoreError);
  });
  
  return { isValid: errors.length === 0, errors };
}

// ============================================
// FULL REQUEST VALIDATORS
// ============================================

/**
 * Validate full lead creation request (partner/admin creating lead)
 */
export function validateCreateLeadRequest(body: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validate student data
  const studentResult = validateStudentData(body);
  errors.push(...studentResult.errors);
  
  // Validate co-applicant data
  const coApplicantResult = validateCoApplicantData(body);
  errors.push(...coApplicantResult.errors);
  
  // Validate loan details
  const loanResult = validateLoanDetails(body);
  errors.push(...loanResult.errors);
  
  // Validate test scores if provided
  if (body.tests) {
    const testResult = validateTestScores(body.tests);
    errors.push(...testResult.errors);
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validate student-initiated lead request (lighter validation)
 */
export function validateStudentLeadRequest(body: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Required: name, phone, country, loan_amount
  const nameError = validateName(body.student_name, 'student_name');
  if (nameError) errors.push(nameError);
  
  const phoneError = validatePhone(body.student_phone, 'student_phone');
  if (phoneError) errors.push(phoneError);
  
  const countryError = validateCountry(body.country, 'country');
  if (countryError) errors.push(countryError);
  
  const amountError = validateLoanAmount(body.loan_amount, 'loan_amount');
  if (amountError) errors.push(amountError);
  
  // Optional fields with validation if provided
  if (body.student_pin_code) {
    const pinError = validatePostalCode(body.student_pin_code, 'student_pin_code');
    if (pinError) errors.push(pinError);
  }
  
  if (body.student_email) {
    const emailError = validateEmail(body.student_email, 'student_email', false);
    if (emailError) errors.push(emailError);
  }
  
  // Co-applicant validation if provided
  if (body.co_applicant_name) {
    const coNameError = validateName(body.co_applicant_name, 'co_applicant_name');
    if (coNameError) errors.push(coNameError);
  }
  
  if (body.co_applicant_phone) {
    const coPhoneError = validatePhone(body.co_applicant_phone, 'co_applicant_phone');
    if (coPhoneError) errors.push(coPhoneError);
  }
  
  if (body.co_applicant_monthly_salary) {
    const salaryError = validateSalary(body.co_applicant_monthly_salary, 'co_applicant_monthly_salary');
    if (salaryError) errors.push(salaryError);
  }
  
  if (body.co_applicant_relationship) {
    const relationError = validateRelationship(body.co_applicant_relationship, 'co_applicant_relationship');
    if (relationError) errors.push(relationError);
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validate quick lead request (minimal validation)
 */
export function validateQuickLeadRequest(body: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Minimal required fields for quick lead
  const nameError = validateName(body.student_name, 'student_name');
  if (nameError) errors.push(nameError);
  
  const phoneError = validatePhone(body.student_phone, 'student_phone');
  if (phoneError) errors.push(phoneError);
  
  const countryError = validateCountry(body.country, 'country');
  if (countryError) errors.push(countryError);
  
  const amountError = validateLoanAmount(body.loan_amount, 'loan_amount');
  if (amountError) errors.push(amountError);
  
  return { isValid: errors.length === 0, errors };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format validation errors for API response
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 1) {
    return errors[0].message;
  }
  
  return `Validation failed: ${errors.map(e => e.message).join('; ')}`;
}

/**
 * Check if string is a valid UUID
 */
export function isUUID(str: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof str === 'string' && uuidPattern.test(str);
}

/**
 * Separate university IDs (UUIDs) from custom university names
 */
export function separateUniversities(universities: any[]): { uuids: string[]; custom: string[] } {
  const uuids: string[] = [];
  const custom: string[] = [];
  
  if (!Array.isArray(universities)) {
    return { uuids, custom };
  }
  
  universities.forEach(uni => {
    if (uni && typeof uni === 'string' && uni.trim()) {
      if (isUUID(uni)) {
        uuids.push(uni);
      } else {
        custom.push(uni.trim());
      }
    }
  });
  
  return { uuids, custom };
}
