import { useState, useCallback, useMemo, useEffect } from "react";
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight, User, GraduationCap, Users, ArrowRight, FileText, AlertCircle } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UniversityCombobox } from "@/components/ui/university-combobox";
import { CourseCombobox } from "@/components/ui/course-combobox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { convertINRToWords, formatIndianNumber } from "@/utils/currencyFormatter";

interface AddNewLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onContinueApplication?: (leadId: string) => void;
  onUploadDocuments?: (leadId: string) => void;
  partnerId?: string;
}

interface FormData {
  // Step 1: Student Details
  student_name: string;
  student_phone: string;
  student_email: string;
  student_pin_code: string;
  student_gender: string;
  student_dob: string;
  // Step 2: Study Details
  study_destination: string;
  university_id: string;
  university_name: string;
  is_custom_university: boolean;
  course_id: string;
  course_name: string;
  is_custom_course: boolean;
  intake_month: string;
  intake_year: string;
  loan_amount: string;
  loan_type: string;
  // Step 3: Co-Applicant Details
  co_applicant_name: string;
  co_applicant_relationship: string;
  co_applicant_phone: string;
  co_applicant_pin_code: string;
  co_applicant_monthly_salary: string;
  co_applicant_occupation: string;
  co_applicant_employer: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const COUNTRIES = [
  { value: "United States", label: "USA" },
  { value: "United Kingdom", label: "UK" },
  { value: "Canada", label: "Canada" },
  { value: "Australia", label: "Australia" },
  { value: "Germany", label: "Germany" },
  { value: "Ireland", label: "Ireland" },
  { value: "New Zealand", label: "New Zealand" },
  { value: "Not Specified", label: "Other" },
];

const RELATIONSHIPS = [
  { value: "parent", label: "Parent" },
  { value: "spouse", label: "Spouse" },
  { value: "sibling", label: "Sibling" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear + i),
  label: String(currentYear + i),
}));

const initialFormData: FormData = {
  student_name: "",
  student_phone: "",
  student_email: "",
  student_pin_code: "",
  student_gender: "",
  student_dob: "",
  study_destination: "",
  university_id: "",
  university_name: "",
  is_custom_university: false,
  course_id: "",
  course_name: "",
  is_custom_course: false,
  intake_month: "",
  intake_year: String(currentYear),
  loan_amount: "",
  loan_type: "unsecured",
  co_applicant_name: "",
  co_applicant_relationship: "",
  co_applicant_phone: "",
  co_applicant_pin_code: "",
  co_applicant_monthly_salary: "",
  co_applicant_occupation: "",
  co_applicant_employer: "",
};

const STEPS = [
  { id: 1, title: "Student Details", icon: User },
  { id: 2, title: "Study Details", icon: GraduationCap },
  { id: 3, title: "Co-Applicant", icon: Users },
];

