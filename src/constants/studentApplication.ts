// Study destinations - synced with StudentLanding.tsx COUNTRIES
export const STUDY_DESTINATIONS = [
  'USA',
  'UK',
  'Canada',
  'Australia',
  'Germany',
  'New Zealand',
  'Singapore',
  'Hong Kong SAR',
  'Japan',
  'Switzerland',
  'China',
  'Other'
] as const;

// Country code to full name mapping (for edge function)
export const COUNTRY_VALUE_MAP: Record<string, string> = {
  'USA': 'United States',
  'UK': 'United Kingdom',
  'Canada': 'Canada',
  'Australia': 'Australia',
  'Germany': 'Germany',
  'New Zealand': 'New Zealand',
  'Singapore': 'Singapore',
  'Hong Kong SAR': 'Hong Kong SAR',
  'Japan': 'Japan',
  'Switzerland': 'Switzerland',
  'China': 'China',
  'Other': 'Other',
};

export const LOAN_TYPES = {
  SECURED: 'secured',
  UNSECURED: 'unsecured'
} as const;

export const RELATIONSHIPS = [
  { value: 'parent', label: 'Parent' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' }
] as const;

export const QUALIFICATIONS = [
  { value: '12th', label: '12th Grade' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'phd', label: 'PhD' }
] as const;

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
] as const;

export const LOAN_AMOUNT_RANGES = {
  USA: { min: 2000000, max: 10000000, typical: '₹20-80 Lakhs' },
  UK: { min: 2000000, max: 8000000, typical: '₹20-60 Lakhs' },
  Canada: { min: 1500000, max: 8000000, typical: '₹15-60 Lakhs' },
  Australia: { min: 2000000, max: 7000000, typical: '₹20-50 Lakhs' },
  Germany: { min: 1000000, max: 4000000, typical: '₹10-30 Lakhs' },
  Ireland: { min: 1500000, max: 6000000, typical: '₹15-45 Lakhs' },
  'New Zealand': { min: 1500000, max: 6000000, typical: '₹15-45 Lakhs' },
  Other: { min: 500000, max: 5000000, typical: '₹5-40 Lakhs' }
} as const;

export const INCOME_INDICATORS = [
  { range: '₹3-5 Lakhs', label: 'Standard eligibility', color: 'text-yellow-600' },
  { range: '₹5-10 Lakhs', label: 'Good approval chances', color: 'text-blue-600' },
  { range: '₹10+ Lakhs', label: 'Excellent approval chances', color: 'text-green-600' }
] as const;

export const COACHING_MESSAGES = {
  name: "We need your legal name as it appears on your passport or ID documents",
  phone: "We'll use this to send you important updates. Make sure it's a number you check regularly!",
  dob: "You must be at least 16 years old to apply for an education loan",
  gender: "This is required by lenders for their application forms",
  city: "Your current city of residence",
  state: "Your current state of residence",
  postalCode: "Your area's postal code (6 digits)",
  qualification: "Your highest completed education qualification",
  universities: "Select up to 3 universities you're applying to. We'll match you with the best lenders for these institutions.",
  course: "The specific program you want to study (e.g., Master of Science in Computer Science)",
  studyDestination: "Which country will you be studying in?",
  loanType: "Choose based on whether you can provide collateral (property/FD) or prefer a no-collateral loan",
  intakeMonth: "When does your program start?",
  loanAmount: "How much funding do you need? This should cover tuition + living expenses",
  coApplicantName: "Most lenders require a co-applicant (usually a parent or guardian) who can support your loan application",
  coApplicantRelationship: "Your relationship with the co-applicant. 90% of students choose 'Parent'",
  coApplicantPhone: "Co-applicant's contact number",
  coApplicantEmail: "Co-applicant's email for important loan updates",
  coApplicantSalary: "Annual income of co-applicant. Higher income improves approval chances significantly.",
  coApplicantPinCode: "Co-applicant's area postal code"
} as const;

