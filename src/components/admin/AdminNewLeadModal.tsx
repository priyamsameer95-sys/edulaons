import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { User, GraduationCap, Users, ChevronDown, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { UniversitySelector } from '@/components/ui/university-selector';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { PartnerCombobox, PartnerOption } from '@/components/ui/partner-combobox';
import { supabase } from '@/integrations/supabase/client';
import { LoadingButton } from '@/components/ui/loading-button';
import { VALIDATION_RULES, ERROR_MESSAGES } from '@/constants/validationRules';

interface AdminNewLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  partners: PartnerOption[];
}

interface FormData {
  partner_id: string;
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
  co_applicant_phone: string;
  co_applicant_salary: string;
  co_applicant_relationship: string;
  co_applicant_pin_code: string;
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

export const AdminNewLeadModal = ({ open, onOpenChange, onSuccess, partners }: AdminNewLeadModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [coApplicantOpen, setCoApplicantOpen] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  const [formData, setFormData] = useState<FormData>({
    partner_id: '',
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
    co_applicant_phone: '',
    co_applicant_salary: '',
    co_applicant_relationship: '',
    co_applicant_pin_code: '',
  });

  const resetForm = () => {
    setFormData({
      partner_id: '',
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
      co_applicant_phone: '',
      co_applicant_salary: '',
      co_applicant_relationship: '',
      co_applicant_pin_code: '',
    });
    setErrors({});
    setTouched({});
  };

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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
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
      'country', 'intake_month', 'loan_type', 'amount_requested',
      'co_applicant_name', 'co_applicant_phone', 'co_applicant_salary',
      'co_applicant_relationship', 'co_applicant_pin_code'
    ];
    
    const newErrors: FieldErrors = {};
    const newTouched: TouchedFields = {};
    let hasErrors = false;
    
    allFields.forEach(field => {
      newTouched[field] = true;
      const error = validateField(field, formData[field] as string);
      newErrors[field] = error;
      if (error) hasErrors = true;
    });
    
    setTouched(newTouched);
    setErrors(newErrors);
    
    if (hasErrors) {
      toast({ 
        title: 'Please fix the errors', 
        description: 'Some fields have invalid values', 
        variant: 'destructive' 
      });
    }
    
    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAllFields()) return;

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

      const payload = {
        partner_id: formData.partner_id,
        student_name: formData.student_name,
        student_phone: formData.student_phone,
        student_email: formData.student_email || undefined,
        student_pin_code: formData.student_pin_code,
        country: formData.country,
        universities: processedUniversities,
        intake_month: formData.intake_month,
        loan_type: formData.loan_type,
        amount_requested: formData.amount_requested,
        co_applicant_name: formData.co_applicant_name,
        co_applicant_phone: formData.co_applicant_phone,
        co_applicant_monthly_salary: formData.co_applicant_salary,
        co_applicant_relationship: formData.co_applicant_relationship,
        co_applicant_pin_code: formData.co_applicant_pin_code,
      };

      const { data, error } = await supabase.functions.invoke('create-lead', { body: payload });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Failed to create lead');

      toast({
        title: 'Lead Created',
        description: `Case ${data.lead.case_id} created for partner`,
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Failed to Create Lead',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
            Create Lead on Behalf of Partner
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="John Smith"
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
                helperText="Min: ₹1 Lakh • Max: ₹1 Crore"
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
                      helperText="Gross monthly income"
                      id="co_applicant_salary"
                    >
                      <Input
                        id="co_applicant_salary"
                        type="number"
                        value={formData.co_applicant_salary}
                        onChange={(e) => handleInputChange('co_applicant_salary', e.target.value)}
                        onBlur={() => handleBlur('co_applicant_salary')}
                        placeholder="50000"
                        min={0}
                        aria-required="true"
                        aria-invalid={!!errors.co_applicant_salary}
                        className={cn(
                          touched.co_applicant_salary && errors.co_applicant_salary && 'border-destructive focus-visible:ring-destructive',
                          touched.co_applicant_salary && !errors.co_applicant_salary && formData.co_applicant_salary && 'border-green-500'
                        )}
                      />
                    </FieldWrapper>
                  </div>
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
