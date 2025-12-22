import { useState, useCallback, useMemo, useEffect } from "react";
import { 
  Loader2, CheckCircle2, TrendingUp, Building2, ArrowRight, Share2,
  Sparkles, Trophy, Rocket, Shield, Zap, Clock, Smartphone, Star,
  GraduationCap, Users, BadgeCheck, User, Phone
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UniversityCombobox } from "@/components/ui/university-combobox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EligibilityCheckModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (leadId: string) => void;
  onContinueApplication?: (leadId: string) => Promise<void> | void;
  partnerId?: string;
}

interface QuickFormData {
  student_name: string;
  student_phone: string;
  country: string;
  university_id: string;
  loan_amount: string;
  co_applicant_monthly_salary: string;
}

interface QuickFormErrors {
  student_name?: string;
  student_phone?: string;
  country?: string;
  university_id?: string;
  loan_amount?: string;
  co_applicant_monthly_salary?: string;
}

const COUNTRIES = [
  { value: "United States", label: "USA" },
  { value: "United Kingdom", label: "UK" },
  { value: "Canada", label: "Canada" },
  { value: "Australia", label: "Australia" },
  { value: "Germany", label: "Germany" },
  { value: "Ireland", label: "Ireland" },
  { value: "Not Specified", label: "Other" },
];

interface EligibilityResult {
  score: number;
  result: 'eligible' | 'conditional' | 'unlikely';
  breakdown: {
    university: { score: number; maxScore: number; grade: string };
    coApplicant: { score: number; maxScore: number; salaryBand: string };
  };
  estimatedLoanMin: number;
  estimatedLoanMax: number;
  estimatedRateMin: number;
  estimatedRateMax: number;
  lenderCount: number;
  universityCountry: string;
}

const initialQuickForm: QuickFormData = {
  student_name: "",
  student_phone: "",
  country: "",
  university_id: "",
  loan_amount: "",
  co_applicant_monthly_salary: "",
};

// Tier configuration type
interface TierConfig {
  headline: string;
  emoji: string;
  subtext: string;
  gradient: string;
  bgGradient: string;
  icon: React.ComponentType<{ className?: string }>;
  ctaText: string;
}

// Tier-based messaging and styling - based on lender count
const getTierConfig = (lenderCount: number): TierConfig => {
  if (lenderCount >= 4) {
    return {
      headline: "Strong Profile!",
      emoji: "🎉",
      subtext: "This profile qualifies with multiple lending partners.",
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50",
      icon: Trophy,
      ctaText: "Complete Application",
    };
  } else if (lenderCount >= 3) {
    return {
      headline: "Good Match!",
      emoji: "✨",
      subtext: "Strong lending options available for this profile.",
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      bgGradient: "from-blue-50 to-indigo-50",
      icon: Star,
      ctaText: "Complete Application",
    };
  } else if (lenderCount >= 2) {
    return {
      headline: "Options Available",
      emoji: "💪",
      subtext: "Lending partners available for this profile.",
      gradient: "from-amber-500 via-orange-500 to-yellow-500",
      bgGradient: "from-amber-50 to-orange-50",
      icon: Rocket,
      ctaText: "Complete Application",
    };
  } else if (lenderCount >= 1) {
    return {
      headline: "Option Found",
      emoji: "🚀",
      subtext: "A lending partner is available for this profile.",
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      bgGradient: "from-violet-50 to-purple-50",
      icon: Sparkles,
      ctaText: "Complete Application",
    };
  } else {
    return {
      headline: "Let's Explore",
      emoji: "🔍",
      subtext: "Complete the application for personalized options.",
      gradient: "from-slate-500 via-gray-500 to-zinc-500",
      bgGradient: "from-slate-50 to-gray-50",
      icon: Sparkles,
      ctaText: "Complete Application",
    };
  }
};

// Lender count display component - cleaner layout
const LenderDisplay = ({ count, config }: { count: number; config: TierConfig }) => {
  const [animatedCount, setAnimatedCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedCount(count);
    }, 100);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div className="flex items-center justify-center gap-4">
      <div className={cn(
        "flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br shadow-lg",
        config.gradient
      )}>
        <span className="text-3xl font-bold text-white">
          {animatedCount}
        </span>
      </div>
      <div className="text-left">
        <p className="text-xl font-bold text-foreground">
          {count === 1 ? 'Lender' : 'Lenders'}
        </p>
        <p className="text-sm text-muted-foreground">
          ready to lend
        </p>
      </div>
    </div>
  );
};