export const LOAN_TYPE_INFO = {
  secured: {
    title: 'Secured Loan',
    interestRate: '8-10% per annum',
    collateral: 'Required (Property/FD)',
    approvalRate: 'Higher approval rate',
    benefits: [
      'Lower interest rates',
      'Higher loan amounts available',
      'Better terms and conditions',
      'Suitable for large loan amounts'
    ]
  },
  unsecured: {
    title: 'Unsecured Loan',
    interestRate: '10-12% per annum',
    collateral: 'Not required',
    approvalRate: 'Based on co-applicant income',
    benefits: [
      'No collateral needed',
      'Faster processing',
      'Good for smaller amounts',
      'Based on income evaluation'
    ]
  }
} as const;

export const VALIDATION_PATTERNS = {
  phone: /^[6-9]\d{9}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  pinCode: /^\d{6}$/,
  postalCode: /^\d{6}$/
} as const;

export const MIN_AGE = 16;
export const MAX_UNIVERSITIES = 3;
export const MIN_LOAN_AMOUNT = 100000;

export const ACADEMIC_VALIDATION = {
  tenth: { min: 0, max: 100 },
  twelfth: { min: 0, max: 100 },
  bachelors_percentage: { min: 0, max: 100 },
  bachelors_cgpa: { min: 0, max: 10 },
  test_scores: {
    IELTS: { min: 0, max: 9 },
    TOEFL: { min: 0, max: 120 },
    GRE: { min: 260, max: 340 },
    GMAT: { min: 200, max: 800 },
    PTE: { min: 10, max: 90 },
    SAT: { min: 400, max: 1600 }
  }
} as const;

export const EMPLOYMENT_TYPES = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'business_owner', label: 'Business Owner' }
] as const;

/**
 * Test Eligibility Rules:
 * 
 * - Language Tests (IELTS, TOEFL, PTE):
 *   - Student can only add ONE language test
 *   - Available for all qualification levels
 * 
 * - SAT:
 *   - Only for students applying for Bachelor's or below
 *   - NOT shown for Masters/PhD students
 * 
 * - GRE/GMAT:
 *   - Only for students applying for Masters/PhD
 *   - NOT shown for Bachelor's or below
 * 
 * - No Duplicates:
 *   - Same test type cannot be added twice
 */
export const TEST_TYPES = [
  { 
    value: 'IELTS', 
    label: 'IELTS (0-9)', 
    max: 9,
    category: 'language' as const,
    eligibleFor: ['bachelors', 'masters', 'phd', 'diploma', '12th'] as const
  },
  { 
    value: 'TOEFL', 
    label: 'TOEFL (0-120)', 
    max: 120,
    category: 'language' as const,
    eligibleFor: ['bachelors', 'masters', 'phd', 'diploma', '12th'] as const
  },
  { 
    value: 'PTE', 
    label: 'PTE (10-90)', 
    max: 90,
    category: 'language' as const,
    eligibleFor: ['bachelors', 'masters', 'phd', 'diploma', '12th'] as const
  },
  { 
    value: 'GRE', 
    label: 'GRE (260-340)', 
    max: 340,
    category: 'aptitude' as const,
    eligibleFor: ['masters', 'phd'] as const
  },
  { 
    value: 'GMAT', 
    label: 'GMAT (200-800)', 
    max: 800,
    category: 'aptitude' as const,
    eligibleFor: ['masters', 'phd'] as const
  },
  { 
    value: 'SAT', 
    label: 'SAT (400-1600)', 
    max: 1600,
    category: 'aptitude' as const,
    eligibleFor: ['bachelors', '12th'] as const
  }
] as const;

export const TEST_CATEGORIES = {
  language: ['IELTS', 'TOEFL', 'PTE'],
  aptitude: ['GRE', 'GMAT', 'SAT']
} as const;
