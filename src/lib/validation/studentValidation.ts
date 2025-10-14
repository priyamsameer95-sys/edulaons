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
  phone: z.string()
    .length(VALIDATION_RULES.PHONE.LENGTH, ERROR_MESSAGES.PHONE_INVALID)
    .regex(VALIDATION_RULES.PHONE.PATTERN, ERROR_MESSAGES.PHONE_INVALID),
  dateOfBirth: z.string().min(1, ERROR_MESSAGES.REQUIRED),
  gender: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string()
    .length(VALIDATION_RULES.POSTAL_CODE.LENGTH, ERROR_MESSAGES.POSTAL_CODE_INVALID)
    .regex(VALIDATION_RULES.POSTAL_CODE.PATTERN, ERROR_MESSAGES.POSTAL_CODE_INVALID),
  nationality: z.string().min(1, ERROR_MESSAGES.REQUIRED),
});

// Academic Background Schema
export const academicBackgroundSchema = z.object({
  highestQualification: z.enum(['phd', 'masters', 'bachelors', 'diploma', '12th']),
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

// Study Details Schema
export const studyDetailsSchema = z.object({
  universities: z.array(z.string())
    .min(VALIDATION_RULES.UNIVERSITIES.MIN_COUNT, ERROR_MESSAGES.UNIVERSITIES_MIN)
    .max(VALIDATION_RULES.UNIVERSITIES.MAX_COUNT, ERROR_MESSAGES.UNIVERSITIES_MAX),
  studyDestination: z.string().min(1, ERROR_MESSAGES.REQUIRED),
  courseName: z.string().max(VALIDATION_RULES.COURSE_NAME.MAX_LENGTH).optional(),
  loanType: z.enum(['secured', 'unsecured']),
  intakeMonth: z.number().min(1).max(12),
  intakeYear: z.number().min(new Date().getFullYear()),
  loanAmount: z.number()
    .min(VALIDATION_RULES.LOAN_AMOUNT.MIN, ERROR_MESSAGES.LOAN_AMOUNT_TOO_LOW)
    .max(VALIDATION_RULES.LOAN_AMOUNT.MAX, ERROR_MESSAGES.LOAN_AMOUNT_TOO_HIGH),
});

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
    .length(VALIDATION_RULES.POSTAL_CODE.LENGTH, ERROR_MESSAGES.POSTAL_CODE_INVALID)
    .regex(VALIDATION_RULES.POSTAL_CODE.PATTERN, ERROR_MESSAGES.POSTAL_CODE_INVALID),
});

// Complete Application Schema
export const studentApplicationSchema = personalDetailsSchema
  .merge(academicBackgroundSchema)
  .merge(studyDetailsSchema)
  .merge(coApplicantDetailsSchema);

// Export type inference
export type PersonalDetailsInput = z.infer<typeof personalDetailsSchema>;
export type AcademicBackgroundInput = z.infer<typeof academicBackgroundSchema>;
export type StudyDetailsInput = z.infer<typeof studyDetailsSchema>;
export type CoApplicantDetailsInput = z.infer<typeof coApplicantDetailsSchema>;
export type StudentApplicationInput = z.infer<typeof studentApplicationSchema>;
