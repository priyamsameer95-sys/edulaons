import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { User, GraduationCap, Loader2, Trophy, Users, ChevronDown, ArrowLeft, CheckCircle } from "lucide-react";
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
  gmat_score: string;
  gre_score: string;
  toefl_score: string;
  pte_score: string;
  ielts_score: string;
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
        return 'Please enter a valid student name (not a URL or system path)';
      }
      if (!/^[a-zA-Z\s.'-]+$/.test(trimmedValue)) {
        return 'Student name can only contain letters, spaces, dots, hyphens, and apostrophes';
      }
      return null;
    }
  },
  student_phone: { 
    required: true, 
    pattern: /^(\+[\d]{1,3}[\d\s\-()]{7,14}|[\d]{10})$/
  },
  student_email: { 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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
    custom: (value: string) => {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Please enter a valid amount in numbers only';
      if (num < 100000) return 'Minimum loan amount is ₹1 lakh';
      if (num > 20000000) return 'Maximum loan amount is ₹2 crores';
      return null;
    }
  },
  gmat_score: { min: 200, max: 800 },
  gre_score: { min: 260, max: 340 },
  toefl_score: { min: 0, max: 120 },
  pte_score: { min: 10, max: 90 },
  ielts_score: { 
    min: 0, 
    max: 9,
    custom: (value: string) => {
      if (!value.trim()) return null;
      const num = parseFloat(value);
      if (isNaN(num)) return 'IELTS score should be a number (e.g., 7.5)';
      return null;
    }
  },
  co_applicant_name: { required: true, minLength: 2, maxLength: 100 },
  co_applicant_email: { 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  co_applicant_phone: { 
    required: true, 
    pattern: /^(\+[\d]{1,3}[\d\s\-()]{7,14}|[\d]{10})$/
  },
  co_applicant_salary: { 
    required: true,
    min: 1,
    custom: (value: string) => {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Please enter salary in numbers only (e.g., 50000)';
      if (num <= 0) return 'Salary must be greater than zero';
      return null;
    }
  },
  co_applicant_relationship: { required: true },
  co_applicant_pin_code: { 
    required: true, 
    pattern: /^\d{6}$/
  },
};

