import { z } from 'zod';
import { VALIDATION_PATTERNS, MIN_AGE, MIN_LOAN_AMOUNT } from '@/constants/studentApplication';

/**
 * Centralized validation schemas using Zod
 * Provides type-safe validation with detailed error messages
 */

// Personal Details Schema
export const personalDetailsSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name contains invalid characters'),
  
  phone: z.string()
    .regex(VALIDATION_PATTERNS.phone, 'Enter valid 10-digit phone number starting with 6-9'),
  
  dateOfBirth: z.string()
    .refine((date) => {
      const age = Math.floor(
        (new Date().getTime() - new Date(date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      return age >= MIN_AGE;
    }, `You must be at least ${MIN_AGE} years old`),
  
  gender: z.string().min(1, 'Please select your gender'),
  
  city: z.string().min(2, 'City name is required'),
  
  state: z.string().min(2, 'State name is required'),
  
  postalCode: z.string()
    .regex(VALIDATION_PATTERNS.postalCode, 'Enter valid 6-digit postal code'),
  
  qualification: z.string().min(1, 'Please select your qualification'),
});

// Study Details Schema
export const studyDetailsSchema = z.object({
  studyDestination: z.string().min(1, 'Please select study destination'),
  
  universities: z.array(z.string())
    .min(1, 'Please select at least one university')
    .max(3, 'You can select up to 3 universities'),
  
  course: z.string().min(1, 'Please select or enter a course'),
  
  loanType: z.enum(['secured', 'unsecured'], {
    errorMap: () => ({ message: 'Please select loan type' }),
  }),
  
  intakeMonth: z.number()
    .min(1, 'Invalid month')
    .max(12, 'Invalid month'),
  
  intakeYear: z.number()
    .min(new Date().getFullYear(), 'Intake year cannot be in the past')
    .max(new Date().getFullYear() + 3, 'Intake year is too far in the future'),
  
  loanAmount: z.number()
    .min(MIN_LOAN_AMOUNT, `Minimum loan amount is ₹${(MIN_LOAN_AMOUNT / 100000).toFixed(0)} Lakhs`)
    .max(10000000, 'Loan amount exceeds maximum limit'),
});

// Co-Applicant Details Schema
export const coApplicantDetailsSchema = z.object({
  coApplicantName: z.string()
    .min(2, 'Co-applicant name must be at least 2 characters')
    .max(100, 'Name is too long'),
  
  coApplicantRelationship: z.string().min(1, 'Please select relationship'),
  
  coApplicantPhone: z.string()
    .regex(VALIDATION_PATTERNS.phone, 'Enter valid 10-digit phone number'),
  
  coApplicantEmail: z.string()
    .email('Enter valid email address')
    .max(255, 'Email is too long'),
  
  coApplicantSalary: z.number()
    .min(0, 'Income cannot be negative')
    .max(100000000, 'Income value seems incorrect'),
  
  coApplicantPinCode: z.string()
    .regex(VALIDATION_PATTERNS.pinCode, 'Enter valid 6-digit PIN code'),
});

// Complete Application Schema
export const completeApplicationSchema = personalDetailsSchema
  .merge(studyDetailsSchema)
  .merge(coApplicantDetailsSchema);

// Type exports
export type PersonalDetailsData = z.infer<typeof personalDetailsSchema>;
export type StudyDetailsData = z.infer<typeof studyDetailsSchema>;
export type CoApplicantDetailsData = z.infer<typeof coApplicantDetailsSchema>;
export type CompleteApplicationData = z.infer<typeof completeApplicationSchema>;

/**
 * Validate a specific step
 */
export function validateStep(step: number, data: any): { isValid: boolean; errors: Record<string, string> } {
  try {
    let schema;
    
    switch (step) {
      case 0:
        schema = personalDetailsSchema;
        break;
      case 1:
        schema = studyDetailsSchema;
        break;
      case 2:
        schema = coApplicantDetailsSchema;
        break;
      default:
        return { isValid: true, errors: {} };
    }
    
    schema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { _general: 'Validation failed' } };
  }
}

/**
 * Validate complete application before submission
 */
export function validateCompleteApplication(data: any): { 
  isValid: boolean; 
  errors: Record<string, string>;
  missingFields: string[];
} {
  try {
    completeApplicationSchema.parse(data);
    return { isValid: true, errors: {}, missingFields: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      const missingFields: string[] = [];
      
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          const field = err.path[0].toString();
          errors[field] = err.message;
          missingFields.push(field);
        }
      });
      
      return { isValid: false, errors, missingFields };
    }
    return { isValid: false, errors: { _general: 'Validation failed' }, missingFields: [] };
  }
}
