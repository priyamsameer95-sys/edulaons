/**
 * Admin New Lead Modal
 * 
 * Refactored to reuse the same sub-components as AdminLeadEditModal.
 * This ensures consistency and reduces maintenance overhead.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { CollapsibleModal, CollapsibleSection } from '@/components/common/collapsible-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, GraduationCap, Users, Building2, CheckCircle2, AlertCircle, XCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PartnerCombobox, PartnerOption } from '@/components/ui/partner-combobox';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save } from "lucide-react";
import { parseApiError, normalizeEmail, SUCCESS_COPY, getToastVariant } from '@/utils/apiErrors';
import { useLenderRecommendationTrigger } from '@/hooks/useLenderRecommendationTrigger';

// Import Shared Sub-Components
import { EditStudentTab } from "./lead-edit/EditStudentTab";
import { EditStudyTab } from "./lead-edit/EditStudyTab";
import { EditCoApplicantTab } from "./lead-edit/EditCoApplicantTab";
import { EditTestsTab } from "./lead-edit/EditTestsTab";

interface AdminNewLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  partners: PartnerOption[];
  defaultPartnerId?: string | null;
}

interface AcademicTest {
  id?: string;
  test_type: string;
  score: string;
  test_date: string;
  expiry_date: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

// Validation constants needed for local checks
const VALIDATION_RULES = {
  NAME: { MIN_LENGTH: 2, MAX_LENGTH: 50, PATTERN: /^[a-zA-Z\s.-]+$/ },
  PHONE: { PATTERN: /^[6-9]\d{9}$/ },
  POSTAL_CODE: { PATTERN: /^[1-9][0-9]{5}$/ },
  LOAN_AMOUNT: { MIN: 100000, MAX: 20000000 },
};

const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  NAME_TOO_SHORT: 'Name must be at least 2 characters',
  NAME_TOO_LONG: 'Name must be less than 50 characters',
  NAME_INVALID: 'Name contains invalid characters',
  PHONE_INVALID: 'Invalid Indian mobile number',
  POSTAL_CODE_INVALID: 'Invalid 6-digit PIN code',
  LOAN_AMOUNT_TOO_LOW: 'Minimum loan amount is ₹1,00,000',
  LOAN_AMOUNT_TOO_HIGH: 'Maximum loan amount is ₹2,00,00,000',
  SALARY_INVALID: 'Please enter a valid salary amount',
};

// Field validation component
function FieldWrapper({
  children,
  label,
  required,
  error,
  touched,
  isValid,
  helperText,
  id
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
      {/* Label is usually handled inside the specialized tab components, 
          but if we need a wrapper, we can specific custom logic here.
          However, since we are using pre-built tabs, this might be less used 
          inside the tabs themselves, but is still useful for the Partner Selector 
      */}
      <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
        {showValid && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
      </label>
      {children}
      {showError && (
        <p className="text-xs text-destructive flex items-center gap-1" role="alert" id={`${id}-error`}>
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {helperText && !showError && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
}

// Consistent Options
const STUDY_DESTINATIONS = ['Australia', 'Canada', 'Germany', 'Ireland', 'New Zealand', 'UK', 'USA', 'Other'];
const LOAN_TYPES = ['secured', 'unsecured'];
const RELATIONSHIPS = ['parent', 'spouse', 'sibling', 'guardian', 'other'];
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('default', { month: 'long' }) }));
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'self-employed', label: 'Self-employed' },
];
const TEST_TYPES = [
  { value: 'IELTS', label: 'IELTS', maxScore: 9, minScore: 0 },
  { value: 'TOEFL', label: 'TOEFL', maxScore: 120, minScore: 0 },
  { value: 'PTE', label: 'PTE', maxScore: 90, minScore: 0 },
  { value: 'GRE', label: 'GRE', maxScore: 340, minScore: 130 },
  { value: 'GMAT', label: 'GMAT', maxScore: 800, minScore: 200 },
  { value: 'SAT', label: 'SAT', maxScore: 1600, minScore: 400 },
  { value: 'Duolingo', label: 'Duolingo', maxScore: 160, minScore: 10 },
];

interface FormData {
  partner_id: string;
  // Student fields - Aligned with EditStudentTab
  student_name: string;
  student_email: string;
  student_phone: string;
  student_postal_code: string;
  student_city: string;
  student_state: string;
  student_date_of_birth: string;
  student_gender: string;
  student_nationality: string;
  student_street_address: string;
  student_highest_qualification: string;
  student_tenth_percentage: string;
  student_twelfth_percentage: string;
  student_bachelors_percentage: string;
  student_bachelors_cgpa: string;
  student_credit_score: string;