export const EligibilityCheckModal = ({ 
  open, 
  onClose, 
  onSuccess,
  onContinueApplication,
  partnerId
}: EligibilityCheckModalProps) => {
  const [quickForm, setQuickForm] = useState<QuickFormData>(initialQuickForm);
  const [quickErrors, setQuickErrors] = useState<QuickFormErrors>({});
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  const handleQuickChange = useCallback((field: keyof QuickFormData, value: string) => {
    setQuickForm(prev => ({ ...prev, [field]: value }));
    setQuickErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const formatCurrencyInput = useCallback((value: string): string => {
    const num = value.replace(/,/g, '').replace(/\D/g, '');
    if (!num) return '';
    return parseInt(num).toLocaleString('en-IN');
  }, []);

  const numberToWords = (n: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return n.toString();
  };

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
      return `${wholeCrores}.${decimalPart.toString().padStart(2, '0')} Crore`;
    }
    
    if (num >= 100000) {
      const lakhs = num / 100000;
      const wholeLakhs = Math.floor(lakhs);
      const decimalPart = Math.round((lakhs - wholeLakhs) * 100);
      if (decimalPart === 0) {
        return `${numberToWords(wholeLakhs)} Lakh`;
      }
      return `${wholeLakhs}.${decimalPart.toString().padStart(2, '0')} Lakh`;
    }
    
    if (num >= 1000) {
      const thousands = num / 1000;
      const wholeThousands = Math.floor(thousands);
      return `${numberToWords(wholeThousands)} Thousand`;
    }
    
    return `₹${num.toLocaleString('en-IN')}`;
  }, []);

  const loanAmountInWords = useMemo(() => getAmountInWords(quickForm.loan_amount), [quickForm.loan_amount, getAmountInWords]);
  const salaryInWords = useMemo(() => getAmountInWords(quickForm.co_applicant_monthly_salary), [quickForm.co_applicant_monthly_salary, getAmountInWords]);

  const validateQuickForm = (): boolean => {
    const newErrors: QuickFormErrors = {};

    // Validate student name
    if (!quickForm.student_name.trim()) {
      newErrors.student_name = "Required";
    } else if (quickForm.student_name.trim().length < 2) {
      newErrors.student_name = "Min 2 characters";
    }

    // Validate student phone
    const cleanPhone = quickForm.student_phone.replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.student_phone = "Required";
    } else if (cleanPhone.length !== 10) {
      newErrors.student_phone = "Must be 10 digits";
    } else if (!/^[6-9]/.test(cleanPhone)) {
      newErrors.student_phone = "Invalid number";
    }

    if (!quickForm.country) {
      newErrors.country = "Select a country";
    }

    if (!quickForm.university_id) {
      newErrors.university_id = "Required";
    }

    const loanAmount = parseInt(quickForm.loan_amount.replace(/,/g, '') || '0');
    if (!quickForm.loan_amount) {
      newErrors.loan_amount = "Required";
    } else if (loanAmount < 100000) {
      newErrors.loan_amount = "Min ₹1 Lakh";
    } else if (loanAmount > 10000000) {
      newErrors.loan_amount = "Max ₹1 Crore";
    }

    const salary = parseFloat(quickForm.co_applicant_monthly_salary.replace(/,/g, ''));
    if (!quickForm.co_applicant_monthly_salary) {
      newErrors.co_applicant_monthly_salary = "Required";
    } else if (isNaN(salary) || salary < 10000) {
      newErrors.co_applicant_monthly_salary = "Min ₹10,000";
    }

    setQuickErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEligibility = async (loanAmount: number, salary: number, universityId: string): Promise<EligibilityResult> => {
    // Fetch university score and country from database
    let universityScore = 20;
    let universityGrade = 'C';
    let universityCountry = 'USA';
    
    if (universityId) {
      const { data: university } = await supabase
        .from('universities')
        .select('score, global_rank, country')
        .eq('id', universityId)
        .single();
      
      if (university) {
        universityCountry = university.country || 'USA';
        const uniScore = university.score || 0;
        if (uniScore >= 90) { universityGrade = 'A'; universityScore = 40; }
        else if (uniScore >= 70) { universityGrade = 'B'; universityScore = 32; }
        else if (uniScore >= 50) { universityGrade = 'C'; universityScore = 25; }
        else { universityGrade = 'D'; universityScore = 18; }
      }
    }
    
    // Co-applicant salary scoring (max 35 points)
    let salaryScore = 0;
    let salaryBand = 'Below 50K';
    if (salary >= 100000) { salaryScore = 35; salaryBand = 'Above 1L'; }
    else if (salary >= 75000) { salaryScore = 28; salaryBand = '75K-1L'; }
    else if (salary >= 50000) { salaryScore = 20; salaryBand = '50K-75K'; }
    else { salaryScore = 12; salaryBand = 'Below 50K'; }
    
    // Default relationship to parent (15 points)
    const relationshipScore = 15;
    
    // Total score (max 100 - without credit bonus for quick check)
    let score = universityScore + salaryScore + relationshipScore;
    score = Math.min(100, Math.max(0, score));
    
    // Determine result category
    let resultCategory: 'eligible' | 'conditional' | 'unlikely';
    if (score >= 65) resultCategory = 'eligible';
    else if (score >= 45) resultCategory = 'conditional';
    else resultCategory = 'unlikely';
    
    // Calculate loan ranges based on score
    const baseAmount = loanAmount;
    let loanMin = 0, loanMax = 0, rateMin = 14, rateMax = 16;
    
    if (score >= 80) {
      loanMin = baseAmount * 0.9; loanMax = baseAmount;
      rateMin = 10.5; rateMax = 11.5;
    } else if (score >= 65) {
      loanMin = baseAmount * 0.7; loanMax = baseAmount * 0.9;
      rateMin = 11.5; rateMax = 12.5;
    } else if (score >= 50) {
      loanMin = baseAmount * 0.5; loanMax = baseAmount * 0.7;
      rateMin = 12.5; rateMax = 13.5;
    } else if (score >= 40) {
      loanMin = baseAmount * 0.3; loanMax = baseAmount * 0.5;
      rateMin = 13.5; rateMax = 14.5;
    }
    
    // Count active lenders
    const { count } = await supabase
      .from('lenders')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    return {
      score: Math.round(score),
      result: resultCategory,
      breakdown: {
        university: { score: universityScore, maxScore: 40, grade: universityGrade },
        coApplicant: { score: salaryScore + relationshipScore, maxScore: 50, salaryBand },
      },
      estimatedLoanMin: loanMin,
      estimatedLoanMax: loanMax,
      estimatedRateMin: rateMin,
      estimatedRateMax: rateMax,
      lenderCount: count || 4,
      universityCountry,
    };
  };

  const handleCheckEligibility = async () => {
    if (!validateQuickForm()) return;

    setIsChecking(true);

    try {
      const loanAmount = parseInt(quickForm.loan_amount.replace(/,/g, ''));
      const salary = parseFloat(quickForm.co_applicant_monthly_salary.replace(/,/g, ''));
      const studentPhone = quickForm.student_phone.replace(/\D/g, '');
      
      const eligibility = await calculateEligibility(loanAmount, salary, quickForm.university_id);
      setResult(eligibility);
      
      // Calculate default intake (next available intake - 3 months from now)
      const now = new Date();
      const futureDate = new Date(now.setMonth(now.getMonth() + 3));
      const defaultIntakeMonth = futureDate.getMonth() + 1; // 1-indexed
      const defaultIntakeYear = futureDate.getFullYear();

      // Auto-save the lead with the eligibility result
      const { data, error } = await supabase.functions.invoke('create-lead-quick', {
        body: {
          student_name: quickForm.student_name.trim(),
          student_phone: studentPhone,
          student_pin_code: '000000',
          country: eligibility.universityCountry,
          university_id: quickForm.university_id,
          loan_amount: loanAmount,
          intake_month: defaultIntakeMonth,
          intake_year: defaultIntakeYear,
          co_applicant_relationship: 'parent',
          co_applicant_name: 'Co-Applicant',
          co_applicant_monthly_salary: salary,
          co_applicant_phone: studentPhone, // Use student phone as placeholder
          co_applicant_pin_code: '000000',
          source: 'eligibility_check',
          eligibility_score: eligibility.score,
          eligibility_result: eligibility.result,
          partner_id: partnerId,
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to save lead');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to save lead');
      }

      setLeadId(data.lead.id);
      toast.success('Eligibility checked & lead saved!');
      onSuccess?.(data.lead.id);

    } catch (error: any) {
      toast.error(error.message || 'Failed to check eligibility');
    } finally {
      setIsChecking(false);
    }
  };

  const handleClose = () => {
    if (!isChecking) {
      setQuickForm(initialQuickForm);
      setQuickErrors({});
      setResult(null);
      setLeadId(null);
      onClose();
    }
  };

  const handleContinueApplication = async () => {
    if (leadId && onContinueApplication) {
      // Wait for parent to open CompleteLeadModal before closing this modal
      await onContinueApplication(leadId);
      handleClose();
    }
  };

  // Fetch university name for display
  const [universityName, setUniversityName] = useState<string>("");
  
  useEffect(() => {
    const fetchUniversityName = async () => {
      if (quickForm.university_id) {
        const { data } = await supabase
          .from('universities')
          .select('name')
          .eq('id', quickForm.university_id)
          .single();
        if (data) setUniversityName(data.name);
      }
    };
    fetchUniversityName();
  }, [quickForm.university_id]);

  // Result Screen - Redesigned
  if (result) {
    const tierConfig = getTierConfig(result.lenderCount);
    const TierIcon = tierConfig.icon;
    const loanAmountFormatted = parseInt(quickForm.loan_amount.replace(/,/g, '') || '0');
    const salaryFormatted = parseInt(quickForm.co_applicant_monthly_salary.replace(/,/g, '') || '0');

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md overflow-hidden p-0">
          {/* Hero Header with Lender Count */}
          <div className={cn(
            "relative px-6 pt-6 pb-5 bg-gradient-to-br",
            tierConfig.bgGradient
          )}>
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl">{tierConfig.emoji}</span>
                <h2 className={cn(
                  "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  tierConfig.gradient
                )}>
                  {tierConfig.headline}
                </h2>
              </div>

              <LenderDisplay count={result.lenderCount} config={tierConfig} />
            </div>
          </div>

          {/* Student Info Card */}
          <div className="px-5 -mt-3">
            <div className="bg-background rounded-xl border shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {quickForm.student_name}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    +91 {quickForm.student_phone}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Saved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 py-4 space-y-4">
            {/* Captured Data Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span className="text-xs">University</span>
                </div>
                <p className="text-sm font-medium truncate" title={universityName}>
                  {universityName || 'Loading...'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="text-xs">Loan Amount</span>
                </div>
                <p className="text-sm font-medium">
                  ₹{(loanAmountFormatted / 100000).toFixed(1)}L
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-xs">Co-Applicant Salary</span>
                </div>
                <p className="text-sm font-medium">
                  ₹{(salaryFormatted / 1000).toFixed(0)}K/mo
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                <div className="flex items-center gap-1.5 text-primary">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-xs">Est. Rate</span>
                </div>
                <p className="text-sm font-medium text-primary">
                  {result.estimatedRateMin}% - {result.estimatedRateMax}%
                </p>
              </div>
            </div>

            {/* What's Next Section */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Just 3 more details needed
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Course, Co-Applicant Phone & PIN Code
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2 pt-1">
              <Button 
                onClick={handleContinueApplication} 
                size="lg"
                className={cn(
                  "w-full h-12 gap-2 text-base bg-gradient-to-r shadow-lg",
                  tierConfig.gradient
                )}
              >
                <TierIcon className="h-5 w-5" />
                Complete Application
                <ArrowRight className="h-5 w-5" />
              </Button>

              <Button 
                variant="outline" 
                onClick={handleClose} 
                className="w-full"
              >
                Save for Later
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-green-600" />
                  Secure
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  48hr Response
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Quick Check Form - Beautiful redesign with better UX
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-6 py-5 text-primary-foreground">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2Mkgy NHYtMmgxMnptMC00djJIMjR2LTJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
          <div className="relative flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Quick Eligibility Check</h2>
              <p className="text-sm text-primary-foreground/80">Get instant results in under 30 seconds</p>
            </div>
          </div>
          {/* Progress dots */}
          <div className="absolute bottom-3 right-6 flex items-center gap-1.5">
            <div className="w-8 h-1.5 rounded-full bg-white/90" />
            <div className="w-8 h-1.5 rounded-full bg-white/30" />
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Two-column layout for name & phone */}
          <div className="grid grid-cols-2 gap-4">
            {/* Student Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Student Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={quickForm.student_name}
                  onChange={(e) => handleQuickChange('student_name', e.target.value)}
                  placeholder="Full name"
                  className={cn("pl-10 h-12 bg-muted/50 border-border/50 focus:bg-background transition-colors", quickErrors.student_name && 'border-destructive')}
                />
              </div>
              {quickErrors.student_name && (
                <p className="text-xs text-destructive">{quickErrors.student_name}</p>
              )}
            </div>

            {/* Student Phone */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={quickForm.student_phone}
                  onChange={(e) => handleQuickChange('student_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10 digits"
                  className={cn("pl-10 h-12 bg-muted/50 border-border/50 focus:bg-background transition-colors", quickErrors.student_phone && 'border-destructive')}
                />
              </div>
              {quickErrors.student_phone && (
                <p className="text-xs text-destructive">{quickErrors.student_phone}</p>
              )}
            </div>
          </div>

          {/* Country - Pill Buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Study Destination</Label>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    handleQuickChange('country', c.value);
                    handleQuickChange('university_id', '');
                  }}
                  className={cn(
                    "py-2.5 px-4 text-sm font-medium rounded-full border-2 transition-all duration-200",
                    quickForm.country === c.value
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 scale-105"
                      : "bg-background hover:bg-muted border-border hover:border-primary/30"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {quickErrors.country && (
              <p className="text-xs text-destructive">{quickErrors.country}</p>
            )}
          </div>

          {/* University */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              University
            </Label>
            <div className={cn(
              "rounded-xl overflow-hidden",
              quickErrors.university_id ? '[&_button]:border-destructive' : ''
            )}>
              <UniversityCombobox
                country={quickForm.country}
                value={quickForm.university_id}
                onChange={(value) => handleQuickChange('university_id', value)}
                placeholder={quickForm.country ? "Search and select university..." : "Select country first"}
                disabled={!quickForm.country}
              />
            </div>
            {quickErrors.university_id && (
              <p className="text-xs text-destructive">{quickErrors.university_id}</p>
            )}
          </div>

          {/* Two-column for salary and loan */}
          <div className="grid grid-cols-2 gap-4">
            {/* Salary */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Co-Applicant Salary</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                <Input
                  value={quickForm.co_applicant_monthly_salary}
                  onChange={(e) => handleQuickChange('co_applicant_monthly_salary', formatCurrencyInput(e.target.value))}
                  placeholder="Monthly"
                  className={cn("pl-8 h-12 bg-muted/50 border-border/50 focus:bg-background text-base font-medium", quickErrors.co_applicant_monthly_salary && 'border-destructive')}
                />
              </div>
              {salaryInWords && (
                <p className="text-xs text-muted-foreground">{salaryInWords}/mo</p>
              )}
              {quickErrors.co_applicant_monthly_salary && (
                <p className="text-xs text-destructive">{quickErrors.co_applicant_monthly_salary}</p>
              )}
            </div>

            {/* Loan Amount */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Loan Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                <Input
                  value={quickForm.loan_amount}
                  onChange={(e) => handleQuickChange('loan_amount', formatCurrencyInput(e.target.value))}
                  placeholder="Required"
                  className={cn("pl-8 h-12 bg-muted/50 border-border/50 focus:bg-background text-base font-medium", quickErrors.loan_amount && 'border-destructive')}
                />
              </div>
              {loanAmountInWords && (
                <p className="text-xs text-muted-foreground">{loanAmountInWords}</p>
              )}
              {quickErrors.loan_amount && (
                <p className="text-xs text-destructive">{quickErrors.loan_amount}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-6 pb-6 pt-2">
          <Button 
            onClick={handleCheckEligibility} 
            disabled={isChecking} 
            size="lg"
            className="w-full h-14 gap-3 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing Profile...
              </>
            ) : (
              <>
                <TrendingUp className="h-5 w-5" />
                Check Eligibility
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
          
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-500" />
              Secure & Private
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-500" />
              Instant Results
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              Auto-Saved
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
