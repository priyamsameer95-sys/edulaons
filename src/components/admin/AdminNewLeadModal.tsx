import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, GraduationCap, Users, ChevronDown, Building2, CheckCircle2, AlertCircle, XCircle, Plus, Trash2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { UniversitySelector } from '@/components/ui/university-selector';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { CourseCombobox } from '@/components/ui/course-combobox';
import { PartnerCombobox, PartnerOption } from '@/components/ui/partner-combobox';
import { supabase } from '@/integrations/supabase/client';
import { LoadingButton } from '@/components/ui/loading-button';
import { VALIDATION_RULES, ERROR_MESSAGES } from '@/constants/validationRules';
import { parseApiError, normalizeEmail, SUCCESS_COPY, getToastVariant } from '@/utils/apiErrors';
import { ALL_STATES_AND_UTS } from '@/constants/indianStates';
import { 
  GENDER_OPTIONS, 
  OCCUPATION_OPTIONS, 
  EMPLOYMENT_TYPE_OPTIONS,
  QUALIFICATION_OPTIONS,
  TEST_TYPES,
} from '@/utils/leadCompletionSchema';

interface AdminNewLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  partners: PartnerOption[];
  defaultPartnerId?: string | null;
}

interface AcademicTest {
  test_type: string;
  score: string;
  test_date: string;
  expiry_date: string;
}

interface FormData {
  partner_id: string;
  // Student basic fields
  student_name: string;
  student_phone: string;
  student_email: string;
  student_pin_code: string;
  // Student additional fields (Phase 1)
  student_dob: string;
  student_gender: string;
  student_city: string;
  student_state: string;
  student_nationality: string;
  student_street_address: string;
  student_highest_qualification: string;
  student_tenth_percentage: string;
  student_twelfth_percentage: string;
  student_bachelors_percentage: string;
  student_bachelors_cgpa: string;
  student_credit_score: string;
  // Study fields
  country: string;
  universities: string[];
  course_id: string;
  is_custom_course: boolean;
  intake_month: string;
  loan_type: 'secured' | 'unsecured' | '';
  amount_requested: string;
  // Co-applicant basic fields
  co_applicant_name: string;
  co_applicant_phone: string;
  co_applicant_salary: string;
  co_applicant_relationship: string;
  co_applicant_pin_code: string;
  // Co-applicant additional fields (Phase 2)
  co_applicant_email: string;
  co_applicant_occupation: string;
  co_applicant_employer: string;
  co_applicant_employment_type: string;
  co_applicant_employment_duration: string;
  co_applicant_credit_score: string;
}

interface FieldErrors {
  [key: string]: string | null;
}

interface TouchedFields {
  [key: string]: boolean;
}

const countries = [
  'USA', 'Canada', 'UK', 'Australia', 'Germany', 'Ireland', 'New Zealand', 'Other'
];