  // Study fields - Aligned with EditStudyTab
  study_destination: string; // Was 'country' in old modal
  loan_amount: string; // Was 'amount_requested' in old modal
  loan_type: string;
  intake_month: string;
  intake_year: string;

  // Co-applicant fields - Aligned with EditCoApplicantTab
  co_applicant_name: string;
  co_applicant_relationship: string;
  co_applicant_phone: string;
  co_applicant_salary: string;
  co_applicant_pin_code: string; // Note: EditCoApplicantTab might not expose this explicitly if not in its UI yet, but we'll check props
  co_applicant_occupation: string;
  co_applicant_employer: string;
  co_applicant_email: string;
  co_applicant_employment_type: string;
  co_applicant_employment_duration: string;
  co_applicant_credit_score: string;

  // Admin notes logic (optional for creation)
  admin_notes: string;
}

const initialFormData: FormData = {
  partner_id: '',
  student_name: '',
  student_email: '',
  student_phone: '',
  student_postal_code: '',
  student_city: '',
  student_state: '',
  student_date_of_birth: '',
  student_gender: '',
  student_nationality: 'Indian',
  student_street_address: '',
  student_highest_qualification: '',
  student_tenth_percentage: '',
  student_twelfth_percentage: '',
  student_bachelors_percentage: '',
  student_bachelors_cgpa: '',
  student_credit_score: '',
  study_destination: '',
  loan_amount: '',
  loan_type: '',
  intake_month: '',
  intake_year: '',
  co_applicant_name: '',
  co_applicant_relationship: '',
  co_applicant_phone: '',
  co_applicant_salary: '',
  co_applicant_pin_code: '',
  co_applicant_occupation: '',
  co_applicant_employer: '',
  co_applicant_email: '',
  co_applicant_employment_type: '',
  co_applicant_employment_duration: '',
  co_applicant_credit_score: '',
  admin_notes: '',
};

