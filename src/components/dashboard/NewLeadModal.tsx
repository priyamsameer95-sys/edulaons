import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarIcon, User, GraduationCap, Loader2, Trophy, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { UniversitySelector } from "@/components/ui/university-selector";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { supabase } from "@/integrations/supabase/client";

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

interface FormErrors {
  student_name?: string;
  student_phone?: string;
  student_email?: string;
  student_pin_code?: string;
  country?: string;
  universities?: string;
  intake_month?: string;
  loan_type?: string;
  amount_requested?: string;
  gmat_score?: string;
  gre_score?: string;
  toefl_score?: string;
  pte_score?: string;
  ielts_score?: string;
  co_applicant_name?: string;
  co_applicant_salary?: string;
  co_applicant_relationship?: string;
  co_applicant_pin_code?: string;
}

export const NewLeadModal = ({ open, onOpenChange, onSuccess }: NewLeadModalProps) => {
  const [formData, setFormData] = useState<FormData>({
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
  });
  const [testScoresOpen, setTestScoresOpen] = useState(false);
  const [coApplicantOpen, setCoApplicantOpen] = useState(true); // Open by default since mandatory
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Student name validation
    if (!formData.student_name.trim()) {
      newErrors.student_name = 'Full name is required';
    } else if (formData.student_name.trim().length < 2) {
      newErrors.student_name = 'Name must be at least 2 characters';
    }

    // Phone validation (Indian 10-digit or E.164 format)
    const phoneRegex = /^(\+[\d]{1,3}[\d\s\-\(\)]{7,14}|[\d]{10})$/;
    if (!formData.student_phone.trim()) {
      newErrors.student_phone = 'Mobile number is required';
    } else if (!phoneRegex.test(formData.student_phone.replace(/\s/g, ''))) {
      newErrors.student_phone = 'Please enter a valid mobile number';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.student_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.student_email)) {
        newErrors.student_email = 'Please enter a valid email address';
      }
    }

    // Student PIN code validation
    const pinRegex = /^\d{6}$/;
    if (!formData.student_pin_code.trim()) {
      newErrors.student_pin_code = 'PIN code is required';
    } else if (!pinRegex.test(formData.student_pin_code.trim())) {
      newErrors.student_pin_code = 'Please enter a valid 6-digit PIN code';
    }

    // Country validation
    if (!formData.country) {
      newErrors.country = 'Please select a country';
    }

    // Universities validation
    if (formData.universities.length === 0 || !formData.universities[0].trim()) {
      newErrors.universities = 'At least one university is required';
    }

    // Intake validation
    if (!formData.intake_month) {
      newErrors.intake_month = 'Please select an intake month and year';
    }

    // Loan type validation
    if (!formData.loan_type) {
      newErrors.loan_type = 'Please select a loan type';
    }

    // Amount validation
    const amount = parseFloat(formData.amount_requested);
    if (!formData.amount_requested.trim()) {
      newErrors.amount_requested = 'Loan amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount_requested = 'Please enter a valid amount greater than 0';
    }

    // Test scores validation (optional but must be in valid ranges)
    if (formData.gmat_score.trim()) {
      const gmat = parseInt(formData.gmat_score);
      if (isNaN(gmat) || gmat < 200 || gmat > 800) {
        newErrors.gmat_score = 'GMAT score must be between 200-800';
      }
    }

    if (formData.gre_score.trim()) {
      const gre = parseInt(formData.gre_score);
      if (isNaN(gre) || gre < 260 || gre > 340) {
        newErrors.gre_score = 'GRE score must be between 260-340';
      }
    }

    if (formData.toefl_score.trim()) {
      const toefl = parseInt(formData.toefl_score);
      if (isNaN(toefl) || toefl < 0 || toefl > 120) {
        newErrors.toefl_score = 'TOEFL score must be between 0-120';
      }
    }

    if (formData.pte_score.trim()) {
      const pte = parseInt(formData.pte_score);
      if (isNaN(pte) || pte < 10 || pte > 90) {
        newErrors.pte_score = 'PTE score must be between 10-90';
      }
    }

    if (formData.ielts_score.trim()) {
      const ielts = parseFloat(formData.ielts_score);
      if (isNaN(ielts) || ielts < 0 || ielts > 9) {
        newErrors.ielts_score = 'IELTS score must be between 0-9';
      }
    }

    // Co-applicant validation (mandatory for all loans)
    if (!formData.co_applicant_name.trim()) {
      newErrors.co_applicant_name = 'Co-applicant name is required';
    }
    
    if (!formData.co_applicant_salary.trim()) {
      newErrors.co_applicant_salary = 'Co-applicant salary is required';
    } else {
      const salary = parseFloat(formData.co_applicant_salary);
      if (isNaN(salary) || salary <= 0) {
        newErrors.co_applicant_salary = 'Please enter a valid salary amount';
      }
    }

    if (!formData.co_applicant_relationship) {
      newErrors.co_applicant_relationship = 'Please select relationship';
    }

    if (!formData.co_applicant_pin_code.trim()) {
      newErrors.co_applicant_pin_code = 'Co-applicant PIN code is required';
    } else if (!pinRegex.test(formData.co_applicant_pin_code.trim())) {
      newErrors.co_applicant_pin_code = 'Please enter a valid 6-digit PIN code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
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

      // Reset form
      setFormData({
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
      });
      setErrors({});

      // Close modal and trigger parent callback
      onOpenChange(false);
      onSuccess();

    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: "Error Creating Lead",
        description: "Unable to create new lead. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Lead</DialogTitle>
        </DialogHeader>

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
                  value={formData.student_name}
                  onChange={(e) => handleInputChange('student_name', e.target.value)}
                  placeholder="Enter student's full name"
                  className={errors.student_name ? 'border-destructive' : ''}
                />
                {errors.student_name && (
                  <p className="text-sm text-destructive">{errors.student_name}</p>
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
                    setFormData(prev => ({ ...prev, country: value }));
                    if (errors.country) {
                      setErrors(prev => ({ ...prev, country: undefined }));
                    }
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
                onChange={(universities) => {
                  setFormData(prev => ({ ...prev, universities }));
                  if (errors.universities) {
                    setErrors(prev => ({ ...prev, universities: undefined }));
                  }
                }}
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
                    setFormData(prev => ({ ...prev, intake_month: value }));
                    if (errors.intake_month) {
                      setErrors(prev => ({ ...prev, intake_month: undefined }));
                    }
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
                    setFormData(prev => ({ ...prev, loan_type: value }));
                    if (errors.loan_type) {
                      setErrors(prev => ({ ...prev, loan_type: undefined }));
                    }
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
                  Requested Amount (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount_requested"
                  type="number"
                  value={formData.amount_requested}
                  onChange={(e) => handleInputChange('amount_requested', e.target.value)}
                  placeholder="Enter loan amount in rupees"
                  min="1"
                  step="1000"
                  className={errors.amount_requested ? 'border-destructive' : ''}
                />
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
                          setFormData(prev => ({ ...prev, co_applicant_relationship: value }));
                          if (errors.co_applicant_relationship) {
                            setErrors(prev => ({ ...prev, co_applicant_relationship: undefined }));
                          }
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
      </DialogContent>
    </Dialog>
  );
};