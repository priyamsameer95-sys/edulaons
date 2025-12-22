/**
 * Shared validation utilities for forms
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => ValidationResult;
}

/**
 * Validate a single field value against rules
 */
export function validateField(
  value: string,
  rules: ValidationRules,
  fieldName: string
): ValidationResult {
  const trimmedValue = value?.trim() ?? '';

  // Required check
  if (rules.required && !trimmedValue) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  // Skip other validations if empty and not required
  if (!trimmedValue) {
    return { isValid: true };
  }

  // Min length check
  if (rules.minLength && trimmedValue.length < rules.minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${rules.minLength} characters`,
    };
  }

  // Max length check
  if (rules.maxLength && trimmedValue.length > rules.maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at most ${rules.maxLength} characters`,
    };
  }

  // Pattern check
  if (rules.pattern && !rules.pattern.test(trimmedValue)) {
    return { isValid: false, error: `Invalid ${fieldName.toLowerCase()} format` };
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(trimmedValue);
  }

  return { isValid: true };
}

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/,
  pinCode: /^\d{6}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  name: /^[a-zA-Z\s'-]+$/,
} as const;

// Pre-built validators
export const Validators = {
  required: (fieldName: string) => ({
    validate: (value: string) => validateField(value, { required: true }, fieldName),
  }),

  email: (required = true) => ({
    validate: (value: string) =>
      validateField(value, { required, pattern: ValidationPatterns.email }, 'Email'),
  }),

  phone: (required = true) => ({
    validate: (value: string) => {
      const cleaned = value.replace(/\D/g, '');
      if (required && !cleaned) {
        return { isValid: false, error: 'Phone number is required' };
      }
      if (cleaned && cleaned.length !== 10) {
        return { isValid: false, error: 'Phone must be 10 digits' };
      }
      if (cleaned && !/^[6-9]/.test(cleaned)) {
        return { isValid: false, error: 'Invalid phone number' };
      }
      return { isValid: true };
    },
  }),

  pinCode: (required = true) => ({
    validate: (value: string) =>
      validateField(value, { required, pattern: ValidationPatterns.pinCode }, 'PIN Code'),
  }),

  name: (fieldName: string, required = true, minLength = 2) => ({
    validate: (value: string) =>
      validateField(value, { required, minLength }, fieldName),
  }),

  currency: (fieldName: string, min?: number, max?: number, required = true) => ({
    validate: (value: string) => {
      const numValue = parseInt(value.replace(/,/g, '') || '0');
      
      if (required && !value) {
        return { isValid: false, error: `${fieldName} is required` };
      }
      
      if (min !== undefined && numValue < min) {
        return { isValid: false, error: `${fieldName} must be at least ₹${min.toLocaleString('en-IN')}` };
      }
      
      if (max !== undefined && numValue > max) {
        return { isValid: false, error: `${fieldName} must be at most ₹${max.toLocaleString('en-IN')}` };
      }
      
      return { isValid: true };
    },
  }),
};

/**
 * Validate entire form data against a schema
 */
export function validateForm<T extends object>(
  data: T,
  schema: { [K in keyof T]?: { validate: (value: string) => ValidationResult } }
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(schema)) {
    if (!validator) continue;
    const value = String((data as any)[field] || '');
    const result = (validator as { validate: (value: string) => ValidationResult }).validate(value);
    
    if (!result.isValid) {
      errors[field as keyof T] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
}