export const AdminNewLeadModal = ({
  open,
  onOpenChange,
  onSuccess,
  partners,
  defaultPartnerId
}: AdminNewLeadModalProps) => {
  const { toast } = useToast();
  const { triggerRecommendation } = useLenderRecommendationTrigger();
  const [loading, setLoading] = useState(false);
  // activeTab state removed as we are now using a long-scrolling form with all sections open
  const [topLevelError, setTopLevelError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const [academicTests, setAcademicTests] = useState<AcademicTest[]>([]);
  const [universities, setUniversities] = useState<string[]>(['']);
  const [courseId, setCourseId] = useState<string>('');
  const [isCustomCourse, setIsCustomCourse] = useState(false);

  // Auto-select partner
  useEffect(() => {
    if (open && defaultPartnerId) {
      setFormData(prev => ({ ...prev, partner_id: defaultPartnerId }));
    }
  }, [open, defaultPartnerId]);

  const resetForm = useCallback(() => {
    setFormData({
      ...initialFormData,
      partner_id: defaultPartnerId || '',
    });
    setAcademicTests([]);
    setUniversities(['']);
    setCourseId('');
    setIsCustomCourse(false);
    setTopLevelError(null);
  }, [defaultPartnerId]);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTopLevelError(null);
  }, []);

  // Academic Test Handlers (Reused logic)
  const addAcademicTest = () => {
    if (academicTests.length < 5) {
      setAcademicTests(prev => [...prev, {
        test_type: '',
        score: '',
        test_date: '',
        expiry_date: '',
        isNew: true
      }]);
    }
  };
  const removeAcademicTest = (index: number) => {
    setAcademicTests(prev => prev.filter((_, i) => i !== index));
  };
  const updateAcademicTest = (index: number, field: keyof AcademicTest, value: string) => {
    setAcademicTests(prev => prev.map((test, i) => i === index ? { ...test, [field]: value } : test));
  };
  const getTestMaxScore = (testType: string) => TEST_TYPES.find(t => t.value === testType)?.maxScore || 100;
  const validateTestScore = (testType: string, score: string) => {
    if (!score) return true;
    const num = parseFloat(score);
    const test = TEST_TYPES.find(t => t.value === testType);
    return test ? num >= test.minScore && num <= test.maxScore : true;
  };

  const validateAllFields = (): boolean => {
    // Basic validation for required fields
    const required = [
      { key: 'partner_id', label: 'Partner' },
      { key: 'student_name', label: 'Student Name' },
      { key: 'student_phone', label: 'Student Phone' },
      { key: 'student_postal_code', label: 'Student PIN Code' },
      { key: 'study_destination', label: 'Study Country' },
      { key: 'loan_amount', label: 'Loan Amount' },
      { key: 'co_applicant_name', label: 'Co-Applicant Name' },
      { key: 'co_applicant_phone', label: 'Co-Applicant Phone' },
      { key: 'co_applicant_salary', label: 'Co-Applicant Salary' },
    ];

    for (const field of required) {
      if (!formData[field.key as keyof FormData]) {
        toast({
          title: 'Missing Required Field',
          description: `${field.label} is required.`,
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAllFields()) return;
    setLoading(true);

    try {
      // Process universities
      const processedUniversities = await Promise.all(universities.filter(u => u && u.trim()).map(async uni => {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uni);
        if (isUUID) return uni;
        // Auto-create new universities on the fly (same as old logic)
        const { data: newUni, error } = await supabase.from('universities').insert({
          name: uni.trim(),
          country: formData.study_destination,
          city: 'Unknown'
        }).select('id').single();
        if (error) throw new Error(`Failed to add university: ${uni}`);
        return newUni.id;
      }));

      // Prepare payload - ENSURE CORRECT TYPES
      // Numbers: amount_requested, salary, percentages, scores
      // Strings: ranks, names, codes
      const payload = {
        partner_id: formData.partner_id,
        student_name: formData.student_name.trim(),
        student_phone: formData.student_phone,
        student_email: formData.student_email ? normalizeEmail(formData.student_email) : undefined,
        student_pin_code: formData.student_postal_code,
        // Optional Student Fields
        student_date_of_birth: formData.student_date_of_birth || undefined,
        student_gender: formData.student_gender || undefined,
        student_city: formData.student_city || undefined,
        student_state: formData.student_state || undefined,
        student_nationality: formData.student_nationality || undefined,
        student_street_address: formData.student_street_address || undefined,
        student_tenth_percentage: formData.student_tenth_percentage ? parseFloat(formData.student_tenth_percentage) : undefined,
        student_twelfth_percentage: formData.student_twelfth_percentage ? parseFloat(formData.student_twelfth_percentage) : undefined,
        student_bachelors_percentage: formData.student_bachelors_percentage ? parseFloat(formData.student_bachelors_percentage) : undefined,
        student_bachelors_cgpa: formData.student_bachelors_cgpa ? parseFloat(formData.student_bachelors_cgpa) : undefined,
        student_credit_score: formData.student_credit_score ? parseInt(formData.student_credit_score, 10) : undefined,

        // Study Fields
        country: formData.study_destination,
        universities: processedUniversities,
        intake_month: formData.intake_month ? parseInt(formData.intake_month, 10) : undefined,
        intake_year: formData.intake_year ? parseInt(formData.intake_year, 10) : undefined,
        loan_type: formData.loan_type || undefined,
        // FIX: amount_requested MUST be a NUMBER, not string
        amount_requested: formData.loan_amount ? parseInt(formData.loan_amount, 10) : undefined,

        // Co-Applicant Fields
        co_applicant_name: formData.co_applicant_name.trim(),
        co_applicant_phone: formData.co_applicant_phone,
        // FIX: co_applicant_monthly_salary MUST be a NUMBER, not string
        co_applicant_monthly_salary: formData.co_applicant_salary ? parseInt(formData.co_applicant_salary, 10) : undefined,
        co_applicant_relationship: formData.co_applicant_relationship,
        co_applicant_pin_code: formData.co_applicant_pin_code || '000000', // Default if missing
        co_applicant_email: formData.co_applicant_email || undefined,
        co_applicant_occupation: formData.co_applicant_occupation || undefined,
        co_applicant_employer: formData.co_applicant_employer || undefined,
        co_applicant_employment_type: formData.co_applicant_employment_type || undefined,
        co_applicant_employment_duration_years: formData.co_applicant_employment_duration ? parseInt(formData.co_applicant_employment_duration, 10) : undefined,
        co_applicant_credit_score: formData.co_applicant_credit_score ? parseInt(formData.co_applicant_credit_score, 10) : undefined,

        // Tests - scores as numbers
        academic_tests: academicTests.filter(t => t.test_type && t.score).map(t => ({
          test_type: t.test_type,
          score: parseFloat(t.score), // FIX: score should be a number
          test_date: t.test_date || undefined,
          expiry_date: t.expiry_date || undefined
        }))
      };

      // ════════════════════════════════════════════════════════════════════
      // SUBMISSION GUARD - Log exact payload for debugging type mismatches
      // ════════════════════════════════════════════════════════════════════
      console.group('🚀 [SUBMISSION_GUARD] Lead Creation Payload');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('Type Checks:', {
        amount_requested: typeof payload.amount_requested,
        co_applicant_monthly_salary: typeof payload.co_applicant_monthly_salary,
        intake_month: typeof payload.intake_month,
        intake_year: typeof payload.intake_year,
        student_credit_score: typeof payload.student_credit_score,
      });
      console.groupEnd();

      const { data, error } = await supabase.functions.invoke('create-lead', { body: payload });

      if (error || (data && !data.success)) {
        const errorMsg = error?.message || data?.error || 'Failed to create lead';
        const apiError = parseApiError(errorMsg);
        setTopLevelError(apiError.message);
        toast({
          title: 'Failed to Create Lead',
          description: apiError.message,
          variant: 'destructive'
        });
        return;
      }

      toast({ title: 'Success', description: SUCCESS_COPY.LEAD_CREATED });

      // Trigger AI lender recommendation
      if (data.lead?.id) {
        triggerRecommendation({
          leadId: data.lead.id,
          studyDestination: formData.study_destination,
          loanAmount: parseInt(formData.loan_amount) || 0,
          silent: true,
        });
      }

      resetForm();
      onSuccess();
      onOpenChange(false);

    } catch (err: any) {
      setTopLevelError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <CollapsibleModal
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }}
      title="Create Lead on Behalf of Partner"
      description="Enter the details below to create a new student application."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Create Lead
          </Button>
        </>
      }
    >
      <div className="max-h-[70vh] overflow-y-auto pr-4">
        {/* Top-level error banner */}
        {topLevelError && (
          <Alert variant="destructive" className="mb-4 mx-1">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{topLevelError}</AlertDescription>
          </Alert>
        )}

        {/* Partner Selection */}
        <CollapsibleSection
          title="Partner Selection"
          defaultOpen={true}
          rightElement={formData.partner_id ? <CheckCircle2 className="h-4 w-4 text-success" /> : undefined}
        >
          <FieldWrapper label="Select Partner" required isValid={!!formData.partner_id} id="partner_id">
            <PartnerCombobox
              partners={partners}
              value={formData.partner_id || null}
              onChange={value => handleInputChange('partner_id', value || '')}
              placeholder="Search and select a partner..."
              className="mt-1"
            />
          </FieldWrapper>
        </CollapsibleSection>

        {/* Student Details */}
        <CollapsibleSection
          title="Student Details"
          defaultOpen={true}
          rightElement={formData.student_name ? <CheckCircle2 className="h-4 w-4 text-success" /> : undefined}
        >
          <EditStudentTab
            formData={formData}
            handleInputChange={handleInputChange}
            GENDER_OPTIONS={GENDER_OPTIONS}
          />
        </CollapsibleSection>

        {/* Study Details */}
        <CollapsibleSection
          title="Study Details"
          defaultOpen={true}
          rightElement={formData.study_destination ? <CheckCircle2 className="h-4 w-4 text-success" /> : undefined}
        >
          <EditStudyTab
            formData={formData}
            handleInputChange={handleInputChange}
            universities={universities}
            setUniversities={setUniversities}
            courseId={courseId}
            setCourseId={setCourseId}
            isCustomCourse={isCustomCourse}
            setIsCustomCourse={setIsCustomCourse}
            STUDY_DESTINATIONS={STUDY_DESTINATIONS}
            LOAN_TYPES={LOAN_TYPES}
            MONTHS={MONTHS}
          />
        </CollapsibleSection>

        {/* Co-Applicant Details */}
        <CollapsibleSection
          title="Co-Applicant Details"
          defaultOpen={true}
          rightElement={formData.co_applicant_name ? <CheckCircle2 className="h-4 w-4 text-success" /> : undefined}
        >
          <EditCoApplicantTab
            formData={formData}
            handleInputChange={handleInputChange}
            RELATIONSHIPS={RELATIONSHIPS}
            EMPLOYMENT_TYPE_OPTIONS={EMPLOYMENT_TYPE_OPTIONS}
          />
        </CollapsibleSection>

        {/* Academic Tests */}
        <CollapsibleSection
          title="Academic Tests"
          defaultOpen={true}
          rightElement={academicTests.length > 0 ? <CheckCircle2 className="h-4 w-4 text-success" /> : undefined}
        >
          <EditTestsTab
            academicTests={academicTests}
            addAcademicTest={addAcademicTest}
            updateAcademicTest={updateAcademicTest}
            removeAcademicTest={removeAcademicTest}
            validateTestScore={validateTestScore}
            getTestMaxScore={getTestMaxScore}
          />
        </CollapsibleSection>
      </div>
    </CollapsibleModal>
  );
};