import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, User, GraduationCap, Phone, Mail, MapPin, DollarSign, Building2, Loader2, Trophy, Users } from "lucide-react";
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
  intake_month: string;
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

// Animation variants
const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      duration: 0.3,
      bounce: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number]
    }
  }
};

const inputVariants = {
  focus: { 
    scale: 1.01,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }
  },
  blur: { 
    scale: 1,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }
  }
};

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
  
  const [activeSection, setActiveSection] = useState<'student' | 'case'>('student');
  const [showTestScores, setShowTestScores] = useState(false);
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

    // Phone validation
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
        lender: 'Default Lender',
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
      setActiveSection('student');
      setShowTestScores(false);

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

  const InputField = ({ 
    id, 
    label, 
    value, 
    onChange, 
    placeholder, 
    type = "text", 
    required = false, 
    error, 
    icon: Icon,
    ...props 
  }: any) => (
    <motion.div 
      className="space-y-2"
      variants={inputVariants}
      whileFocus="focus"
      initial="blur"
    >
      <Label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "transition-all duration-200 ease-in-out border-0 bg-muted/30 backdrop-blur-sm",
            "focus:bg-background/50 focus:ring-2 focus:ring-primary/20",
            "hover:bg-background/30",
            Icon && "pl-10",
            error && "border-destructive focus:ring-destructive/20"
          )}
          {...props}
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-background/80 backdrop-blur-md" />
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden border-0 bg-background/95 backdrop-blur-xl shadow-2xl">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full h-full"
            >
              <DialogHeader className="pb-6 border-b border-border/50">
                <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Create New Lead
                </DialogTitle>
                
                {/* Section Navigation */}
                <div className="flex space-x-1 mt-4 p-1 bg-muted/30 rounded-xl backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => setActiveSection('student')}
                    className={cn(
                      "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                      activeSection === 'student'
                        ? "bg-background shadow-sm text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                  >
                    <User className="h-4 w-4 inline mr-2" />
                    Student Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('case')}
                    className={cn(
                      "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                      activeSection === 'case'
                        ? "bg-background shadow-sm text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                  >
                    <GraduationCap className="h-4 w-4 inline mr-2" />
                    Case Details
                  </button>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-8">
                  <AnimatePresence mode="wait">
                    {activeSection === 'student' && (
                      <motion.div
                        key="student"
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="space-y-6"
                      >
                        {/* Student Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InputField
                            id="student_name"
                            label="Full Name"
                            value={formData.student_name}
                            onChange={(value: string) => handleInputChange('student_name', value)}
                            placeholder="Enter student's full name"
                            required
                            error={errors.student_name}
                            icon={User}
                          />

                          <InputField
                            id="student_phone"
                            label="Mobile Number"
                            value={formData.student_phone}
                            onChange={(value: string) => handleInputChange('student_phone', value)}
                            placeholder="10-digit number or +Country Code"
                            required
                            error={errors.student_phone}
                            icon={Phone}
                          />

                          <InputField
                            id="student_email"
                            label="Email Address"
                            type="email"
                            value={formData.student_email}
                            onChange={(value: string) => handleInputChange('student_email', value)}
                            placeholder="student@example.com"
                            error={errors.student_email}
                            icon={Mail}
                          />

                          <InputField
                            id="student_pin_code"
                            label="PIN Code"
                            value={formData.student_pin_code}
                            onChange={(value: string) => handleInputChange('student_pin_code', value)}
                            placeholder="6-digit PIN code"
                            maxLength={6}
                            required
                            error={errors.student_pin_code}
                            icon={MapPin}
                          />
                        </div>

                        {/* Test Scores Section */}
                        <div className="space-y-4">
                          <motion.button
                            type="button"
                            onClick={() => setShowTestScores(!showTestScores)}
                            className="flex items-center justify-between w-full p-4 bg-muted/20 rounded-xl hover:bg-muted/30 transition-all duration-200"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <div className="flex items-center">
                              <Trophy className="h-5 w-5 mr-3 text-primary" />
                              <span className="font-medium">Test Scores</span>
                              <span className="text-sm text-muted-foreground ml-2">(Optional)</span>
                            </div>
                            <motion.div
                              animate={{ rotate: showTestScores ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </motion.div>
                          </motion.button>

                          <AnimatePresence>
                            {showTestScores && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/10 rounded-xl">
                                  <InputField
                                    id="gmat_score"
                                    label="GMAT Score"
                                    type="number"
                                    value={formData.gmat_score}
                                    onChange={(value: string) => handleInputChange('gmat_score', value)}
                                    placeholder="200-800"
                                    min="200"
                                    max="800"
                                    error={errors.gmat_score}
                                  />

                                  <InputField
                                    id="gre_score"
                                    label="GRE Score"
                                    type="number"
                                    value={formData.gre_score}
                                    onChange={(value: string) => handleInputChange('gre_score', value)}
                                    placeholder="260-340"
                                    min="260"
                                    max="340"
                                    error={errors.gre_score}
                                  />

                                  <InputField
                                    id="toefl_score"
                                    label="TOEFL Score"
                                    type="number"
                                    value={formData.toefl_score}
                                    onChange={(value: string) => handleInputChange('toefl_score', value)}
                                    placeholder="0-120"
                                    min="0"
                                    max="120"
                                    error={errors.toefl_score}
                                  />

                                  <InputField
                                    id="pte_score"
                                    label="PTE Score"
                                    type="number"
                                    value={formData.pte_score}
                                    onChange={(value: string) => handleInputChange('pte_score', value)}
                                    placeholder="10-90"
                                    min="10"
                                    max="90"
                                    error={errors.pte_score}
                                  />

                                  <InputField
                                    id="ielts_score"
                                    label="IELTS Score"
                                    type="number"
                                    value={formData.ielts_score}
                                    onChange={(value: string) => handleInputChange('ielts_score', value)}
                                    placeholder="0-9"
                                    min="0"
                                    max="9"
                                    step="0.5"
                                    error={errors.ielts_score}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Co-applicant Details */}
                        <div className="space-y-4">
                          <div className="flex items-center p-4 bg-muted/20 rounded-xl">
                            <Users className="h-5 w-5 mr-3 text-primary" />
                            <span className="font-medium">Co-applicant Details</span>
                            <span className="text-destructive ml-1">*</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                              id="co_applicant_name"
                              label="Full Name"
                              value={formData.co_applicant_name}
                              onChange={(value: string) => handleInputChange('co_applicant_name', value)}
                              placeholder="Co-applicant's full name"
                              required
                              error={errors.co_applicant_name}
                              icon={User}
                            />

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-muted-foreground">
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
                                <SelectTrigger className={cn(
                                  "border-0 bg-muted/30 backdrop-blur-sm transition-all duration-200",
                                  "focus:bg-background/50 focus:ring-2 focus:ring-primary/20",
                                  "hover:bg-background/30",
                                  errors.co_applicant_relationship && "border-destructive focus:ring-destructive/20"
                                )}>
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                                <SelectContent className="bg-background/95 backdrop-blur-xl border-0">
                                  <SelectItem value="parent">Parent</SelectItem>
                                  <SelectItem value="spouse">Spouse</SelectItem>
                                  <SelectItem value="sibling">Sibling</SelectItem>
                                  <SelectItem value="guardian">Guardian</SelectItem>
                                  <SelectItem value="relative">Relative</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <AnimatePresence>
                                {errors.co_applicant_relationship && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm text-destructive"
                                  >
                                    {errors.co_applicant_relationship}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>

                            <InputField
                              id="co_applicant_salary"
                              label="Annual Salary (₹)"
                              type="number"
                              value={formData.co_applicant_salary}
                              onChange={(value: string) => handleInputChange('co_applicant_salary', value)}
                              placeholder="Annual salary in rupees"
                              min="0"
                              required
                              error={errors.co_applicant_salary}
                              icon={DollarSign}
                            />

                            <InputField
                              id="co_applicant_pin_code"
                              label="PIN Code"
                              value={formData.co_applicant_pin_code}
                              onChange={(value: string) => handleInputChange('co_applicant_pin_code', value)}
                              placeholder="6-digit PIN code"
                              maxLength={6}
                              required
                              error={errors.co_applicant_pin_code}
                              icon={MapPin}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeSection === 'case' && (
                      <motion.div
                        key="case"
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="space-y-6"
                      >
                        {/* Study Destination */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Study Destination <span className="text-destructive">*</span>
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
                            <SelectTrigger className={cn(
                              "border-0 bg-muted/30 backdrop-blur-sm transition-all duration-200",
                              "focus:bg-background/50 focus:ring-2 focus:ring-primary/20",
                              "hover:bg-background/30",
                              errors.country && "border-destructive focus:ring-destructive/20"
                            )}>
                              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                              <SelectValue placeholder="Select destination country" />
                            </SelectTrigger>
                            <SelectContent className="bg-background/95 backdrop-blur-xl border-0">
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <AnimatePresence>
                            {errors.country && (
                              <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-sm text-destructive"
                              >
                                {errors.country}
                              </motion.p>
                            )}
                          </AnimatePresence>
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
                          <Label className="text-sm font-medium text-muted-foreground">
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
                          <AnimatePresence>
                            {errors.intake_month && (
                              <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-sm text-destructive"
                              >
                                {errors.intake_month}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Loan Type */}
                        <div className="space-y-4">
                          <Label className="text-sm font-medium text-muted-foreground">
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
                            className="grid grid-cols-2 gap-4"
                          >
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className={cn(
                                "flex items-center space-x-3 p-4 rounded-xl border transition-all duration-200",
                                formData.loan_type === 'secured' 
                                  ? "bg-primary/10 border-primary/30" 
                                  : "bg-muted/20 border-transparent hover:bg-muted/30"
                              )}
                            >
                              <RadioGroupItem value="secured" id="secured" />
                              <Label htmlFor="secured" className="font-medium cursor-pointer">Secured Loan</Label>
                            </motion.div>
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className={cn(
                                "flex items-center space-x-3 p-4 rounded-xl border transition-all duration-200",
                                formData.loan_type === 'unsecured' 
                                  ? "bg-primary/10 border-primary/30" 
                                  : "bg-muted/20 border-transparent hover:bg-muted/30"
                              )}
                            >
                              <RadioGroupItem value="unsecured" id="unsecured" />
                              <Label htmlFor="unsecured" className="font-medium cursor-pointer">Unsecured Loan</Label>
                            </motion.div>
                          </RadioGroup>
                          <AnimatePresence>
                            {errors.loan_type && (
                              <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-sm text-destructive"
                              >
                                {errors.loan_type}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Requested Amount */}
                        <InputField
                          id="amount_requested"
                          label="Requested Amount (₹)"
                          type="number"
                          value={formData.amount_requested}
                          onChange={(value: string) => handleInputChange('amount_requested', value)}
                          placeholder="Enter loan amount in rupees"
                          min="1"
                          step="1000"
                          required
                          error={errors.amount_requested}
                          icon={DollarSign}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Form Actions */}
                <div className="flex justify-between items-center p-6 border-t border-border/50 bg-muted/10 backdrop-blur-sm">
                  <div className="text-sm text-muted-foreground">
                    Step {activeSection === 'student' ? '1' : '2'} of 2
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={loading}
                      className="border-0 bg-muted/30 hover:bg-muted/50 backdrop-blur-sm"
                    >
                      Cancel
                    </Button>
                    
                    {activeSection === 'student' ? (
                      <Button
                        type="button"
                        onClick={() => setActiveSection('case')}
                        className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Next: Case Details
                      </Button>
                    ) : (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 min-w-32"
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
                      </motion.div>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};