const relationships = [
  { value: 'parent', label: 'Parent' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

// Field validation component
function FieldWrapper({ 
  children, 
  label, 
  required, 
  error, 
  touched, 
  isValid,
  helperText,
  id,
}: { 
  children: React.ReactNode; 
  label: string; 
  required?: boolean;
  error?: string | null;
  touched?: boolean;
  isValid?: boolean;
  helperText?: string;
  id?: string;
}) {
  const showError = touched && error;
  const showValid = touched && isValid && !error;
  
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
        {showValid && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
      </Label>
      {children}
      {showError && (
        <p className="text-xs text-destructive flex items-center gap-1" role="alert" id={`${id}-error`}>
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {helperText && !showError && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

export const AdminNewLeadModal = ({ open, onOpenChange, onSuccess, partners, defaultPartnerId }: AdminNewLeadModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [coApplicantOpen, setCoApplicantOpen] = useState(true);
  const [studentDetailsOpen, setStudentDetailsOpen] = useState(false);
  const [academicHistoryOpen, setAcademicHistoryOpen] = useState(false);
  const [employmentDetailsOpen, setEmploymentDetailsOpen] = useState(false);
  const [testsOpen, setTestsOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [topLevelError, setTopLevelError] = useState<string | null>(null);
  const [academicTests, setAcademicTests] = useState<AcademicTest[]>([]);
  
  // Prevent double-submit
  const submitRef = useRef(false);
  const [formData, setFormData] = useState<FormData>({
    partner_id: '',
    student_name: '',
    student_phone: '',
    student_email: '',
    student_pin_code: '',
    student_dob: '',
    student_gender: '',
    student_city: '',
    student_state: '',
    student_nationality: 'Indian',
    student_street_address: '',
    student_highest_qualification: '',
    student_tenth_percentage: '',
    student_twelfth_percentage: '',
    student_bachelors_percentage: '',
    student_bachelors_cgpa: '',
    student_credit_score: '',
    country: '',
    universities: [''],
    course_id: '',
    is_custom_course: false,
    intake_month: '',
    loan_type: '',
    amount_requested: '',
    co_applicant_name: '',
    co_applicant_phone: '',
    co_applicant_salary: '',
    co_applicant_relationship: '',
    co_applicant_pin_code: '',
    co_applicant_email: '',
    co_applicant_occupation: '',
    co_applicant_employer: '',
    co_applicant_employment_type: '',
    co_applicant_employment_duration: '',
    co_applicant_credit_score: '',
  });

  const resetForm = useCallback(() => {
    setFormData({
      partner_id: defaultPartnerId || '',
      student_name: '',
      student_phone: '',
      student_email: '',
      student_pin_code: '',
      student_dob: '',
      student_gender: '',
      student_city: '',
      student_state: '',
      student_nationality: 'Indian',
      student_street_address: '',
      student_highest_qualification: '',
      student_tenth_percentage: '',
      student_twelfth_percentage: '',
      student_bachelors_percentage: '',
      student_bachelors_cgpa: '',
      student_credit_score: '',
      country: '',
      universities: [''],
      course_id: '',
      is_custom_course: false,
      intake_month: '',
      loan_type: '',
      amount_requested: '',
      co_applicant_name: '',
      co_applicant_phone: '',
      co_applicant_salary: '',
      co_applicant_relationship: '',
      co_applicant_pin_code: '',
      co_applicant_email: '',
      co_applicant_occupation: '',
      co_applicant_employer: '',
      co_applicant_employment_type: '',
      co_applicant_employment_duration: '',
      co_applicant_credit_score: '',
    });
    setAcademicTests([]);
    setErrors({});
    setTouched({});
    setTopLevelError(null);
    setStudentDetailsOpen(false);
    setAcademicHistoryOpen(false);
    setEmploymentDetailsOpen(false);
    setTestsOpen(false);
  }, [defaultPartnerId]);

  // Auto-select partner when modal opens with defaultPartnerId
  useEffect(() => {
    if (open && defaultPartnerId) {
      setFormData(prev => ({ ...prev, partner_id: defaultPartnerId }));
      setTouched(prev => ({ ...prev, partner_id: true }));
    }
  }, [open, defaultPartnerId]);

  // Validate a single field
  const validateField = (field: keyof FormData, value: string): string | null => {
    switch (field) {
      case 'partner_id':
        return !value ? 'Please select a partner' : null;
      
      case 'student_name':
      case 'co_applicant_name':
        if (!value.trim()) return ERROR_MESSAGES.REQUIRED;
        if (value.length < VALIDATION_RULES.NAME.MIN_LENGTH) return ERROR_MESSAGES.NAME_TOO_SHORT;
        if (value.length > VALIDATION_RULES.NAME.MAX_LENGTH) return ERROR_MESSAGES.NAME_TOO_LONG;
        if (!VALIDATION_RULES.NAME.PATTERN.test(value)) return ERROR_MESSAGES.NAME_INVALID;
        return null;
      
      case 'student_phone':
      case 'co_applicant_phone':
        if (!value.trim()) return ERROR_MESSAGES.REQUIRED;
        if (!VALIDATION_RULES.PHONE.PATTERN.test(value)) return ERROR_MESSAGES.PHONE_INVALID;
        return null;
      
      case 'student_email':
      case 'co_applicant_email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return null;
      
      case 'student_pin_code':
      case 'co_applicant_pin_code':
        if (!value.trim()) return ERROR_MESSAGES.REQUIRED;
        if (!VALIDATION_RULES.POSTAL_CODE.PATTERN.test(value)) return ERROR_MESSAGES.POSTAL_CODE_INVALID;
        return null;
      
      case 'country':
        return !value ? 'Please select a country' : null;
      
      case 'intake_month':
        return !value ? 'Please select an intake month' : null;
      
      case 'loan_type':
        return !value ? 'Please select a loan type' : null;
      
      case 'amount_requested':
        if (!value) return ERROR_MESSAGES.REQUIRED;
        const amount = parseFloat(value);
        if (isNaN(amount) || amount < VALIDATION_RULES.LOAN_AMOUNT.MIN) return ERROR_MESSAGES.LOAN_AMOUNT_TOO_LOW;
        if (amount > VALIDATION_RULES.LOAN_AMOUNT.MAX) return ERROR_MESSAGES.LOAN_AMOUNT_TOO_HIGH;
        return null;
      
      case 'co_applicant_salary':
        if (!value.trim()) return ERROR_MESSAGES.REQUIRED;
        const salary = parseFloat(value);
        if (isNaN(salary) || salary <= 0) return ERROR_MESSAGES.SALARY_INVALID;
        return null;
      
      case 'co_applicant_relationship':
        return !value ? 'Please select a relationship' : null;
      
      // New validations for Phase 1-2 fields
      case 'student_dob':
        if (value) {
          const dob = new Date(value);
          const today = new Date();
          const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          if (age < 18) return 'Student must be at least 18 years old';
          if (age > 60) return 'Please verify date of birth';
        }
        return null;
      
      case 'student_tenth_percentage':
      case 'student_twelfth_percentage':
      case 'student_bachelors_percentage':
        if (value) {
          const num = parseFloat(value);
          if (isNaN(num) || num < 0 || num > 100) return 'Must be 0-100';
        }
        return null;
      
      case 'student_bachelors_cgpa':
        if (value) {
          const num = parseFloat(value);
          if (isNaN(num) || num < 0 || num > 10) return 'Must be 0-10';
        }
        return null;
      
      case 'student_credit_score':
      case 'co_applicant_credit_score':
        if (value) {
          const num = parseInt(value);
          if (isNaN(num) || num < 300 || num > 900) return 'Must be 300-900';
        }
        return null;
      
      case 'co_applicant_employment_duration':
        if (value) {
          const num = parseInt(value);
          if (isNaN(num) || num < 0 || num > 50) return 'Must be 0-50 years';
        }
        return null;
      
      default:
        return null;
    }
  };

  // Format number with Indian comma separators (e.g., 25,00,000)
  const formatIndianNumber = (num: string): string => {
    const n = num.replace(/,/g, '');
    if (!n || isNaN(Number(n))) return '';
    const x = n.split('.');
    let lastThree = x[0].slice(-3);
    const otherNumbers = x[0].slice(0, -3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    return x.length > 1 ? formatted + '.' + x[1] : formatted;
  };

  // Number to words helper
  const numberToWords = (n: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return n.toString();
  };

  // Convert amount to words
  const getAmountInWords = (value: string): string => {
    const num = parseInt(value.replace(/,/g, '') || '0');
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
  };

  // Loan amount in words
  const loanAmountInWords = useMemo(() => getAmountInWords(formData.amount_requested), [formData.amount_requested]);
  
  // Salary in words
  const salaryInWords = useMemo(() => getAmountInWords(formData.co_applicant_salary), [formData.co_applicant_salary]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    let processedValue = value;
    
    // Normalize email
    if (field === 'student_email' || field === 'co_applicant_email') {
      processedValue = value.toLowerCase().trim();
    }
    
    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    
    // Clear top-level error when user makes changes
    if (topLevelError) {
      setTopLevelError(null);
    }
  };

  const handleAmountChange = (displayValue: string) => {
    // Remove commas to get raw number
    const rawValue = displayValue.replace(/,/g, '');
    if (rawValue === '' || /^\d*$/.test(rawValue)) {
      setFormData((prev) => ({ ...prev, amount_requested: rawValue }));
      if (errors.amount_requested) {
        setErrors((prev) => ({ ...prev, amount_requested: null }));
      }
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field] as string);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleUniversitiesChange = useCallback((universities: string[]) => {
    setFormData((prev) => ({ ...prev, universities }));
  }, []);

  // Academic tests handlers
  const addAcademicTest = () => {
    if (academicTests.length < 5) {
      setAcademicTests(prev => [...prev, { test_type: '', score: '', test_date: '', expiry_date: '' }]);
    }
  };

  const removeAcademicTest = (index: number) => {
    setAcademicTests(prev => prev.filter((_, i) => i !== index));
  };

  const updateAcademicTest = (index: number, field: keyof AcademicTest, value: string) => {
    setAcademicTests(prev => prev.map((test, i) => 
      i === index ? { ...test, [field]: value } : test
    ));
  };

  const getTestMaxScore = (testType: string): number => {
    const test = TEST_TYPES.find(t => t.value === testType);
    return test?.maxScore || 100;
  };

  const validateTestScore = (testType: string, score: string): string | null => {
    if (!score) return null;
    const num = parseFloat(score);
    const test = TEST_TYPES.find(t => t.value === testType);
    if (!test) return null;
    
    const minScore = test.minScore || 0;
    if (isNaN(num) || num < minScore || num > test.maxScore) {
      return `${test.label}: ${minScore}-${test.maxScore}`;
    }
    return null;
  };

  // Check if form is valid for enabling submit button
  const isFormValid = useMemo(() => {
    const requiredFields: (keyof FormData)[] = [
      'partner_id', 'student_name', 'student_phone', 'student_pin_code',
      'country', 'intake_month', 'loan_type', 'amount_requested',
      'co_applicant_name', 'co_applicant_phone', 'co_applicant_salary',
      'co_applicant_relationship', 'co_applicant_pin_code'
    ];
    
    return requiredFields.every(field => {
      const value = formData[field] as string;
      return value && !validateField(field, value);
    });
  }, [formData]);

  const validateAllFields = (): boolean => {
    const allFields: (keyof FormData)[] = [
      'partner_id', 'student_name', 'student_phone', 'student_email', 'student_pin_code',
      'student_dob', 'student_tenth_percentage', 'student_twelfth_percentage',
      'student_bachelors_percentage', 'student_bachelors_cgpa', 'student_credit_score',
      'country', 'intake_month', 'loan_type', 'amount_requested',
      'co_applicant_name', 'co_applicant_phone', 'co_applicant_salary',
      'co_applicant_relationship', 'co_applicant_pin_code', 'co_applicant_email',
      'co_applicant_employment_duration', 'co_applicant_credit_score'
    ];
    
    const fieldLabels: Record<string, string> = {
      partner_id: 'Partner',
      student_name: 'Student Name',
      student_phone: 'Student Phone',
      student_email: 'Student Email',
      student_pin_code: 'Student PIN Code',
      student_dob: 'Date of Birth',
      student_tenth_percentage: '10th Percentage',
      student_twelfth_percentage: '12th Percentage',
      student_bachelors_percentage: 'Bachelors Percentage',
      student_bachelors_cgpa: 'Bachelors CGPA',
      student_credit_score: 'Student Credit Score',
      country: 'Country',
      intake_month: 'Intake Month',
      loan_type: 'Loan Type',
      amount_requested: 'Loan Amount',
      co_applicant_name: 'Co-Applicant Name',
      co_applicant_phone: 'Co-Applicant Phone',
      co_applicant_salary: 'Co-Applicant Salary',
      co_applicant_relationship: 'Co-Applicant Relationship',
      co_applicant_pin_code: 'Co-Applicant PIN Code',
      co_applicant_email: 'Co-Applicant Email',
      co_applicant_employment_duration: 'Employment Duration',
      co_applicant_credit_score: 'Co-Applicant Credit Score',
    };
    
    const newErrors: FieldErrors = {};
    const newTouched: TouchedFields = {};
    const errorMessages: string[] = [];
    
    allFields.forEach(field => {
      newTouched[field] = true;
      const error = validateField(field, formData[field] as string);
      newErrors[field] = error;
      if (error) {
        errorMessages.push(`${fieldLabels[field] || field}: ${error}`);
      }
    });
    
    setTouched(newTouched);
    setErrors(newErrors);
    
    if (errorMessages.length > 0) {
      // Show the first 2 specific errors
      const displayErrors = errorMessages.slice(0, 2).join(' • ');
      const moreErrors = errorMessages.length > 2 ? ` (+${errorMessages.length - 2} more)` : '';
      
      toast({ 
        title: 'Please fix the errors', 
        description: displayErrors + moreErrors, 
        variant: 'destructive' 
      });
    }
    
    return errorMessages.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double-submit
    if (submitRef.current || loading) return;
    
    // Clear previous top-level error
    setTopLevelError(null);
    
    if (!validateAllFields()) return;

    submitRef.current = true;
    setLoading(true);
    
    try {
      // Process universities
      const processedUniversities = await Promise.all(
        formData.universities
          .filter((u) => u && u.trim())
          .map(async (uni) => {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uni);
            if (isUUID) return uni;

            const { data: newUni, error } = await supabase
              .from('universities')
              .insert({ name: uni.trim(), country: formData.country, city: 'Unknown' })
              .select('id')
              .single();

            if (error) throw new Error(`Failed to add university: ${uni}`);
            return newUni.id;
          })
      );

      // Parse intake_month "YYYY-MM" into separate year and month integers
      const [intakeYear, intakeMonth] = formData.intake_month.split('-').map(Number);

      // Normalize email before sending
      const normalizedEmail = formData.student_email ? normalizeEmail(formData.student_email) : undefined;

      const payload = {
        partner_id: formData.partner_id,
        student_name: formData.student_name.trim(),
        student_phone: formData.student_phone,
        student_email: normalizedEmail,
        student_pin_code: formData.student_pin_code,
        // New student fields
        student_date_of_birth: formData.student_dob || undefined,
        student_gender: formData.student_gender || undefined,
        student_city: formData.student_city || undefined,
        student_state: formData.student_state || undefined,
        student_nationality: formData.student_nationality || undefined,
        student_street_address: formData.student_street_address || undefined,
        student_highest_qualification: formData.student_highest_qualification || undefined,
        student_tenth_percentage: formData.student_tenth_percentage ? parseFloat(formData.student_tenth_percentage) : undefined,
        student_twelfth_percentage: formData.student_twelfth_percentage ? parseFloat(formData.student_twelfth_percentage) : undefined,
        student_bachelors_percentage: formData.student_bachelors_percentage ? parseFloat(formData.student_bachelors_percentage) : undefined,
        student_bachelors_cgpa: formData.student_bachelors_cgpa ? parseFloat(formData.student_bachelors_cgpa) : undefined,
        student_credit_score: formData.student_credit_score ? parseInt(formData.student_credit_score) : undefined,
        // Study fields
        country: formData.country,
        universities: processedUniversities,
        intake_month: intakeMonth,
        intake_year: intakeYear,
        loan_type: formData.loan_type,
        amount_requested: formData.amount_requested,
        // Co-applicant fields
        co_applicant_name: formData.co_applicant_name.trim(),
        co_applicant_phone: formData.co_applicant_phone,
        co_applicant_monthly_salary: formData.co_applicant_salary,
        co_applicant_relationship: formData.co_applicant_relationship,
        co_applicant_pin_code: formData.co_applicant_pin_code,
        // New co-applicant fields
        co_applicant_email: formData.co_applicant_email || undefined,
        co_applicant_occupation: formData.co_applicant_occupation || undefined,
        co_applicant_employer: formData.co_applicant_employer || undefined,
        co_applicant_employment_type: formData.co_applicant_employment_type || undefined,
        co_applicant_employment_duration_years: formData.co_applicant_employment_duration ? parseInt(formData.co_applicant_employment_duration) : undefined,
        co_applicant_credit_score: formData.co_applicant_credit_score ? parseInt(formData.co_applicant_credit_score) : undefined,
        // Academic tests
        academic_tests: academicTests.filter(t => t.test_type && t.score).map(t => ({
          test_type: t.test_type,
          score: t.score,
          test_date: t.test_date || undefined,
          expiry_date: t.expiry_date || undefined,
        })),
      };

      const { data, error } = await supabase.functions.invoke('create-lead', { body: payload });

      // Handle function invocation errors
      if (error) {
        console.error('[CreateLead] Function error:', error);
        const apiError = parseApiError(error.message);
        setTopLevelError(apiError.message);
        
        if (apiError.field) {
          setErrors(prev => ({ ...prev, [apiError.field!]: apiError.message }));
        }
        
        toast({
          title: 'Failed to Create Lead',
          description: apiError.message,
          variant: getToastVariant(apiError.type),
        });
        return;
      }
      
      // Handle errors in response data
      if (!data.success) {
        const errorMessage = data.error || 'Failed to create lead';
        console.error('[CreateLead] API error:', errorMessage);
        const apiError = parseApiError(errorMessage);
        setTopLevelError(apiError.message);
        
        if (apiError.field) {
          setErrors(prev => ({ ...prev, [apiError.field!]: apiError.message }));
        }
        
        toast({
          title: 'Failed to Create Lead',
          description: apiError.message,
          variant: getToastVariant(apiError.type),
        });
        return;
      }

      // SUCCESS - Only show green success after backend confirms
      toast({
        title: 'Success',
        description: SUCCESS_COPY.LEAD_CREATED,
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('[CreateLead] Exception:', error);
      const apiError = parseApiError(error);
      setTopLevelError(apiError.message);
      
      toast({
        title: 'Failed to Create Lead',
        description: apiError.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      submitRef.current = false;
    }
  };

  // Helper for loan type description
  const loanTypeHelperText = formData.loan_type === 'secured' 
    ? 'With collateral • Typically ₹10L – ₹1Cr'
    : formData.loan_type === 'unsecured'
    ? 'Without collateral • Typically ₹5L – ₹50L'
    : undefined;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => { if (!newOpen) resetForm(); onOpenChange(newOpen); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create Lead on Behalf of a Partner
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top-level error banner (Red) */}
          {topLevelError && (
            <Alert variant="destructive" className="border-destructive bg-destructive-light">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                {topLevelError}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Partner Selection */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <FieldWrapper
                label="Select Partner"
                required
                error={errors.partner_id}
                touched={touched.partner_id}
                isValid={!!formData.partner_id}
                id="partner_id"
              >
                <PartnerCombobox
                  partners={partners}
                  value={formData.partner_id || null}
                  onChange={(value) => {
                    handleInputChange('partner_id', value || '');
                    setTouched((prev) => ({ ...prev, partner_id: true }));
                  }}
                  placeholder="Search and select a partner..."
                  className="mt-1"
                />
              </FieldWrapper>
              <p className="text-xs text-muted-foreground mt-2">This lead will be attributed to the selected partner</p>
            </CardContent>
          </Card>

          {/* Student Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Student Information
              </CardTitle>
              <CardDescription className="text-xs">Primary applicant details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FieldWrapper
                  label="Full Name"
                  required
                  error={errors.student_name}
                  touched={touched.student_name}
                  isValid={!!formData.student_name && !validateField('student_name', formData.student_name)}
                  id="student_name"
                >
                  <Input
                    id="student_name"
                    value={formData.student_name}
                    onChange={(e) => handleInputChange('student_name', e.target.value)}
                    onBlur={() => handleBlur('student_name')}
                    placeholder="Full name as per PAN"
                    aria-required="true"
                    aria-invalid={!!errors.student_name}
                    aria-describedby={errors.student_name ? 'student_name-error' : undefined}
                    className={cn(
                      touched.student_name && errors.student_name && 'border-destructive focus-visible:ring-destructive',
                      touched.student_name && !errors.student_name && formData.student_name && 'border-green-500'
                    )}
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Mobile Number"
                  required
                  error={errors.student_phone}
                  touched={touched.student_phone}
                  isValid={!!formData.student_phone && !validateField('student_phone', formData.student_phone)}
                  helperText="10-digit Indian mobile number"
                  id="student_phone"
                >
                  <Input
                    id="student_phone"
                    value={formData.student_phone}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleInputChange('student_phone', value);
                    }}
                    onBlur={() => handleBlur('student_phone')}
                    placeholder="9876543210"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    aria-required="true"
                    aria-invalid={!!errors.student_phone}
                    aria-describedby={errors.student_phone ? 'student_phone-error' : undefined}
                    className={cn(
                      touched.student_phone && errors.student_phone && 'border-destructive focus-visible:ring-destructive',
                      touched.student_phone && !errors.student_phone && formData.student_phone && 'border-green-500'
                    )}
                  />
                </FieldWrapper>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FieldWrapper
                  label="Email"
                  error={errors.student_email}
                  touched={touched.student_email}
                  isValid={!!formData.student_email && !validateField('student_email', formData.student_email)}
                  helperText="Optional"
                  id="student_email"
                >
                  <Input
                    id="student_email"
                    type="email"
                    value={formData.student_email}
                    onChange={(e) => handleInputChange('student_email', e.target.value)}
                    onBlur={() => handleBlur('student_email')}
                    placeholder="student@example.com"
                    aria-invalid={!!errors.student_email}
                    aria-describedby={errors.student_email ? 'student_email-error' : undefined}
                    className={cn(
                      touched.student_email && errors.student_email && 'border-destructive focus-visible:ring-destructive',
                      touched.student_email && !errors.student_email && formData.student_email && 'border-green-500'
                    )}
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="PIN Code"
                  required
                  error={errors.student_pin_code}
                  touched={touched.student_pin_code}
                  isValid={!!formData.student_pin_code && !validateField('student_pin_code', formData.student_pin_code)}
                  helperText="6-digit postal code"
                  id="student_pin_code"
                >
                  <Input
                    id="student_pin_code"
                    value={formData.student_pin_code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      handleInputChange('student_pin_code', value);
                    }}
                    onBlur={() => handleBlur('student_pin_code')}
                    placeholder="110001"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    aria-required="true"
                    aria-invalid={!!errors.student_pin_code}
                    aria-describedby={errors.student_pin_code ? 'student_pin_code-error' : undefined}
                    className={cn(
                      touched.student_pin_code && errors.student_pin_code && 'border-destructive focus-visible:ring-destructive',
                      touched.student_pin_code && !errors.student_pin_code && formData.student_pin_code && 'border-green-500'
                    )}
                  />
                </FieldWrapper>
              </div>

              {/* Phase 1: Additional Student Details (Collapsible) */}
              <Collapsible open={studentDetailsOpen} onOpenChange={setStudentDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
                    <span className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      Additional Details
                    </span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', studentDetailsOpen && 'rotate-180')} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper
                      label="Date of Birth"
                      error={errors.student_dob}
                      touched={touched.student_dob}
                      id="student_dob"
                    >
                      <Input
                        id="student_dob"
                        type="date"
                        value={formData.student_dob}
                        onChange={(e) => handleInputChange('student_dob', e.target.value)}
                        onBlur={() => handleBlur('student_dob')}
                        className={cn(
                          touched.student_dob && errors.student_dob && 'border-destructive'
                        )}
                      />
                    </FieldWrapper>
                    <FieldWrapper label="Gender" id="student_gender">
                      <Select value={formData.student_gender} onValueChange={(v) => handleInputChange('student_gender', v)}>
                        <SelectTrigger id="student_gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map(g => (
                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldWrapper>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper label="City" id="student_city">
                      <Input
                        id="student_city"
                        value={formData.student_city}
                        onChange={(e) => handleInputChange('student_city', e.target.value)}
                        placeholder="Enter city"
                      />
                    </FieldWrapper>
                    <FieldWrapper label="State" id="student_state">
                      <Select value={formData.student_state} onValueChange={(v) => handleInputChange('student_state', v)}>
                        <SelectTrigger id="student_state">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STATES_AND_UTS.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldWrapper>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper label="Nationality" id="student_nationality">
                      <Input
                        id="student_nationality"
                        value={formData.student_nationality}
                        onChange={(e) => handleInputChange('student_nationality', e.target.value)}
                        placeholder="Indian"
                      />
                    </FieldWrapper>
                    <FieldWrapper label="Street Address" id="student_street_address">
                      <Input
                        id="student_street_address"
                        value={formData.student_street_address}
                        onChange={(e) => handleInputChange('student_street_address', e.target.value)}
                        placeholder="Enter address"
                      />
                    </FieldWrapper>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Phase 1: Academic History (Collapsible) */}
              <Collapsible open={academicHistoryOpen} onOpenChange={setAcademicHistoryOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Academic History
                    </span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', academicHistoryOpen && 'rotate-180')} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <FieldWrapper label="Highest Qualification" id="student_highest_qualification">
                    <Select value={formData.student_highest_qualification} onValueChange={(v) => handleInputChange('student_highest_qualification', v)}>
                      <SelectTrigger id="student_highest_qualification">
                        <SelectValue placeholder="Select qualification" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUALIFICATION_OPTIONS.map(q => (
                          <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldWrapper>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper
                      label="10th Percentage"
                      error={errors.student_tenth_percentage}
                      touched={touched.student_tenth_percentage}
                      helperText="0-100"
                      id="student_tenth_percentage"
                    >
                      <Input
                        id="student_tenth_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.student_tenth_percentage}
                        onChange={(e) => handleInputChange('student_tenth_percentage', e.target.value)}
                        onBlur={() => handleBlur('student_tenth_percentage')}
                        placeholder="85.5"
                        className={cn(touched.student_tenth_percentage && errors.student_tenth_percentage && 'border-destructive')}
                      />
                    </FieldWrapper>
                    <FieldWrapper
                      label="12th Percentage"
                      error={errors.student_twelfth_percentage}
                      touched={touched.student_twelfth_percentage}
                      helperText="0-100"
                      id="student_twelfth_percentage"
                    >
                      <Input
                        id="student_twelfth_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.student_twelfth_percentage}
                        onChange={(e) => handleInputChange('student_twelfth_percentage', e.target.value)}
                        onBlur={() => handleBlur('student_twelfth_percentage')}
                        placeholder="88.0"
                        className={cn(touched.student_twelfth_percentage && errors.student_twelfth_percentage && 'border-destructive')}
                      />
                    </FieldWrapper>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper
                      label="Bachelor's Percentage"
                      error={errors.student_bachelors_percentage}
                      touched={touched.student_bachelors_percentage}
                      helperText="0-100"
                      id="student_bachelors_percentage"
                    >
                      <Input
                        id="student_bachelors_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.student_bachelors_percentage}
                        onChange={(e) => handleInputChange('student_bachelors_percentage', e.target.value)}
                        onBlur={() => handleBlur('student_bachelors_percentage')}
                        placeholder="75.0"
                        className={cn(touched.student_bachelors_percentage && errors.student_bachelors_percentage && 'border-destructive')}
                      />
                    </FieldWrapper>
                    <FieldWrapper
                      label="Bachelor's CGPA"
                      error={errors.student_bachelors_cgpa}
                      touched={touched.student_bachelors_cgpa}
                      helperText="0-10"
                      id="student_bachelors_cgpa"
                    >
                      <Input
                        id="student_bachelors_cgpa"
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={formData.student_bachelors_cgpa}
                        onChange={(e) => handleInputChange('student_bachelors_cgpa', e.target.value)}
                        onBlur={() => handleBlur('student_bachelors_cgpa')}
                        placeholder="8.5"
                        className={cn(touched.student_bachelors_cgpa && errors.student_bachelors_cgpa && 'border-destructive')}
                      />
                    </FieldWrapper>
                  </div>
                  <FieldWrapper
                    label="Credit Score"
                    error={errors.student_credit_score}
                    touched={touched.student_credit_score}
                    helperText="300-900 (optional)"
                    id="student_credit_score"
                  >
                    <Input
                      id="student_credit_score"
                      type="number"
                      min="300"
                      max="900"
                      value={formData.student_credit_score}
                      onChange={(e) => handleInputChange('student_credit_score', e.target.value)}
                      onBlur={() => handleBlur('student_credit_score')}
                      placeholder="750"
                      className={cn(touched.student_credit_score && errors.student_credit_score && 'border-destructive')}
                    />
                  </FieldWrapper>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Study Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Study Details
              </CardTitle>
              <CardDescription className="text-xs">Destination and loan information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FieldWrapper
                  label="Destination Country"
                  required
                  error={errors.country}
                  touched={touched.country}
                  isValid={!!formData.country}
                  id="country"
                >
                  <Select 
                    value={formData.country} 
                    onValueChange={(v) => {
                      handleInputChange('country', v);
                      setTouched((prev) => ({ ...prev, country: true }));
                    }}
                  >
                    <SelectTrigger 
                      id="country"
                      aria-required="true"
                      aria-invalid={!!errors.country}
                      className={cn(
                        touched.country && errors.country && 'border-destructive',
                        touched.country && !errors.country && formData.country && 'border-green-500'
                      )}
                    >
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldWrapper>
                <FieldWrapper
                  label="Intake"
                  required
                  error={errors.intake_month}
                  touched={touched.intake_month}
                  isValid={!!formData.intake_month}
                  id="intake_month"
                >
                  <MonthYearPicker 
                    value={formData.intake_month} 
                    onChange={(v) => {
                      handleInputChange('intake_month', v);
                      setTouched((prev) => ({ ...prev, intake_month: true }));
                    }}
                  />
                </FieldWrapper>
              </div>

              {formData.country && (
                <div>
                  <Label>University (Optional)</Label>
                  <UniversitySelector 
                    country={formData.country} 
                    universities={formData.universities} 
                    onChange={handleUniversitiesChange} 
                  />
                </div>
              )}

              {/* Course Selection - show when university is selected */}
              {formData.universities[0] && formData.universities[0].length > 10 && (
                <div>
                  <Label>Course / Program (Optional)</Label>
                  <CourseCombobox
                    universityId={formData.universities[0]}
                    value={formData.course_id}
                    onChange={(value, isCustom) => {
                      setFormData(prev => ({
                        ...prev,
                        course_id: value,
                        is_custom_course: isCustom || false
                      }));
                    }}
                    placeholder="Search or enter course name..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Select from available courses or enter a custom course name
                  </p>
                </div>
              )}

              <FieldWrapper
                label="Loan Type"
                required
                error={errors.loan_type}
                touched={touched.loan_type}
                isValid={!!formData.loan_type}
                helperText={loanTypeHelperText}
                id="loan_type"
              >
                <RadioGroup 
                  value={formData.loan_type} 
                  onValueChange={(v) => {
                    handleInputChange('loan_type', v as 'secured' | 'unsecured');
                    setTouched((prev) => ({ ...prev, loan_type: true }));
                  }}
                  className="flex gap-6 mt-1"
                  aria-required="true"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="secured" id="secured" />
                    <Label htmlFor="secured" className="font-normal cursor-pointer">Secured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="unsecured" id="unsecured" />
                    <Label htmlFor="unsecured" className="font-normal cursor-pointer">Unsecured</Label>
                  </div>
                </RadioGroup>
              </FieldWrapper>

              <FieldWrapper
                label="Loan Amount (₹)"
                required
                error={errors.amount_requested}
                touched={touched.amount_requested}
                isValid={!!formData.amount_requested && !validateField('amount_requested', formData.amount_requested)}
                helperText={loanAmountInWords || "Min: ₹1 Lakh • Max: ₹1 Crore"}
                id="amount_requested"
              >
                <Input
                  id="amount_requested"
                  type="text"
                  inputMode="numeric"
                  value={formatIndianNumber(formData.amount_requested)}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onBlur={() => handleBlur('amount_requested')}
                  placeholder="25,00,000"
                  aria-required="true"
                  aria-invalid={!!errors.amount_requested}
                  aria-describedby={errors.amount_requested ? 'amount_requested-error' : undefined}
                  className={cn(
                    touched.amount_requested && errors.amount_requested && 'border-destructive focus-visible:ring-destructive',
                    touched.amount_requested && !errors.amount_requested && formData.amount_requested && 'border-green-500'
                  )}
                />
              </FieldWrapper>
            </CardContent>
          </Card>

          {/* Co-Applicant */}
          <Collapsible open={coApplicantOpen} onOpenChange={setCoApplicantOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Co-Applicant Details
                    </span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', coApplicantOpen && 'rotate-180')} />
                  </CardTitle>
                  <CardDescription className="text-xs">Parent, guardian, or spouse details</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper
                      label="Full Name"
                      required
                      error={errors.co_applicant_name}
                      touched={touched.co_applicant_name}
                      isValid={!!formData.co_applicant_name && !validateField('co_applicant_name', formData.co_applicant_name)}
                      id="co_applicant_name"
                    >
                      <Input
                        id="co_applicant_name"
                        value={formData.co_applicant_name}
                        onChange={(e) => handleInputChange('co_applicant_name', e.target.value)}
                        onBlur={() => handleBlur('co_applicant_name')}
                        placeholder="Parent/Guardian name"
                        aria-required="true"
                        aria-invalid={!!errors.co_applicant_name}
                        className={cn(
                          touched.co_applicant_name && errors.co_applicant_name && 'border-destructive focus-visible:ring-destructive',
                          touched.co_applicant_name && !errors.co_applicant_name && formData.co_applicant_name && 'border-green-500'
                        )}
                      />
                    </FieldWrapper>
                    <FieldWrapper
                      label="Relationship"
                      required
                      error={errors.co_applicant_relationship}
                      touched={touched.co_applicant_relationship}
                      isValid={!!formData.co_applicant_relationship}
                      id="co_applicant_relationship"
                    >
                      <Select 
                        value={formData.co_applicant_relationship} 
                        onValueChange={(v) => {
                          handleInputChange('co_applicant_relationship', v);
                          setTouched((prev) => ({ ...prev, co_applicant_relationship: true }));
                        }}
                      >
                        <SelectTrigger
                          id="co_applicant_relationship"
                          aria-required="true"
                          aria-invalid={!!errors.co_applicant_relationship}
                          className={cn(
                            touched.co_applicant_relationship && errors.co_applicant_relationship && 'border-destructive',
                            touched.co_applicant_relationship && !errors.co_applicant_relationship && formData.co_applicant_relationship && 'border-green-500'
                          )}
                        >
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationships.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FieldWrapper>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper
                      label="Mobile Number"
                      required
                      error={errors.co_applicant_phone}
                      touched={touched.co_applicant_phone}
                      isValid={!!formData.co_applicant_phone && !validateField('co_applicant_phone', formData.co_applicant_phone)}
                      helperText="10-digit mobile number"
                      id="co_applicant_phone"
                    >
                      <Input
                        id="co_applicant_phone"
                        value={formData.co_applicant_phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          handleInputChange('co_applicant_phone', value);
                        }}
                        onBlur={() => handleBlur('co_applicant_phone')}
                        placeholder="9876543210"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        aria-required="true"
                        aria-invalid={!!errors.co_applicant_phone}
                        className={cn(
                          touched.co_applicant_phone && errors.co_applicant_phone && 'border-destructive focus-visible:ring-destructive',
                          touched.co_applicant_phone && !errors.co_applicant_phone && formData.co_applicant_phone && 'border-green-500'
                        )}
                      />
                    </FieldWrapper>
                    <FieldWrapper
                      label="Monthly Salary (₹)"
                      required
                      error={errors.co_applicant_salary}
                      touched={touched.co_applicant_salary}
                      isValid={!!formData.co_applicant_salary && !validateField('co_applicant_salary', formData.co_applicant_salary)}
                      helperText={salaryInWords || "Gross monthly income"}
                      id="co_applicant_salary"
                    >
                      <Input
                        id="co_applicant_salary"
                        type="text"
                        inputMode="numeric"
                        value={formatIndianNumber(formData.co_applicant_salary)}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/,/g, '');
                          if (rawValue === '' || /^\d*$/.test(rawValue)) {
                            handleInputChange('co_applicant_salary', rawValue);
                          }
                        }}
                        onBlur={() => handleBlur('co_applicant_salary')}
                        placeholder="50,000"
                        aria-required="true"
                        aria-invalid={!!errors.co_applicant_salary}
                        className={cn(
                          touched.co_applicant_salary && errors.co_applicant_salary && 'border-destructive focus-visible:ring-destructive',
                          touched.co_applicant_salary && !errors.co_applicant_salary && formData.co_applicant_salary && 'border-green-500'
                        )}
                      />
                    </FieldWrapper>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper
                      label="PIN Code"
                      required
                      error={errors.co_applicant_pin_code}
                      touched={touched.co_applicant_pin_code}
                      isValid={!!formData.co_applicant_pin_code && !validateField('co_applicant_pin_code', formData.co_applicant_pin_code)}
                      helperText="6-digit postal code"
                      id="co_applicant_pin_code"
                    >
                      <Input
                        id="co_applicant_pin_code"
                        value={formData.co_applicant_pin_code}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          handleInputChange('co_applicant_pin_code', value);
                        }}
                        onBlur={() => handleBlur('co_applicant_pin_code')}
                        placeholder="110001"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        aria-required="true"
                        aria-invalid={!!errors.co_applicant_pin_code}
                        className={cn(
                          touched.co_applicant_pin_code && errors.co_applicant_pin_code && 'border-destructive focus-visible:ring-destructive',
                          touched.co_applicant_pin_code && !errors.co_applicant_pin_code && formData.co_applicant_pin_code && 'border-green-500'
                        )}
                      />
                    </FieldWrapper>
                    <FieldWrapper
                      label="Email"
                      error={errors.co_applicant_email}
                      touched={touched.co_applicant_email}
                      helperText="Optional"
                      id="co_applicant_email"
                    >
                      <Input
                        id="co_applicant_email"
                        type="email"
                        value={formData.co_applicant_email}
                        onChange={(e) => handleInputChange('co_applicant_email', e.target.value)}
                        onBlur={() => handleBlur('co_applicant_email')}
                        placeholder="parent@example.com"
                        className={cn(touched.co_applicant_email && errors.co_applicant_email && 'border-destructive')}
                      />
                    </FieldWrapper>
                  </div>

                  {/* Phase 2: Employment Details (Collapsible) */}
                  <Collapsible open={employmentDetailsOpen} onOpenChange={setEmploymentDetailsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
                        <span className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5" />
                          Employment Details
                        </span>
                        <ChevronDown className={cn('h-4 w-4 transition-transform', employmentDetailsOpen && 'rotate-180')} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FieldWrapper label="Occupation" id="co_applicant_occupation">
                          <Select value={formData.co_applicant_occupation} onValueChange={(v) => handleInputChange('co_applicant_occupation', v)}>
                            <SelectTrigger id="co_applicant_occupation">
                              <SelectValue placeholder="Select occupation" />
                            </SelectTrigger>
                            <SelectContent>
                              {OCCUPATION_OPTIONS.map(o => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldWrapper>
                        <FieldWrapper label="Employer" id="co_applicant_employer">
                          <Input
                            id="co_applicant_employer"
                            value={formData.co_applicant_employer}
                            onChange={(e) => handleInputChange('co_applicant_employer', e.target.value)}
                            placeholder="Company name"
                          />
                        </FieldWrapper>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FieldWrapper label="Employment Type" id="co_applicant_employment_type">
                          <Select value={formData.co_applicant_employment_type} onValueChange={(v) => handleInputChange('co_applicant_employment_type', v)}>
                            <SelectTrigger id="co_applicant_employment_type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {EMPLOYMENT_TYPE_OPTIONS.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldWrapper>
                        <FieldWrapper
                          label="Employment Duration (Years)"
                          error={errors.co_applicant_employment_duration}
                          touched={touched.co_applicant_employment_duration}
                          helperText="0-50"
                          id="co_applicant_employment_duration"
                        >
                          <Input
                            id="co_applicant_employment_duration"
                            type="number"
                            min="0"
                            max="50"
                            value={formData.co_applicant_employment_duration}
                            onChange={(e) => handleInputChange('co_applicant_employment_duration', e.target.value)}
                            onBlur={() => handleBlur('co_applicant_employment_duration')}
                            placeholder="5"
                            className={cn(touched.co_applicant_employment_duration && errors.co_applicant_employment_duration && 'border-destructive')}
                          />
                        </FieldWrapper>
                      </div>
                      <FieldWrapper
                        label="Credit Score"
                        error={errors.co_applicant_credit_score}
                        touched={touched.co_applicant_credit_score}
                        helperText="300-900 (optional)"
                        id="co_applicant_credit_score"
                      >
                        <Input
                          id="co_applicant_credit_score"
                          type="number"
                          min="300"
                          max="900"
                          value={formData.co_applicant_credit_score}
                          onChange={(e) => handleInputChange('co_applicant_credit_score', e.target.value)}
                          onBlur={() => handleBlur('co_applicant_credit_score')}
                          placeholder="750"
                          className={cn(touched.co_applicant_credit_score && errors.co_applicant_credit_score && 'border-destructive')}
                        />
                      </FieldWrapper>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Phase 3: Academic Tests */}
          <Collapsible open={testsOpen} onOpenChange={setTestsOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Test Scores
                      {academicTests.length > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {academicTests.length}
                        </span>
                      )}
                    </span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', testsOpen && 'rotate-180')} />
                  </CardTitle>
                  <CardDescription className="text-xs">IELTS, TOEFL, GRE, GMAT, etc. (Optional)</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  {academicTests.map((test, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Test Type</Label>
                          <Select value={test.test_type} onValueChange={(v) => updateAcademicTest(index, 'test_type', v)}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select test" />
                            </SelectTrigger>
                            <SelectContent>
                              {TEST_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Score {test.test_type && `(max: ${getTestMaxScore(test.test_type)})`}</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={test.score}
                            onChange={(e) => updateAcademicTest(index, 'score', e.target.value)}
                            placeholder="Score"
                            className={cn("h-9", validateTestScore(test.test_type, test.score) && 'border-destructive')}
                          />
                          {validateTestScore(test.test_type, test.score) && (
                            <p className="text-xs text-destructive">{validateTestScore(test.test_type, test.score)}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Test Date</Label>
                          <Input
                            type="date"
                            value={test.test_date}
                            onChange={(e) => updateAcademicTest(index, 'test_date', e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Expiry Date</Label>
                          <Input
                            type="date"
                            value={test.expiry_date}
                            onChange={(e) => updateAcademicTest(index, 'expiry_date', e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeAcademicTest(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {academicTests.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={addAcademicTest}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Test Score
                    </Button>
                  )}
                  
                  {academicTests.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No test scores added. Click above to add IELTS, TOEFL, GRE, etc.
                    </p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={loading}
              tabIndex={0}
            >
              Cancel
            </Button>
            <LoadingButton 
              type="submit" 
              loading={loading} 
              loadingText="Creating Lead..."
              disabled={!isFormValid}
              className="min-w-[140px]"
              tabIndex={0}
            >
              Create Lead
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
