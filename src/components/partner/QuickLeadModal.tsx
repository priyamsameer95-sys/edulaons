import { useState, useCallback, useMemo } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
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
import { UniversityCombobox } from "@/components/ui/university-combobox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuickLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  student_name: string;
  student_phone: string;
  student_email: string;
  student_pin_code: string;
  country: string;
  university_id: string;
  loan_amount: string;
  co_applicant_relationship: string;
  co_applicant_name: string;
  co_applicant_monthly_salary: string;
}

interface FormErrors {
  student_name?: string;
  student_phone?: string;
  student_email?: string;
  student_pin_code?: string;
  country?: string;
  university_id?: string;
  loan_amount?: string;
  co_applicant_relationship?: string;
  co_applicant_name?: string;
  co_applicant_monthly_salary?: string;
}

const COUNTRIES = [
  { value: "USA", label: "USA" },
  { value: "UK", label: "UK" },
  { value: "Canada", label: "Canada" },
  { value: "Australia", label: "Australia" },
  { value: "Germany", label: "Germany" },
  { value: "Ireland", label: "Ireland" },
  { value: "New Zealand", label: "New Zealand" },
];

const RELATIONSHIPS = [
  { value: "parent", label: "Parent" },
  { value: "spouse", label: "Spouse" },
  { value: "sibling", label: "Sibling" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

const initialFormData: FormData = {
  student_name: "",
  student_phone: "",
  student_email: "",
  student_pin_code: "",
  country: "",
  university_id: "",
  loan_amount: "",
  co_applicant_relationship: "",
  co_applicant_name: "",
  co_applicant_monthly_salary: "",
};

export const QuickLeadModal = ({ open, onClose, onSuccess }: QuickLeadModalProps) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  // Format currency with commas (use shared utility)
  const formatCurrencyInput = useCallback((value: string): string => {
    const num = value.replace(/,/g, '').replace(/\D/g, '');
    if (!num) return '';
    return parseInt(num).toLocaleString('en-IN');
  }, []);

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
  const getAmountInWords = useCallback((value: string): string => {
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
  }, []);

  // Convert loan amount to words
  const loanAmountInWords = useMemo(() => getAmountInWords(formData.loan_amount), [formData.loan_amount, getAmountInWords]);
  
  // Convert salary to words
  const salaryInWords = useMemo(() => getAmountInWords(formData.co_applicant_monthly_salary), [formData.co_applicant_monthly_salary, getAmountInWords]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Student name
    if (!formData.student_name.trim()) {
      newErrors.student_name = "Required";
    } else if (formData.student_name.trim().length < 2) {
      newErrors.student_name = "Min 2 characters";
    }

    // Phone
    const cleanPhone = formData.student_phone.replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.student_phone = "Required";
    } else if (cleanPhone.length !== 10) {
      newErrors.student_phone = "Must be 10 digits";
    } else if (!/^[6-9]/.test(cleanPhone)) {
      newErrors.student_phone = "Invalid number";
    }

    // Email (optional but must be valid if provided)
    if (formData.student_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.student_email.trim())) {
        newErrors.student_email = "Invalid email";
      }
    }

    // PIN code
    if (!formData.student_pin_code.trim()) {
      newErrors.student_pin_code = "Required";
    } else if (!/^\d{6}$/.test(formData.student_pin_code.trim())) {
      newErrors.student_pin_code = "Must be 6 digits";
    }

    // Country
    if (!formData.country) {
      newErrors.country = "Required";
    }

    // Loan Amount (required)
    const loanAmount = parseInt(formData.loan_amount.replace(/,/g, '') || '0');
    if (!formData.loan_amount) {
      newErrors.loan_amount = "Required";
    } else if (loanAmount < 100000) {
      newErrors.loan_amount = "Min ₹1 Lakh";
    } else if (loanAmount > 10000000) {
      newErrors.loan_amount = "Max ₹1 Crore";
    }

    // Relationship
    if (!formData.co_applicant_relationship) {
      newErrors.co_applicant_relationship = "Required";
    }

    // Co-Applicant Name
    if (!formData.co_applicant_name.trim()) {
      newErrors.co_applicant_name = "Required";
    } else if (formData.co_applicant_name.trim().length < 2) {
      newErrors.co_applicant_name = "Min 2 characters";
    }

    // Salary
    const salary = parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, ''));
    if (!formData.co_applicant_monthly_salary) {
      newErrors.co_applicant_monthly_salary = "Required";
    } else if (isNaN(salary) || salary < 10000) {
      newErrors.co_applicant_monthly_salary = "Min ₹10,000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-lead-quick', {
        body: {
          student_name: formData.student_name.trim(),
          student_phone: formData.student_phone.replace(/\D/g, ''),
          student_email: formData.student_email.trim() || undefined,
          student_pin_code: formData.student_pin_code.trim(),
          country: formData.country,
          university_id: formData.university_id || undefined,
          loan_amount: parseInt(formData.loan_amount.replace(/,/g, '')),
          co_applicant_relationship: formData.co_applicant_relationship,
          co_applicant_name: formData.co_applicant_name.trim(),
          co_applicant_monthly_salary: parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, '')),
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create lead');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create lead');
      }

      setCreatedCaseId(data.lead.case_id);
      setShowSuccess(true);
      toast.success('Lead created successfully!');

      // Reset form and close after delay
      setTimeout(() => {
        setFormData(initialFormData);
        setShowSuccess(false);
        setCreatedCaseId(null);
        onSuccess?.();
        onClose();
      }, 2000);

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
      setShowSuccess(false);
      onClose();
    }
  };

  // Calculate quality score based on filled fields
  const calculateQualityScore = useMemo(() => {
    let score = 0;
    const breakdown: string[] = [];
    
    if (formData.student_email.trim()) {
      score += 20;
    } else {
      breakdown.push('email');
    }
    if (formData.university_id) {
      score += 20;
    } else {
      breakdown.push('university');
    }
    if (formData.co_applicant_name.trim() && formData.co_applicant_monthly_salary) {
      score += 20;
    }
    // Loan amount in sweet spot (15-50L)
    const loanNum = parseInt(formData.loan_amount.replace(/,/g, '') || '0');
    if (loanNum >= 1500000 && loanNum <= 5000000) {
      score += 20;
    } else if (loanNum > 0) {
      score += 10;
    }
    if (formData.student_pin_code.trim()) {
      score += 20;
    }
    
    return { score, missingFields: breakdown };
  }, [formData]);

  const getQualityMessage = (score: number, missing: string[]) => {
    if (score >= 80) return "Great lead! High conversion potential.";
    if (missing.includes('email')) return "Adding email improves student response by 40%";
    if (missing.includes('university')) return "University selection speeds up lender matching";
    return "Complete profile for better lender matching";
  };

  if (showSuccess) {
    const { score, missingFields } = calculateQualityScore;
    const stars = Math.round(score / 20);
    
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm">
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">Lead Created!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Case ID: {createdCaseId}
              </p>
              
              {/* Quality Score */}
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < stars ? 'opacity-100' : 'opacity-30'}>★</span>
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">({score}%)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getQualityMessage(score, missingFields)}
                </p>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                Student will receive notification to complete details
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-primary">⚡</span>
            Add New Lead
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          {/* Student Name */}
          <div className="space-y-1.5">
            <Label htmlFor="student_name" className="text-xs">
              Student Name *
            </Label>
            <Input
              id="student_name"
              value={formData.student_name}
              onChange={(e) => handleInputChange('student_name', e.target.value)}
              placeholder="Full name"
              className={errors.student_name ? 'border-destructive' : ''}
            />
            {errors.student_name && (
              <p className="text-xs text-destructive">{errors.student_name}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="student_phone" className="text-xs">
              Phone *
            </Label>
            <Input
              id="student_phone"
              value={formData.student_phone}
              onChange={(e) => handleInputChange('student_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10 digits"
              className={errors.student_phone ? 'border-destructive' : ''}
            />
            {errors.student_phone && (
              <p className="text-xs text-destructive">{errors.student_phone}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="student_email" className="text-xs">
              Email
            </Label>
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
            ) : !formData.student_email.trim() && (
              <p className="text-xs text-muted-foreground">Leads with email convert 40% faster</p>
            )}
          </div>

          {/* PIN Code */}
          <div className="space-y-1.5">
            <Label htmlFor="student_pin_code" className="text-xs">
              PIN Code *
            </Label>
            <Input
              id="student_pin_code"
              value={formData.student_pin_code}
              onChange={(e) => handleInputChange('student_pin_code', e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 digits"
              className={errors.student_pin_code ? 'border-destructive' : ''}
            />
            {errors.student_pin_code && (
              <p className="text-xs text-destructive">{errors.student_pin_code}</p>
            )}
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <Label htmlFor="country" className="text-xs">
              Study Destination *
            </Label>
            <Select
              value={formData.country}
              onValueChange={(value) => {
                handleInputChange('country', value);
                // Reset university when country changes
                handleInputChange('university_id', '');
              }}
            >
              <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-xs text-destructive">{errors.country}</p>
            )}
          </div>

          {/* University */}
          <div className="space-y-1.5">
            <Label htmlFor="university" className="text-xs">
              University
            </Label>
            <UniversityCombobox
              country={formData.country}
              value={formData.university_id}
              onChange={(value) => handleInputChange('university_id', value)}
              placeholder="Select university"
              disabled={!formData.country}
            />
            {errors.university_id ? (
              <p className="text-xs text-destructive">{errors.university_id}</p>
            ) : !formData.university_id && formData.country && (
              <p className="text-xs text-muted-foreground">Speeds up lender matching</p>
            )}
          </div>

          {/* Loan Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="loan_amount" className="text-xs">
              Loan Amount *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                id="loan_amount"
                value={formData.loan_amount}
                onChange={(e) => handleInputChange('loan_amount', formatCurrencyInput(e.target.value))}
                placeholder="30,00,000"
                className={`pl-7 ${errors.loan_amount ? 'border-destructive' : ''}`}
              />
            </div>
            {loanAmountInWords && !errors.loan_amount && (
              <p className="text-xs text-muted-foreground">{loanAmountInWords}</p>
            )}
            {errors.loan_amount && (
              <p className="text-xs text-destructive">{errors.loan_amount}</p>
            )}
          </div>

          {/* Co-Applicant Relationship */}
          <div className="space-y-1.5">
            <Label htmlFor="relationship" className="text-xs">
              Co-Applicant Type *
            </Label>
            <Select
              value={formData.co_applicant_relationship}
              onValueChange={(value) => handleInputChange('co_applicant_relationship', value)}
            >
              <SelectTrigger className={errors.co_applicant_relationship ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.co_applicant_relationship && (
              <p className="text-xs text-destructive">{errors.co_applicant_relationship}</p>
            )}
          </div>

          {/* Co-Applicant Name */}
          <div className="space-y-1.5">
            <Label htmlFor="co_applicant_name" className="text-xs">
              Co-Applicant Name *
            </Label>
            <Input
              id="co_applicant_name"
              value={formData.co_applicant_name}
              onChange={(e) => handleInputChange('co_applicant_name', e.target.value)}
              placeholder="Full name"
              className={errors.co_applicant_name ? 'border-destructive' : ''}
            />
            {errors.co_applicant_name && (
              <p className="text-xs text-destructive">{errors.co_applicant_name}</p>
            )}
          </div>

          {/* Salary - full width */}
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="salary" className="text-xs">
              Co-Applicant Monthly Salary *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                id="salary"
                value={formData.co_applicant_monthly_salary}
                onChange={(e) => handleInputChange('co_applicant_monthly_salary', formatCurrencyInput(e.target.value))}
                placeholder="50,000"
                className={`pl-7 ${errors.co_applicant_monthly_salary ? 'border-destructive' : ''}`}
              />
            </div>
            {salaryInWords && !errors.co_applicant_monthly_salary && (
              <p className="text-xs text-muted-foreground">{salaryInWords}</p>
            )}
            {errors.co_applicant_monthly_salary && (
              <p className="text-xs text-destructive">{errors.co_applicant_monthly_salary}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