export const AddNewLeadModal = ({ open, onClose, onSuccess, onContinueApplication, onUploadDocuments, partnerId }: AddNewLeadModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);
  
  // Phone duplicate check state
  const [phoneCheckResult, setPhoneCheckResult] = useState<{ exists: boolean; studentName?: string } | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const debouncedPhone = useDebounce(formData.student_phone.replace(/\D/g, ''), 500);

  // Check for existing student by phone
  useEffect(() => {
    const checkPhone = async () => {
      if (debouncedPhone.length !== 10) {
        setPhoneCheckResult(null);
        return;
      }
      
      setCheckingPhone(true);
      try {
        const { data } = await supabase
          .from('students')
          .select('id, name')
          .eq('phone', debouncedPhone)
          .maybeSingle();
        
        setPhoneCheckResult(data ? { exists: true, studentName: data.name } : { exists: false });
      } catch (err) {
        console.error('Phone check error:', err);
        setPhoneCheckResult(null);
      } finally {
        setCheckingPhone(false);
      }
    };
    
    checkPhone();
  }, [debouncedPhone]);

  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const formatCurrencyInput = useCallback((value: string): string => {
    return formatIndianNumber(value);
  }, []);

  // Convert amounts to words using centralized function
  const loanAmountInWords = useMemo(() => convertINRToWords(formData.loan_amount), [formData.loan_amount]);
  const salaryInWords = useMemo(() => convertINRToWords(formData.co_applicant_monthly_salary), [formData.co_applicant_monthly_salary]);

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.student_name.trim()) {
        newErrors.student_name = "Required";
      } else if (formData.student_name.trim().length < 2) {
        newErrors.student_name = "Min 2 characters";
      }

      const cleanPhone = formData.student_phone.replace(/\D/g, '');
      if (!cleanPhone) {
        newErrors.student_phone = "Required";
      } else if (cleanPhone.length !== 10) {
        newErrors.student_phone = "Must be 10 digits";
      } else if (!/^[6-9]/.test(cleanPhone)) {
        newErrors.student_phone = "Invalid number";
      }

      if (formData.student_email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.student_email.trim())) {
          newErrors.student_email = "Invalid email";
        }
      }

      if (!formData.student_pin_code.trim()) {
        newErrors.student_pin_code = "Required";
      } else if (!/^\d{6}$/.test(formData.student_pin_code.trim())) {
        newErrors.student_pin_code = "Must be 6 digits";
      }
    }

    if (step === 2) {
      if (!formData.study_destination) {
        newErrors.study_destination = "Required";
      }

      if (!formData.university_id && !formData.university_name) {
        newErrors.university_id = "Required";
      }

      if (!formData.course_id && !formData.course_name) {
        newErrors.course_id = "Required";
      }

      if (!formData.intake_month) {
        newErrors.intake_month = "Required";
      }

      if (!formData.intake_year) {
        newErrors.intake_year = "Required";
      }

      const loanAmount = parseInt(formData.loan_amount.replace(/,/g, '') || '0');
      if (!formData.loan_amount) {
        newErrors.loan_amount = "Required";
      } else if (loanAmount < 100000) {
        newErrors.loan_amount = "Min ₹1 Lakh";
      } else if (loanAmount > 100000000) {
        newErrors.loan_amount = "Max ₹10 Crore";
      }
    }

    if (step === 3) {
      if (!formData.co_applicant_name.trim()) {
        newErrors.co_applicant_name = "Required";
      } else if (formData.co_applicant_name.trim().length < 2) {
        newErrors.co_applicant_name = "Min 2 characters";
      }

      if (!formData.co_applicant_relationship) {
        newErrors.co_applicant_relationship = "Required";
      }

      const cleanPhone = formData.co_applicant_phone.replace(/\D/g, '');
      if (!cleanPhone) {
        newErrors.co_applicant_phone = "Required";
      } else if (cleanPhone.length !== 10) {
        newErrors.co_applicant_phone = "Must be 10 digits";
      } else if (!/^[6-9]/.test(cleanPhone)) {
        newErrors.co_applicant_phone = "Invalid number";
      }

      if (!formData.co_applicant_pin_code.trim()) {
        newErrors.co_applicant_pin_code = "Required";
      } else if (!/^\d{6}$/.test(formData.co_applicant_pin_code.trim())) {
        newErrors.co_applicant_pin_code = "Must be 6 digits";
      }

      const salary = parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, ''));
      if (!formData.co_applicant_monthly_salary) {
        newErrors.co_applicant_monthly_salary = "Required";
      } else if (isNaN(salary) || salary < 10000) {
        newErrors.co_applicant_monthly_salary = "Min ₹10,000";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-lead-quick', {
        body: {
          // Student details
          student_name: formData.student_name.trim(),
          student_phone: formData.student_phone.replace(/\D/g, ''),
          student_email: formData.student_email.trim() || undefined,
          student_pin_code: formData.student_pin_code.trim(),
          student_gender: formData.student_gender || undefined,
          student_dob: formData.student_dob || undefined,
          // Study details
          country: formData.study_destination,
          university_id: formData.is_custom_university ? undefined : formData.university_id,
          university_name: formData.is_custom_university ? formData.university_name : undefined,
          course_id: formData.is_custom_course ? undefined : formData.course_id,
          course_name: formData.is_custom_course ? formData.course_name : formData.course_name,
          intake_month: parseInt(formData.intake_month),
          intake_year: parseInt(formData.intake_year),
          loan_amount: parseInt(formData.loan_amount.replace(/,/g, '')),
          loan_type: formData.loan_type,
          // Co-applicant details
          co_applicant_name: formData.co_applicant_name.trim(),
          co_applicant_relationship: formData.co_applicant_relationship,
          co_applicant_phone: formData.co_applicant_phone.replace(/\D/g, ''),
          co_applicant_pin_code: formData.co_applicant_pin_code.trim(),
          co_applicant_monthly_salary: parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, '')),
          co_applicant_occupation: formData.co_applicant_occupation.trim() || undefined,
          co_applicant_employer: formData.co_applicant_employer.trim() || undefined,
          // Partner
          partner_id: partnerId,
        }
      });

      if (error) throw new Error(error.message || 'Failed to create lead');
      if (!data.success) throw new Error(data.error || 'Failed to create lead');

      setCreatedCaseId(data.lead.case_id);
      setCreatedLeadId(data.lead.id);
      setShowSuccess(true);
      toast.success('Lead created successfully!');
      onSuccess?.();

    } catch (error: any) {
      toast.error(error.message || 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialFormData);
      setErrors({});
      setCurrentStep(1);
      setShowSuccess(false);
      setCreatedCaseId(null);
      setCreatedLeadId(null);
      onClose();
    }
  };

  const handleCompleteApplication = () => {
    if (createdLeadId && onContinueApplication) {
      handleClose();
      onContinueApplication(createdLeadId);
    }
  };

  const handleUploadDocs = () => {
    if (createdLeadId && onUploadDocuments) {
      handleClose();
      onUploadDocuments(createdLeadId);
    }
  };

  const handleUniversityChange = (value: string, isCustom?: boolean) => {
    if (isCustom) {
      handleInputChange('university_id', '');
      handleInputChange('university_name', value);
      handleInputChange('is_custom_university', true);
    } else {
      handleInputChange('university_id', value);
      handleInputChange('university_name', '');
      handleInputChange('is_custom_university', false);
    }
    // Reset course when university changes
    handleInputChange('course_id', '');
    handleInputChange('course_name', '');
    handleInputChange('is_custom_course', false);
  };

  const handleCourseChange = (value: string, isCustom?: boolean) => {
    if (isCustom) {
      handleInputChange('course_id', '');
      handleInputChange('course_name', value);
      handleInputChange('is_custom_course', true);
    } else {
      handleInputChange('course_id', value);
      handleInputChange('course_name', '');
      handleInputChange('is_custom_course', false);
    }
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">Lead Created Successfully!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Case ID: <span className="font-mono font-medium">{createdCaseId}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                All details have been captured. The lead is ready for processing.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2 mt-2">
              {onContinueApplication && (
                <Button 
                  onClick={handleCompleteApplication} 
                  className="w-full gap-2"
                  size="lg"
                >
                  Continue to Complete
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              
              {onUploadDocuments && (
                <Button 
                  onClick={handleUploadDocs} 
                  variant="outline" 
                  className="w-full gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Upload Documents
                </Button>
              )}
              
              <Button 
                onClick={handleClose} 
                variant="ghost" 
                className="w-full text-muted-foreground"
              >
                Done for Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            Add New Lead
          </DialogTitle>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between pt-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                        isActive && "border-primary bg-primary text-primary-foreground",
                        isCompleted && "border-primary bg-primary/10 text-primary",
                        !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={cn(
                      "text-xs mt-1.5 font-medium",
                      isActive && "text-primary",
                      !isActive && "text-muted-foreground"
                    )}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "h-0.5 flex-1 mx-2 -mt-5",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          {/* Step 1: Student Details */}
          {currentStep === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="student_name" className="text-sm">Student Name *</Label>
                <Input
                  id="student_name"
                  value={formData.student_name}
                  onChange={(e) => handleInputChange('student_name', e.target.value)}
                  placeholder="Full name"
                  className={errors.student_name ? 'border-destructive' : ''}
                />
                {errors.student_name && <p className="text-xs text-destructive">{errors.student_name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="student_phone" className="text-sm">Phone Number *</Label>
                <Input
                  id="student_phone"
                  value={formData.student_phone}
                  onChange={(e) => handleInputChange('student_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10 digit mobile"
                  className={errors.student_phone ? 'border-destructive' : ''}
                />
                {errors.student_phone && <p className="text-xs text-destructive">{errors.student_phone}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="student_email" className="text-sm">Email</Label>
                <Input
                  id="student_email"
                  type="email"
                  value={formData.student_email}
                  onChange={(e) => handleInputChange('student_email', e.target.value)}
                  placeholder="student@email.com"
                  className={errors.student_email ? 'border-destructive' : ''}
                />
                {errors.student_email ? (
                  <p className="text-xs text-destructive">{errors.student_email}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Recommended for faster communication</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="student_pin_code" className="text-sm">PIN Code *</Label>
                <Input
                  id="student_pin_code"
                  value={formData.student_pin_code}
                  onChange={(e) => handleInputChange('student_pin_code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 digit PIN"
                  className={errors.student_pin_code ? 'border-destructive' : ''}
                />
                {errors.student_pin_code && <p className="text-xs text-destructive">{errors.student_pin_code}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="student_gender" className="text-sm">Gender</Label>
                <Select
                  value={formData.student_gender}
                  onValueChange={(value) => handleInputChange('student_gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="student_dob" className="text-sm">Date of Birth</Label>
                <Input
                  id="student_dob"
                  type="date"
                  value={formData.student_dob}
                  onChange={(e) => handleInputChange('student_dob', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}

          {/* Step 2: Study Details */}
          {currentStep === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Study Destination *</Label>
                <Select
                  value={formData.study_destination}
                  onValueChange={(value) => {
                    handleInputChange('study_destination', value);
                    handleInputChange('university_id', '');
                    handleInputChange('university_name', '');
                    handleInputChange('course_id', '');
                    handleInputChange('course_name', '');
                  }}
                >
                  <SelectTrigger className={errors.study_destination ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.study_destination && <p className="text-xs text-destructive">{errors.study_destination}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">University *</Label>
                <UniversityCombobox
                  country={formData.study_destination}
                  value={formData.university_id || formData.university_name}
                  onChange={handleUniversityChange}
                  placeholder="Search or type university"
                  disabled={!formData.study_destination}
                  error={errors.university_id}
                />
                {errors.university_id && <p className="text-xs text-destructive">{errors.university_id}</p>}
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm">Course/Program *</Label>
                <CourseCombobox
                  universityId={formData.university_id}
                  value={formData.course_id || formData.course_name}
                  onChange={handleCourseChange}
                  placeholder="Search or enter course name"
                  disabled={!formData.study_destination}
                  error={errors.course_id}
                />
                {errors.course_id && <p className="text-xs text-destructive">{errors.course_id}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Intake Month *</Label>
                <Select
                  value={formData.intake_month}
                  onValueChange={(value) => handleInputChange('intake_month', value)}
                >
                  <SelectTrigger className={errors.intake_month ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.intake_month && <p className="text-xs text-destructive">{errors.intake_month}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Intake Year *</Label>
                <Select
                  value={formData.intake_year}
                  onValueChange={(value) => handleInputChange('intake_year', value)}
                >
                  <SelectTrigger className={errors.intake_year ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.intake_year && <p className="text-xs text-destructive">{errors.intake_year}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="loan_amount" className="text-sm">Loan Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    id="loan_amount"
                    value={formData.loan_amount}
                    onChange={(e) => handleInputChange('loan_amount', formatCurrencyInput(e.target.value))}
                    placeholder="30,00,000"
                    className={cn("pl-7", errors.loan_amount ? 'border-destructive' : '')}
                  />
                </div>
                {errors.loan_amount ? (
                  <p className="text-xs text-destructive">{errors.loan_amount}</p>
                ) : loanAmountInWords && (
                  <p className="text-xs text-primary font-medium">{loanAmountInWords}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Loan Type *</Label>
                <RadioGroup
                  value={formData.loan_type}
                  onValueChange={(value) => handleInputChange('loan_type', value)}
                  className="flex gap-4 pt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unsecured" id="unsecured" />
                    <Label htmlFor="unsecured" className="font-normal cursor-pointer">Unsecured</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="secured" id="secured" />
                    <Label htmlFor="secured" className="font-normal cursor-pointer">Secured</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 3: Co-Applicant Details */}
          {currentStep === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="co_applicant_name" className="text-sm">Co-Applicant Name *</Label>
                <Input
                  id="co_applicant_name"
                  value={formData.co_applicant_name}
                  onChange={(e) => handleInputChange('co_applicant_name', e.target.value)}
                  placeholder="Full name"
                  className={errors.co_applicant_name ? 'border-destructive' : ''}
                />
                {errors.co_applicant_name && <p className="text-xs text-destructive">{errors.co_applicant_name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Relationship *</Label>
                <Select
                  value={formData.co_applicant_relationship}
                  onValueChange={(value) => handleInputChange('co_applicant_relationship', value)}
                >
                  <SelectTrigger className={errors.co_applicant_relationship ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.co_applicant_relationship && <p className="text-xs text-destructive">{errors.co_applicant_relationship}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="co_applicant_phone" className="text-sm">Phone Number *</Label>
                <Input
                  id="co_applicant_phone"
                  value={formData.co_applicant_phone}
                  onChange={(e) => handleInputChange('co_applicant_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10 digit mobile"
                  className={errors.co_applicant_phone ? 'border-destructive' : ''}
                />
                {errors.co_applicant_phone && <p className="text-xs text-destructive">{errors.co_applicant_phone}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="co_applicant_pin_code" className="text-sm">PIN Code *</Label>
                <Input
                  id="co_applicant_pin_code"
                  value={formData.co_applicant_pin_code}
                  onChange={(e) => handleInputChange('co_applicant_pin_code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 digit PIN"
                  className={errors.co_applicant_pin_code ? 'border-destructive' : ''}
                />
                {errors.co_applicant_pin_code && <p className="text-xs text-destructive">{errors.co_applicant_pin_code}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="co_applicant_monthly_salary" className="text-sm">Monthly Income *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    id="co_applicant_monthly_salary"
                    value={formData.co_applicant_monthly_salary}
                    onChange={(e) => handleInputChange('co_applicant_monthly_salary', formatCurrencyInput(e.target.value))}
                    placeholder="50,000"
                    className={cn("pl-7", errors.co_applicant_monthly_salary ? 'border-destructive' : '')}
                  />
                </div>
                {errors.co_applicant_monthly_salary ? (
                  <p className="text-xs text-destructive">{errors.co_applicant_monthly_salary}</p>
                ) : salaryInWords && (
                  <p className="text-xs text-primary font-medium">{salaryInWords}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="co_applicant_occupation" className="text-sm">Occupation</Label>
                <Input
                  id="co_applicant_occupation"
                  value={formData.co_applicant_occupation}
                  onChange={(e) => handleInputChange('co_applicant_occupation', e.target.value)}
                  placeholder="e.g., Business, Salaried"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="co_applicant_employer" className="text-sm">Employer/Business Name</Label>
                <Input
                  id="co_applicant_employer"
                  value={formData.co_applicant_employer}
                  onChange={(e) => handleInputChange('co_applicant_employer', e.target.value)}
                  placeholder="Company or business name"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : handleBack}
            disabled={isSubmitting}
          >
            {currentStep === 1 ? (
              <>Cancel</>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </>
            )}
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {currentStep} of 3
          </div>

          {currentStep < 3 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Lead'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
