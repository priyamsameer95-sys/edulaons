import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { User, GraduationCap, Loader2, Users, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { cn, convertNumberToWords } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { UniversitySelector } from "@/components/ui/university-selector";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { supabase } from "@/integrations/supabase/client";
import { DocumentUploadSection } from "@/components/dashboard/DocumentUploadSection";
import { useFormValidation, FieldConfig } from "@/hooks/useFormValidation";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface FormData {
  student_name: string;
  student_phone: string;
  student_email: string;
  student_pin_code: string;
  country: string;
  universities: string[];
  intake_month: string;
  loan_type: 'secured' | 'unsecured' | '';
  amount_requested: string;
  co_applicant_name: string;
  co_applicant_email: string;
  co_applicant_phone: string;
  co_applicant_salary: string;
  co_applicant_relationship: string;
  co_applicant_pin_code: string;
}

const leadFormConfig: FieldConfig = {
  student_name: { 
    required: true, 
    minLength: 2, 
    maxLength: 100,
    custom: (value: string) => {
      const trimmedValue = value.trim();
      if (trimmedValue.startsWith('/') || trimmedValue.includes('login')) {
        return 'Please enter a valid student name';
      }
      if (!/^[a-zA-Z\s.'-]+$/.test(trimmedValue)) {
        return 'Name can only contain letters, spaces, dots, hyphens';
      }
      return null;
    }
  },
  student_phone: { 
    required: true, 
    pattern: /^(\+[\d]{1,3}[\d\s\-()]{7,14}|[\d]{10})$/
  },
  student_email: { 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  student_pin_code: { 
    required: true, 
    pattern: /^\d{6}$/
  },
  country: { required: true },
  intake_month: { required: true },
  loan_type: { required: true },
  amount_requested: { 
    required: true,
    min: 100000,
    max: 20000000,
  },
  co_applicant_name: { 
    required: true, 
    minLength: 2, 
    maxLength: 100,
  },
  co_applicant_phone: { 
    required: true, 
    pattern: /^(\+[\d]{1,3}[\d\s\-()]{7,14}|[\d]{10})$/
  },
  co_applicant_salary: { 
    required: true,
    min: 1,
  },
  co_applicant_relationship: { required: true },
  co_applicant_pin_code: { 
    required: true, 
    pattern: /^\d{6}$/
  },
};

type Step = 'student' | 'study' | 'co_applicant' | 'documents';

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'student', label: 'Student', icon: User },
  { id: 'study', label: 'Study Details', icon: GraduationCap },
  { id: 'co_applicant', label: 'Co-Applicant', icon: Users },
  { id: 'documents', label: 'Documents', icon: CheckCircle },
];

const NewLeadPage = () => {
  const navigate = useNavigate();
  const { partnerCode } = useParams();
  const [currentStep, setCurrentStep] = useState<Step>('student');
  const [createdLead, setCreatedLead] = useState<any>(null);
  
  const initialFormData: FormData = {
    student_name: '',
    student_phone: '',
    student_email: '',
    student_pin_code: '',
    country: '',
    universities: [''],
    intake_month: '',
    loan_type: '',
    amount_requested: '',
    co_applicant_name: '',
    co_applicant_email: '',
    co_applicant_phone: '',
    co_applicant_salary: '',
    co_applicant_relationship: '',
    co_applicant_pin_code: ''
  };

  const {
    formData,
    errors,
    updateField,
    validateForm,
    setFields
  } = useFormValidation(initialFormData, leadFormConfig);

  const [loading, setLoading] = useState(false);
  const [amountInWords, setAmountInWords] = useState<string>('');
  const [salaryInWords, setSalaryInWords] = useState<string>('');
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia',
    'Germany', 'France', 'Netherlands', 'Singapore', 'Ireland', 'New Zealand'
  ];

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const validateCurrentStep = (): boolean => {
    if (currentStep === 'student') {
      const studentFields = ['student_name', 'student_phone', 'student_pin_code'];
      return studentFields.every(field => {
        const value = formData[field as keyof FormData];
        return value && String(value).trim() !== '';
      });
    }
    if (currentStep === 'study') {
      return !!(formData.country && formData.intake_month && formData.loan_type && formData.amount_requested && formData.universities[0]);
    }
    if (currentStep === 'co_applicant') {
      const coApplicantFields = ['co_applicant_name', 'co_applicant_phone', 'co_applicant_salary', 'co_applicant_relationship', 'co_applicant_pin_code'];
      return coApplicantFields.every(field => {
        const value = formData[field as keyof FormData];
        return value && String(value).trim() !== '';
      });
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Complete required fields",
        description: "Please fill in all required fields before proceeding",
        variant: "destructive",
      });
      return;
    }
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      if (STEPS[nextIndex].id === 'documents' && !createdLead) {
        // Submit form first
        handleSubmit();
      } else {
        setCurrentStep(STEPS[nextIndex].id);
      }
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session: currentSession }, error: currentSessionError } = await supabase.auth.getSession();
      
      if (currentSessionError || !currentSession) {
        throw new Error('Session expired. Please refresh and log in again.');
      }

      // Process universities
      const processedUniversities = await Promise.all(
        formData.universities
          .filter(u => u && u.trim())
          .map(async (uni) => {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uni);
            if (isUUID) return uni;
            
            const { data: newUni, error: uniError } = await supabase
              .from('universities')
              .insert({ name: uni.trim(), country: formData.country, city: 'Unknown' })
              .select('id')
              .single();
            
            if (uniError) throw new Error(`Failed to add university: ${uni}`);
            return newUni.id;
          })
      );

      const { data, error } = await supabase.functions.invoke('create-lead', {
        body: {
          student_name: formData.student_name,
          student_phone: formData.student_phone,
          student_email: formData.student_email,
          student_pin_code: formData.student_pin_code,
          country: formData.country,
          universities: processedUniversities,
          intake_month: parseInt(formData.intake_month.split('-')[1]),
          intake_year: parseInt(formData.intake_month.split('-')[0]),
          loan_type: formData.loan_type,
          amount_requested: formData.amount_requested,
          co_applicant_name: formData.co_applicant_name,
          co_applicant_email: formData.co_applicant_email,
          co_applicant_phone: formData.co_applicant_phone,
          co_applicant_monthly_salary: formData.co_applicant_salary,
          co_applicant_relationship: formData.co_applicant_relationship,
          co_applicant_pin_code: formData.co_applicant_pin_code
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to create lead');
      }
      
      toast({
        title: "Lead Created!",
        description: `Case ${data.lead.case_id} created successfully`,
      });

      setCreatedLead(data.lead);
      setCurrentStep('documents');

    } catch (error: any) {
      handleError(error, { title: 'Failed to Create Lead' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    updateField(field, value);
    
    if (field === 'amount_requested') {
      const num = parseFloat(value);
      setAmountInWords(!isNaN(num) && num > 0 ? convertNumberToWords(num) : '');
    }
    if (field === 'co_applicant_salary') {
      const num = parseFloat(value);
      setSalaryInWords(!isNaN(num) && num > 0 ? convertNumberToWords(num) : '');
    }
  };

  const handleUniversitiesChange = useCallback((universities: string[]) => {
    setFields({ universities });
  }, [setFields]);

  const handleComplete = () => {
    navigate(partnerCode ? `/partner/${partnerCode}` : '/');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'student':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.student_name}
                  onChange={(e) => handleInputChange('student_name', e.target.value)}
                  placeholder="Student's full name"
                  className={errors.student_name ? 'border-destructive' : ''}
                />
                {errors.student_name && <p className="text-xs text-destructive">{errors.student_name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Phone <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.student_phone}
                  onChange={(e) => handleInputChange('student_phone', e.target.value)}
                  placeholder="10-digit mobile number"
                  className={errors.student_phone ? 'border-destructive' : ''}
                />
                {errors.student_phone && <p className="text-xs text-destructive">{errors.student_phone}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Input
                  type="email"
                  value={formData.student_email}
                  onChange={(e) => handleInputChange('student_email', e.target.value)}
                  placeholder="student@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>PIN Code <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.student_pin_code}
                  onChange={(e) => handleInputChange('student_pin_code', e.target.value)}
                  placeholder="6-digit PIN code"
                  maxLength={6}
                  className={errors.student_pin_code ? 'border-destructive' : ''}
                />
                {errors.student_pin_code && <p className="text-xs text-destructive">{errors.student_pin_code}</p>}
              </div>
            </div>
          </div>
        );

      case 'study':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Destination Country <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => {
                    handleInputChange('country', value);
                    setFields({ universities: [''] });
                  }}
                >
                  <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Intake <span className="text-destructive">*</span></Label>
                <MonthYearPicker
                  value={formData.intake_month}
                  onChange={(value) => handleInputChange('intake_month', value)}
                  placeholder="Select intake"
                  error={!!errors.intake_month}
                />
              </div>
            </div>

            <UniversitySelector
              country={formData.country}
              universities={formData.universities}
              onChange={handleUniversitiesChange}
              error={errors.universities}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Collateral Available? <span className="text-destructive">*</span></Label>
                <RadioGroup
                  value={formData.loan_type}
                  onValueChange={(value) => handleInputChange('loan_type', value)}
                  className="flex gap-6 pt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="secured" id="secured" />
                    <Label htmlFor="secured" className="font-normal cursor-pointer">Yes (Secured)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unsecured" id="unsecured" />
                    <Label htmlFor="unsecured" className="font-normal cursor-pointer">No (Unsecured)</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Loan Amount <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  value={formData.amount_requested}
                  onChange={(e) => handleInputChange('amount_requested', e.target.value)}
                  placeholder="Amount in ₹ (e.g., 2000000)"
                  max={1000000000}
                  className={errors.amount_requested ? 'border-destructive' : ''}
                />
                {amountInWords && <p className="text-xs text-muted-foreground">₹ {amountInWords}</p>}
              </div>
            </div>
          </div>
        );

      case 'co_applicant':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.co_applicant_name}
                  onChange={(e) => handleInputChange('co_applicant_name', e.target.value)}
                  placeholder="Co-applicant's name"
                  className={errors.co_applicant_name ? 'border-destructive' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.co_applicant_phone}
                  onChange={(e) => handleInputChange('co_applicant_phone', e.target.value)}
                  placeholder="10-digit phone"
                  className={errors.co_applicant_phone ? 'border-destructive' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label>Email <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Input
                  type="email"
                  value={formData.co_applicant_email}
                  onChange={(e) => handleInputChange('co_applicant_email', e.target.value)}
                  placeholder="co-applicant@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Relationship <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.co_applicant_relationship}
                  onValueChange={(value) => handleInputChange('co_applicant_relationship', value)}
                >
                  <SelectTrigger className={errors.co_applicant_relationship ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Annual Salary <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  value={formData.co_applicant_salary}
                  onChange={(e) => handleInputChange('co_applicant_salary', e.target.value)}
                  placeholder="Annual income in ₹"
                  max={100000000}
                  className={errors.co_applicant_salary ? 'border-destructive' : ''}
                />
                {salaryInWords && <p className="text-xs text-muted-foreground">₹ {salaryInWords}</p>}
              </div>
              <div className="space-y-2">
                <Label>PIN Code <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.co_applicant_pin_code}
                  onChange={(e) => handleInputChange('co_applicant_pin_code', e.target.value)}
                  placeholder="6-digit PIN code"
                  maxLength={6}
                  className={errors.co_applicant_pin_code ? 'border-destructive' : ''}
                />
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Lead Created Successfully!</h3>
                    <p className="text-sm text-muted-foreground">Case ID: {createdLead?.case_id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {createdLead && (
              <DocumentUploadSection
                leadId={createdLead.id}
                loanType={formData.loan_type as 'secured' | 'unsecured'}
                onDocumentsChange={() => {}}
              />
            )}
          </div>
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Compact Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">New Lead</h1>
            </div>
            {createdLead && (
              <span className="text-sm text-muted-foreground">
                Case: {createdLead.case_id}
              </span>
            )}
          </div>
        </header>

        {/* Progress Steps */}
        <div className="border-b bg-card">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = index < currentStepIndex || (step.id === 'documents' && createdLead);
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                          isActive && "bg-primary text-primary-foreground",
                          isCompleted && "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
                          !isActive && !isCompleted && "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <span className={cn(
                        "text-xs font-medium",
                        isActive && "text-primary",
                        !isActive && "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={cn(
                        "w-12 md:w-20 h-0.5 mx-2",
                        index < currentStepIndex ? "bg-green-500" : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {currentStep === 'documents' ? (
              <Button onClick={handleComplete} size="lg">
                Complete & View Lead
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={loading} size="lg">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {currentStep === 'co_applicant' ? 'Create Lead' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default NewLeadPage;
