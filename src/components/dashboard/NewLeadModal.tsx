import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarIcon, User, GraduationCap, Loader2, Trophy, Users, ChevronDown, FileText, ArrowRight } from "lucide-react";
import { cn, convertNumberToWords } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { UniversitySelector } from "@/components/ui/university-selector";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { supabase } from "@/integrations/supabase/client";
import { DocumentUploadSection } from "@/components/dashboard/DocumentUploadSection";
import { useFormValidation, FieldConfig } from "@/hooks/useFormValidation";
import { transformBackendError } from "@/utils/errorMessages";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface NewLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  student_name: string;
  student_phone: string;
  student_email: string;
  student_pin_code: string;
  country: string;
  universities: string[];
  intake_month: string; // "YYYY-MM" format
  loan_type: 'secured' | 'unsecured' | '';
  amount_requested: string;
  // Test scores (optional)
  gmat_score: string;
  gre_score: string;
  toefl_score: string;
  pte_score: string;
  ielts_score: string;
  // Co-applicant details
  co_applicant_name: string;
  co_applicant_salary: string;
  co_applicant_relationship: string;
  co_applicant_pin_code: string;
}

const leadFormConfig: FieldConfig = {
  student_name: { required: true, minLength: 2, maxLength: 100 },
  student_phone: { 
    required: true, 
    pattern: /^(\+[\d]{1,3}[\d\s\-\(\)]{7,14}|[\d]{10})$/
  },
  student_email: { 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  student_pin_code: { 
    required: true, 
    pattern: /^\d{6}$/
  },
  country: { required: true },
  universities: { required: true },
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

export const NewLeadModal = ({ open, onOpenChange, onSuccess }: NewLeadModalProps) => {
  // Two-phase state: 'form' for lead creation, 'documents' for document upload
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
  const [documentsUploaded, setDocumentsUploaded] = useState(0);
  const [documentsRequired, setDocumentsRequired] = useState(0);
  const { toast } = useToast();

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

  // Handle universities validation separately since it's an array
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
      // Generate unique case ID
      const caseId = `EDU-${Date.now()}`;
      
      // Parse intake month and year
      const [intakeYear, intakeMonth] = formData.intake_month ? formData.intake_month.split('-').map(Number) : [null, null];
      
      // Prepare lead data for Supabase
      const leadData = {
        case_id: caseId,
        student_name: formData.student_name.trim(),
        student_email: formData.student_email.trim() || '',
        student_phone: formData.student_phone.trim(),
        lender: 'Default Lender', // You may want to add a lender field
        loan_type: formData.loan_type === 'secured' ? 'Secured' : 'Unsecured',
        loan_amount: parseFloat(formData.amount_requested),
        study_destination: formData.country,
        intake_month: intakeMonth,
        intake_year: intakeYear,
        co_applicant_name: formData.co_applicant_name.trim(),
        co_applicant_salary: parseFloat(formData.co_applicant_salary),
        co_applicant_relationship: formData.co_applicant_relationship,
        co_applicant_pin: formData.co_applicant_pin_code.trim(),
      };
      
      // Insert lead into Supabase
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();
        
      if (leadError) {
        console.error('Lead creation error:', leadError);
        throw leadError;
      }
      
      // Insert university selections if available
      if (formData.universities.length > 0 && formData.universities[0].trim()) {
        // First, try to find universities by name
        const { data: universities, error: univError } = await supabase
          .from('universities')
          .select('id, name')
          .in('name', formData.universities.filter(u => u.trim()));
          
        if (!univError && universities && universities.length > 0) {
          const leadUniversities = universities.map(uni => ({
            lead_id: lead.id,
            university_id: uni.id
          }));
          
          const { error: junctionError } = await supabase
            .from('lead_universities')
            .insert(leadUniversities);
            
          if (junctionError) {
            console.error('University junction error:', junctionError);
          }
        }
      }
      
      toast({
        title: "Lead Created Successfully",
        description: `New lead created • Case ${caseId}`,
      });

      // Store created lead and move to document upload phase
      setCreatedLead(lead);
      setPhase('documents');

    } catch (error) {
      console.error('Error creating lead:', error);
      const userFriendlyError = transformBackendError(error);
      toast({
        title: "Unable to Create Application",
        description: userFriendlyError,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    updateField(field, value);
    
    // Update amount in words for amount_requested field
    if (field === 'amount_requested') {
      const numericAmount = parseFloat(value);
      if (!isNaN(numericAmount) && numericAmount > 0) {
        setAmountInWords(convertNumberToWords(numericAmount));
      } else {
        setAmountInWords('');
      }
    }
    
    // Handle universities array separately
    if (field === 'universities') {
      setFields({ universities: [value] });
    }
  };

  // Memoize universities onChange to prevent infinite loop
  const handleUniversitiesChange = useCallback((universities: string[]) => {
    setFields({ universities });
  }, [setFields]);

  const handleCompleteProcess = () => {
    // Reset everything and close modal
    setPhase('form');
    setCreatedLead(null);
    resetForm();
    setDocumentsUploaded(0);
    setDocumentsRequired(0);
    setAmountInWords('');
    onOpenChange(false);
    onSuccess();
  };

  const handleSkipDocuments = () => {
    toast({
      title: "Lead Created",
      description: "You can upload documents later from the lead details page.",
    });
    handleCompleteProcess();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        // Reset state when dialog closes
        setPhase('form');
        setCreatedLead(null);
        resetForm();
        setDocumentsUploaded(0);
        setDocumentsRequired(0);
        setAmountInWords('');
      }
      onOpenChange(newOpen);
    }}>
      <ErrorBoundary>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {phase === 'form' ? 'Create New Lead' : 'Upload Required Documents'}
          </DialogTitle>
          {phase === 'documents' && createdLead && (
            <p className="text-sm text-muted-foreground">
              Lead created successfully • Case {createdLead.case_id}
            </p>
          )}
        </DialogHeader>

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
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="student_name" className="text-sm font-medium">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="student_name"
                    {...getFieldProps('student_name')}
                    onChange={(e) => handleInputChange('student_name', e.target.value)}
                    placeholder="e.g., John Smith"
                    className={errors.student_name ? 'border-destructive focus:border-destructive' : ''}
                  />
                  {errors.student_name && (
                    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                      <span>💡</span>
                      {errors.student_name}
                    </p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <Label htmlFor="student_phone" className="text-sm font-medium">
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="student_phone"
                    value={formData.student_phone}
                    onChange={(e) => handleInputChange('student_phone', e.target.value)}
                    placeholder="10-digit Indian number or +Country Code"
                    className={errors.student_phone ? 'border-destructive' : ''}
                  />
                  {errors.student_phone && (
                    <p className="text-sm text-destructive">{errors.student_phone}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="student_email" className="text-sm font-medium">
                    Email Address <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="student_email"
                    type="email"
                    value={formData.student_email}
                    onChange={(e) => handleInputChange('student_email', e.target.value)}
                    placeholder="student@example.com"
                    className={errors.student_email ? 'border-destructive' : ''}
                  />
                  {errors.student_email && (
                    <p className="text-sm text-destructive">{errors.student_email}</p>
                  )}
                </div>

                {/* Student PIN Code */}
                <div className="space-y-2">
                  <Label htmlFor="student_pin_code" className="text-sm font-medium">
                    PIN Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="student_pin_code"
                    value={formData.student_pin_code}
                    onChange={(e) => handleInputChange('student_pin_code', e.target.value)}
                    placeholder="6-digit PIN code"
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
                      {/* GMAT Score */}
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
                        {errors.gmat_score && (
                          <p className="text-sm text-destructive">{errors.gmat_score}</p>
                        )}
                      </div>

                      {/* GRE Score */}
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
                        {errors.gre_score && (
                          <p className="text-sm text-destructive">{errors.gre_score}</p>
                        )}
                      </div>

                      {/* TOEFL Score */}
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
                        {errors.toefl_score && (
                          <p className="text-sm text-destructive">{errors.toefl_score}</p>
                        )}
                      </div>

                      {/* PTE Score */}
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
                        {errors.pte_score && (
                          <p className="text-sm text-destructive">{errors.pte_score}</p>
                        )}
                      </div>

                      {/* IELTS Score */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="ielts_score" className="text-sm font-medium">
                          IELTS Score <span className="text-muted-foreground">(0-9, with 0.5 increments)</span>
                        </Label>
                        <Input
                          id="ielts_score"
                          type="number"
                          value={formData.ielts_score}
                          onChange={(e) => handleInputChange('ielts_score', e.target.value)}
                          placeholder="e.g., 6.5"
                          min="0"
                          max="9"
                          step="0.5"
                          className={errors.ielts_score ? 'border-destructive' : ''}
                        />
                        {errors.ielts_score && (
                          <p className="text-sm text-destructive">{errors.ielts_score}</p>
                        )}
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
                {/* Country */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Country <span className="text-destructive">*</span>
                  </Label>
                   <Select
                    value={formData.country}
                    onValueChange={(value) => {
                      handleInputChange('country', value);
                      // Clear universities when country changes
                      setFields({ universities: [''] });
                    }}
                  >
                    <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select destination country" />
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

                {/* Universities */}
                <UniversitySelector
                  country={formData.country}
                  universities={formData.universities}
                  onChange={handleUniversitiesChange}
                  error={errors.universities}
                />

                {/* Intake Month */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Intake Month & Year <span className="text-destructive">*</span>
                  </Label>
                  <MonthYearPicker
                    value={formData.intake_month}
                    onChange={(value) => {
                      handleInputChange('intake_month', value);
                    }}
                    placeholder="Select intake month and year"
                    error={!!errors.intake_month}
                  />
                  {errors.intake_month && (
                    <p className="text-sm text-destructive">{errors.intake_month}</p>
                  )}
                </div>

                {/* Loan Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Loan Type <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={formData.loan_type}
                    onValueChange={(value: 'secured' | 'unsecured') => {
                      handleInputChange('loan_type', value);
                    }}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="secured" id="secured" />
                      <Label htmlFor="secured" className="font-normal">Secured</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unsecured" id="unsecured" />
                      <Label htmlFor="unsecured" className="font-normal">Unsecured</Label>
                    </div>
                  </RadioGroup>
                  {errors.loan_type && (
                    <p className="text-sm text-destructive">{errors.loan_type}</p>
                  )}
                </div>

                {/* Requested Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount_requested" className="text-sm font-medium">
                    Requested Amount (₹)
                  </Label>
                  <Input
                    id="amount_requested"
                    type="number"
                    value={formData.amount_requested}
                    onChange={(e) => handleInputChange('amount_requested', e.target.value)}
                    placeholder="Enter loan amount in rupees"
                    step="1000"
                  />
                  {amountInWords && (
                    <p className="text-sm text-muted-foreground">
                      ₹ {amountInWords}
                    </p>
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
                        Co-applicant Details
                        <span className="text-destructive ml-1">*</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", coApplicantOpen && "transform rotate-180")} />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Co-applicant Name */}
                      <div className="space-y-2">
                        <Label htmlFor="co_applicant_name" className="text-sm font-medium">
                          Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="co_applicant_name"
                          value={formData.co_applicant_name}
                          onChange={(e) => handleInputChange('co_applicant_name', e.target.value)}
                          placeholder="Co-applicant's full name"
                          className={errors.co_applicant_name ? 'border-destructive' : ''}
                        />
                        {errors.co_applicant_name && (
                          <p className="text-sm text-destructive">{errors.co_applicant_name}</p>
                        )}
                      </div>

                      {/* Co-applicant Relationship */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Relationship <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.co_applicant_relationship}
                          onValueChange={(value) => {
                            handleInputChange('co_applicant_relationship', value);
                          }}
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
                        {errors.co_applicant_relationship && (
                          <p className="text-sm text-destructive">{errors.co_applicant_relationship}</p>
                        )}
                      </div>

                      {/* Co-applicant Salary */}
                      <div className="space-y-2">
                        <Label htmlFor="co_applicant_salary" className="text-sm font-medium">
                          Annual Salary (₹) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="co_applicant_salary"
                          type="number"
                          value={formData.co_applicant_salary}
                          onChange={(e) => handleInputChange('co_applicant_salary', e.target.value)}
                          placeholder="Annual salary in rupees"
                          min="0"
                          className={errors.co_applicant_salary ? 'border-destructive' : ''}
                        />
                        {errors.co_applicant_salary && (
                          <p className="text-sm text-destructive">{errors.co_applicant_salary}</p>
                        )}
                      </div>

                      {/* Co-applicant PIN Code */}
                      <div className="space-y-2">
                        <Label htmlFor="co_applicant_pin_code" className="text-sm font-medium">
                          PIN Code <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="co_applicant_pin_code"
                          value={formData.co_applicant_pin_code}
                          onChange={(e) => handleInputChange('co_applicant_pin_code', e.target.value)}
                          placeholder="6-digit PIN code"
                          maxLength={6}
                          className={errors.co_applicant_pin_code ? 'border-destructive' : ''}
                        />
                        {errors.co_applicant_pin_code && (
                          <p className="text-sm text-destructive">{errors.co_applicant_pin_code}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-primary hover:bg-primary-hover min-w-24"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Lead'
                )}
              </Button>
            </div>
          </form>
        ) : (
          // Document Upload Phase
          <div className="space-y-6">
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-success mb-2">
                <FileText className="h-5 w-5" />
                <span className="font-medium">Lead Created Successfully!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Now let's upload the required documents to complete your application.
              </p>
            </div>
            
            <DocumentUploadSection 
              leadId={createdLead?.id}
              onDocumentsChange={(uploaded, required) => {
                setDocumentsUploaded(uploaded);
                setDocumentsRequired(required);
              }}
            />

            {/* Document Upload Actions */}
            <div className="flex justify-between space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipDocuments}
              >
                Skip for Now
              </Button>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPhase('form')}
                >
                  Back to Form
                </Button>
                <Button
                  type="button"
                  onClick={handleCompleteProcess}
                  className="bg-gradient-primary hover:bg-primary-hover"
                  disabled={documentsRequired > 0 && documentsUploaded === 0}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Complete
                </Button>
              </div>
            </div>
          </div>
        )}
        </DialogContent>
      </ErrorBoundary>
    </Dialog>
  );
};