const NewLeadPage = () => {
  const navigate = useNavigate();
  const { partnerCode } = useParams();
  const [phase, setPhase] = useState<'form' | 'documents'>('form');
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
    gmat_score: '',
    gre_score: '',
    toefl_score: '',
    pte_score: '',
    ielts_score: '',
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
    hasErrors,
    isValid,
    updateField,
    validateForm,
    getFieldProps,
    resetForm,
    setFields
  } = useFormValidation(initialFormData, leadFormConfig);

  const [testScoresOpen, setTestScoresOpen] = useState(false);
  const [coApplicantOpen, setCoApplicantOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [amountInWords, setAmountInWords] = useState<string>('');
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const { appUser } = useAuth();

  const countries = [
    'United States',
    'Canada', 
    'United Kingdom',
    'Australia',
    'Germany',
    'France',
    'Netherlands',
    'Singapore',
    'Ireland',
    'New Zealand'
  ];

  const validateUniversities = (): boolean => {
    if (formData.universities.length === 0 || !formData.universities[0].trim()) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isFormValid = validateForm() && validateUniversities();
    
    if (!isFormValid) {
      const errorCount = Object.keys(errors).filter(key => errors[key]).length;
      const universitiesError = !validateUniversities();
      
      toast({
        title: "Please complete all required fields",
        description: universitiesError 
          ? "Please select at least one university to continue"
          : `Please fix ${errorCount} field${errorCount > 1 ? 's' : ''} marked in red`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session: currentSession }, error: currentSessionError } = await supabase.auth.getSession();
      
      if (currentSessionError || !currentSession) {
        throw new Error('You are not logged in. Please refresh the page and log in again.');
      }

      // Process universities
      const processedUniversities = await Promise.all(
        formData.universities
          .filter(u => u && u.trim())
          .map(async (uni) => {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uni);
            
            if (isUUID) {
              return uni;
            }
            
            const { data: newUni, error: uniError } = await supabase
              .from('universities')
              .insert({
                name: uni.trim(),
                country: formData.country,
                city: 'Unknown'
              })
              .select('id')
              .single();
            
            if (uniError) {
              throw new Error(`Failed to add custom university: ${uni}`);
            }
            
            return newUni.id;
          })
      );

      const leadPayload = {
        student_name: formData.student_name,
        student_phone: formData.student_phone,
        student_email: formData.student_email,
        student_pin_code: formData.student_pin_code,
        country: formData.country,
        universities: processedUniversities,
        intake_month: formData.intake_month,
        loan_type: formData.loan_type,
        amount_requested: formData.amount_requested,
        gmat_score: formData.gmat_score,
        gre_score: formData.gre_score,
        toefl_score: formData.toefl_score,
        pte_score: formData.pte_score,
        ielts_score: formData.ielts_score,
        co_applicant_name: formData.co_applicant_name,
        co_applicant_email: formData.co_applicant_email,
        co_applicant_phone: formData.co_applicant_phone,
        co_applicant_salary: formData.co_applicant_salary,
        co_applicant_relationship: formData.co_applicant_relationship,
        co_applicant_pin_code: formData.co_applicant_pin_code
      };
      
      const { data, error } = await supabase.functions.invoke('create-lead', {
        body: leadPayload
      });

      if (error) {
        throw new Error(error.message || 'Failed to create lead');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create lead');
      }
      
      toast({
        title: "Lead Created Successfully",
        description: `Case ${data.lead.case_id} has been created and is now visible in your leads list.`,
      });

      setCreatedLead(data.lead);
      setPhase('documents');

    } catch (error: any) {
      let errorTitle = 'Failed to Create Application';
      let errorDescription = error.message;
      
      if (error.message?.includes('Authentication') || error.message?.includes('session')) {
        errorTitle = 'Session Expired';
        errorDescription = 'Please refresh the page and log in again.';
      } else if (error.message?.includes('Permission') || error.message?.includes('Access denied')) {
        errorTitle = 'Access Denied';
        errorDescription = `${error.message} If this persists, please contact your administrator.`;
      }
      
      handleError(error, {
        title: errorTitle,
        description: errorDescription
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    updateField(field, value);
    
    if (field === 'amount_requested') {
      const numericAmount = parseFloat(value);
      if (!isNaN(numericAmount) && numericAmount > 0) {
        setAmountInWords(convertNumberToWords(numericAmount));
      } else {
        setAmountInWords('');
      }
    }
    
    if (field === 'universities') {
      setFields({ universities: [value] });
    }
  };

  const handleUniversitiesChange = useCallback((universities: string[]) => {
    setFields({ universities });
  }, [setFields]);

  const handleCompleteProcess = () => {
    // Navigate back to partner dashboard
    if (partnerCode) {
      navigate(`/partner/${partnerCode}`);
    } else {
      navigate('/');
    }
  };

  const handleSkipDocuments = () => {
    toast({
      title: "Lead Created",
      description: "You can upload documents later from the lead details page.",
    });
    handleCompleteProcess();
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card shadow-sm">
          <div className="max-w-5xl mx-auto px-6 py-5">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (phase === 'documents') {
                    setPhase('form');
                  } else {
                    navigate(-1);
                  }
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {phase === 'form' ? 'Create New Lead' : 'Upload Documents'}
                </h1>
                {phase === 'documents' && createdLead && (
                  <p className="text-sm text-muted-foreground">
                    Lead created successfully • Case {createdLead.case_id}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          {phase === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Information Section */}
              <Card className="border-muted">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student_name" className="text-sm font-medium">
                      What's your full name? <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="student_name"
                      {...getFieldProps('student_name')}
                      onChange={(e) => handleInputChange('student_name', e.target.value)}
                      placeholder="Your full name"
                      className={errors.student_name ? 'border-destructive focus:border-destructive' : ''}
                    />
                    <p className="text-xs text-muted-foreground">This will be used in your loan documents</p>
                    {errors.student_name && (
                      <p className="text-sm text-destructive">{errors.student_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student_phone" className="text-sm font-medium">
                      What's your mobile number? <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="student_phone"
                      value={formData.student_phone}
                      onChange={(e) => handleInputChange('student_phone', e.target.value)}
                      placeholder="Your 10-digit mobile number"
                      className={errors.student_phone ? 'border-destructive' : ''}
                    />
                    <p className="text-xs text-muted-foreground">We'll send you updates on this number</p>
                    {errors.student_phone && (
                      <p className="text-sm text-destructive">{errors.student_phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student_email" className="text-sm font-medium">
                      What's your email? <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id="student_email"
                      type="email"
                      value={formData.student_email}
                      onChange={(e) => handleInputChange('student_email', e.target.value)}
                      placeholder="your.email@example.com"
                      className={errors.student_email ? 'border-destructive' : ''}
                    />
                    {errors.student_email && (
                      <p className="text-sm text-destructive">{errors.student_email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student_pin_code" className="text-sm font-medium">
                      What's your PIN code? <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="student_pin_code"
                      value={formData.student_pin_code}
                      onChange={(e) => handleInputChange('student_pin_code', e.target.value)}
                      placeholder="Your area PIN code"
                      maxLength={6}
                      className={errors.student_pin_code ? 'border-destructive' : ''}
                    />
                    {errors.student_pin_code && (
                      <p className="text-sm text-destructive">{errors.student_pin_code}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Test Scores Section */}
              <Collapsible open={testScoresOpen} onOpenChange={setTestScoresOpen}>
                <Card className="border-muted">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-4 cursor-pointer hover:bg-accent/50 transition-colors">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center">
                          <Trophy className="h-5 w-5 mr-2 text-primary" />
                          Test Scores
                          <span className="text-sm text-muted-foreground font-normal ml-2">(Optional)</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", testScoresOpen && "transform rotate-180")} />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="toefl_score" className="text-sm font-medium">
                            TOEFL Score <span className="text-muted-foreground">(0-120)</span>
                          </Label>
                          <Input
                            id="toefl_score"
                            type="number"
                            value={formData.toefl_score}
                            onChange={(e) => handleInputChange('toefl_score', e.target.value)}
                            placeholder="e.g., 90"
                            min="0"
                            max="120"
                            className={errors.toefl_score ? 'border-destructive' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pte_score" className="text-sm font-medium">
                            PTE Score <span className="text-muted-foreground">(10-90)</span>
                          </Label>
                          <Input
                            id="pte_score"
                            type="number"
                            value={formData.pte_score}
                            onChange={(e) => handleInputChange('pte_score', e.target.value)}
                            placeholder="e.g., 65"
                            min="10"
                            max="90"
                            className={errors.pte_score ? 'border-destructive' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gmat_score" className="text-sm font-medium">
                            GMAT Score <span className="text-muted-foreground">(200-800)</span>
                          </Label>
                          <Input
                            id="gmat_score"
                            type="number"
                            value={formData.gmat_score}
                            onChange={(e) => handleInputChange('gmat_score', e.target.value)}
                            placeholder="e.g., 650"
                            min="200"
                            max="800"
                            className={errors.gmat_score ? 'border-destructive' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gre_score" className="text-sm font-medium">
                            GRE Score <span className="text-muted-foreground">(260-340)</span>
                          </Label>
                          <Input
                            id="gre_score"
                            type="number"
                            value={formData.gre_score}
                            onChange={(e) => handleInputChange('gre_score', e.target.value)}
                            placeholder="e.g., 310"
                            min="260"
                            max="340"
                            className={errors.gre_score ? 'border-destructive' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ielts_score" className="text-sm font-medium">
                            IELTS Score <span className="text-muted-foreground">(0-9)</span>
                          </Label>
                          <Input
                            id="ielts_score"
                            type="number"
                            value={formData.ielts_score}
                            onChange={(e) => handleInputChange('ielts_score', e.target.value)}
                            placeholder="e.g., 7.5"
                            min="0"
                            max="9"
                            step="0.5"
                            className={errors.ielts_score ? 'border-destructive' : ''}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Case Information Section */}
              <Card className="border-muted">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                    Study Destination & Program
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Where are you planning to study? <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => {
                        handleInputChange('country', value);
                        setFields({ universities: [''] });
                      }}
                    >
                      <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select your destination country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.country && (
                      <p className="text-sm text-destructive">{errors.country}</p>
                    )}
                  </div>

                  <UniversitySelector
                    country={formData.country}
                    universities={formData.universities}
                    onChange={handleUniversitiesChange}
                    error={errors.universities}
                  />

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      When do you plan to start? <span className="text-destructive">*</span>
                    </Label>
                    <MonthYearPicker
                      value={formData.intake_month}
                      onChange={(value) => handleInputChange('intake_month', value)}
                      placeholder="Select your intake month and year"
                      error={!!errors.intake_month}
                    />
                    {errors.intake_month && (
                      <p className="text-sm text-destructive">{errors.intake_month}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Do you have collateral to offer? <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      (Don't worry, this won't affect your application, just helps us find the best match)
                    </p>
                    <RadioGroup
                      value={formData.loan_type}
                      onValueChange={(value: 'secured' | 'unsecured') => {
                        handleInputChange('loan_type', value);
                      }}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="secured" id="secured" />
                        <Label htmlFor="secured" className="font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unsecured" id="unsecured" />
                        <Label htmlFor="unsecured" className="font-normal cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                    {errors.loan_type && (
                      <p className="text-sm text-destructive">{errors.loan_type}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount_requested" className="text-sm font-medium">
                      How much funding do you need? <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="amount_requested"
                      type="number"
                      value={formData.amount_requested}
                      onChange={(e) => handleInputChange('amount_requested', e.target.value)}
                      placeholder="Amount in rupees (e.g., 2000000 for ₹20 lakhs)"
                      step="1000"
                      className={errors.amount_requested ? 'border-destructive' : ''}
                    />
                    <p className="text-xs text-muted-foreground">Between ₹1 lakh and ₹2 crores</p>
                    {amountInWords && (
                      <p className="text-sm text-muted-foreground">
                        ₹ {amountInWords}
                      </p>
                    )}
                    {errors.amount_requested && (
                      <p className="text-sm text-destructive">{errors.amount_requested}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Co-applicant Section */}
              <Collapsible open={coApplicantOpen} onOpenChange={setCoApplicantOpen}>
                <Card className="border-muted">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-4 cursor-pointer hover:bg-accent/50 transition-colors">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 mr-2 text-primary" />
                          Who will be your co-applicant?
                          <span className="text-destructive ml-1">*</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", coApplicantOpen && "transform rotate-180")} />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="co_applicant_name" className="text-sm font-medium">
                            What's their full name? <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="co_applicant_name"
                            value={formData.co_applicant_name}
                            onChange={(e) => handleInputChange('co_applicant_name', e.target.value)}
                            placeholder="Co-applicant's full name"
                            className={errors.co_applicant_name ? 'border-destructive' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="co_applicant_phone" className="text-sm font-medium">
                            What's their phone number? <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="co_applicant_phone"
                            value={formData.co_applicant_phone}
                            onChange={(e) => handleInputChange('co_applicant_phone', e.target.value)}
                            placeholder="Their 10-digit phone number"
                            className={errors.co_applicant_phone ? 'border-destructive' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            How are they related to you? <span className="text-destructive">*</span>
                          </Label>
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
                              <SelectItem value="relative">Relative</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="co_applicant_salary" className="text-sm font-medium">
                            What's their annual salary? <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="co_applicant_salary"
                            type="number"
                            value={formData.co_applicant_salary}
                            onChange={(e) => handleInputChange('co_applicant_salary', e.target.value)}
                            placeholder="Annual income in rupees (e.g., 500000)"
                            className={errors.co_applicant_salary ? 'border-destructive' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="co_applicant_pin_code" className="text-sm font-medium">
                            What's their PIN code? <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="co_applicant_pin_code"
                            value={formData.co_applicant_pin_code}
                            onChange={(e) => handleInputChange('co_applicant_pin_code', e.target.value)}
                            placeholder="Their area PIN code"
                            maxLength={6}
                            className={errors.co_applicant_pin_code ? 'border-destructive' : ''}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Submit Button */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Lead
                </Button>
              </div>
            </form>
          ) : (
            // Documents Phase
            <div className="space-y-6">
              <Card className="border-success/20 bg-success/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-success/20">
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Lead Created Successfully!</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Case ID: {createdLead?.case_id}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        You can now upload required documents or skip this step and upload them later.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {createdLead && (
                <DocumentUploadSection
                  leadId={createdLead.id}
                  onDocumentsChange={(uploaded, required) => {
                    console.log(`Documents: ${uploaded}/${required}`);
                  }}
                />
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleSkipDocuments}
                >
                  Skip for Now
                </Button>
                <Button onClick={handleCompleteProcess}>
                  Complete & View Lead
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default NewLeadPage;

