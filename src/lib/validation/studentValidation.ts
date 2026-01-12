/**
 * Zod validation schemas for student application
 */
import { z } from 'zod';
import { VALIDATION_RULES, ERROR_MESSAGES } from '@/constants/validationRules';

// Test Score Schema - Only validates if testScore is provided
export const testScoreSchema = z.object({
  testType: z.enum(['IELTS', 'TOEFL', 'GRE', 'GMAT', 'PTE', 'SAT']),
  testScore: z.number().optional(),
  testCertificateNumber: z.string().optional(),
  testDate: z.string().optional(),
}).refine((data) => {
  // Skip validation if no test score provided
  if (!data.testScore || data.testScore === 0) return true;
  
  const rules = VALIDATION_RULES.TEST_SCORES[data.testType];
  return data.testScore >= rules.MIN && data.testScore <= rules.MAX;
}, (data) => ({
  message: `${data.testType} score must be between ${VALIDATION_RULES.TEST_SCORES[data.testType].MIN} and ${VALIDATION_RULES.TEST_SCORES[data.testType].MAX}`,
  path: ['testScore'],
}));

// Personal Details Schema
export const personalDetailsSchema = z.object({
  name: z.string()
    .min(VALIDATION_RULES.NAME.MIN_LENGTH, ERROR_MESSAGES.NAME_TOO_SHORT)
    .max(VALIDATION_RULES.NAME.MAX_LENGTH, ERROR_MESSAGES.NAME_TOO_LONG)
    .regex(VALIDATION_RULES.NAME.PATTERN, ERROR_MESSAGES.NAME_INVALID),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string()
    .length(VALIDATION_RULES.PHONE.LENGTH, ERROR_MESSAGES.PHONE_INVALID)
    .regex(VALIDATION_RULES.PHONE.PATTERN, ERROR_MESSAGES.PHONE_INVALID),
  dateOfBirth: z.string().min(1, ERROR_MESSAGES.REQUIRED),
  gender: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string()
    .length(6, 'PIN code must be 6 digits')
    .regex(/^\d{6}$/, 'PIN code must be 6 digits')
    .optional()
    .or(z.literal('')),
  nationality: z.string().min(1, ERROR_MESSAGES.REQUIRED),
});

// Academic Background Schema
export const academicBackgroundSchema = z.object({
  highestQualification: z.enum(['phd', 'masters', 'bachelors', 'diploma', '12th'], {
    required_error: 'Please select your highest qualification',
    invalid_type_error: 'Please select your highest qualification',
  }),
  tenthPercentage: z.number()
    .min(VALIDATION_RULES.PERCENTAGE.MIN)
    .max(VALIDATION_RULES.PERCENTAGE.MAX)
    .optional(),
  twelfthPercentage: z.number()
    .min(VALIDATION_RULES.PERCENTAGE.MIN)
    .max(VALIDATION_RULES.PERCENTAGE.MAX)
    .optional(),
  bachelorsPercentage: z.number()
    .min(VALIDATION_RULES.PERCENTAGE.MIN)
    .max(VALIDATION_RULES.PERCENTAGE.MAX)
    .optional(),
  bachelorsCgpa: z.number()
    .min(VALIDATION_RULES.CGPA.MIN)
    .max(VALIDATION_RULES.CGPA.MAX)
    .optional(),
  tests: z.array(testScoreSchema).max(10).optional(),
});

// Study Details Schema - Base schema without refinements
// Note: intakeMonth=0 and intakeYear=0 means "Not sure yet"
const studyDetailsBaseSchema = z.object({
  universities: z.array(z.string())
    .min(VALIDATION_RULES.UNIVERSITIES.MIN_COUNT, ERROR_MESSAGES.UNIVERSITIES_MIN)
    .max(VALIDATION_RULES.UNIVERSITIES.MAX_COUNT, ERROR_MESSAGES.UNIVERSITIES_MAX),
  studyDestination: z.string().min(1, ERROR_MESSAGES.REQUIRED),
  courseName: z.string().max(VALIDATION_RULES.COURSE_NAME.MAX_LENGTH).optional(),
  loanType: z.enum(['secured', 'unsecured']),
  intakeMonth: z.number().min(0).max(12), // 0 = "Not sure yet"
  intakeYear: z.number().min(0), // 0 = "Not sure yet"
  loanAmount: z.number()
    .min(VALIDATION_RULES.LOAN_AMOUNT.MIN, ERROR_MESSAGES.LOAN_AMOUNT_TOO_LOW)
    .max(VALIDATION_RULES.LOAN_AMOUNT.MAX, ERROR_MESSAGES.LOAN_AMOUNT_TOO_HIGH),
});

// Export with type for external use
export const studyDetailsSchema = studyDetailsBaseSchema;

// Co-Applicant Details Schema
export const coApplicantDetailsSchema = z.object({
  coApplicantName: z.string()
    .min(VALIDATION_RULES.NAME.MIN_LENGTH, ERROR_MESSAGES.NAME_TOO_SHORT)
    .max(VALIDATION_RULES.NAME.MAX_LENGTH, ERROR_MESSAGES.NAME_TOO_LONG),
  coApplicantRelationship: z.enum(['parent', 'spouse', 'sibling', 'guardian', 'other']),
  coApplicantPhone: z.string()
    .length(VALIDATION_RULES.PHONE.LENGTH, ERROR_MESSAGES.PHONE_INVALID)
    .regex(VALIDATION_RULES.PHONE.PATTERN, ERROR_MESSAGES.PHONE_INVALID),
  coApplicantEmail: z.string().email('Invalid email address'),
  coApplicantMonthlySalary: z.number()
    .min(VALIDATION_RULES.SALARY.MIN, ERROR_MESSAGES.SALARY_INVALID)
    .max(VALIDATION_RULES.SALARY.MAX, ERROR_MESSAGES.SALARY_INVALID),
  coApplicantEmploymentType: z.enum(['salaried', 'self_employed', 'business_owner']),
  coApplicantOccupation: z.string().optional(),
  coApplicantEmployer: z.string().optional(),
  coApplicantEmploymentDuration: z.number().optional(),
  coApplicantPinCode: z.string()
    .length(6, 'PIN code must be 6 digits')
    .regex(/^\d{6}$/, 'PIN code must be 6 digits')
    .optional()
    .or(z.literal('')),
});

// Complete Application Schema - merge first, then apply refinements
export const studentApplicationSchema = personalDetailsSchema
  .merge(academicBackgroundSchema)
  .merge(studyDetailsBaseSchema)
  .merge(coApplicantDetailsSchema)
  .refine((data) => {
    // "Not sure yet" case - both are 0, which is valid
    if (data.intakeMonth === 0 && data.intakeYear === 0) {
      return true;
    }
    
    // If only one is 0 but not the other, invalid state
    if (data.intakeMonth === 0 || data.intakeYear === 0) {
      return false;
    }
    
    // Validate that intake date is in the future
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (data.intakeYear < currentYear || 
        (data.intakeYear === currentYear && data.intakeMonth < currentMonth)) {
      return false;
    }
    return true;
  }, {
    message: 'Intake date must be in the future or select "Not sure yet"',
    path: ['intakeMonth'],
  });

// Export type inference
export type PersonalDetailsInput = z.infer<typeof personalDetailsSchema>;
export type AcademicBackgroundInput = z.infer<typeof academicBackgroundSchema>;
export type StudyDetailsInput = z.infer<typeof studyDetailsSchema>;
export type CoApplicantDetailsInput = z.infer<typeof coApplicantDetailsSchema>;
export type StudentApplicationInput = z.infer<typeof studentApplicationSchema>;
