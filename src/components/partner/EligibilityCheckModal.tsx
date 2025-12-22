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

// Lender count display component - Premium redesign
const LenderDisplay = ({ count, config }: { count: number; config: TierConfig }) => {
  const [animatedCount, setAnimatedCount] = useState(0);

  useEffect(() => {
    // Animate count up
    let start = 0;
    const end = count;
    const duration = 600;
    const increment = end / (duration / 50);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedCount(end);
        clearInterval(timer);
      } else {
        setAnimatedCount(Math.floor(start));
      }
    }, 50);
    
    return () => clearInterval(timer);
  }, [count]);

  return (
    <div className="relative">
      {/* Big number with glow effect */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "text-7xl font-black bg-gradient-to-br bg-clip-text text-transparent",
          config.gradient
        )}>
          {animatedCount}
        </div>
        <div className="flex items-center gap-2 -mt-1">
          <div className={cn("h-1 w-8 rounded-full bg-gradient-to-r", config.gradient)} />
          <span className="text-lg font-semibold text-foreground">
            {count === 1 ? 'Lender' : 'Lenders'} Matched
          </span>
          <div className={cn("h-1 w-8 rounded-full bg-gradient-to-r", config.gradient)} />
        </div>
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
        <DialogContent className="sm:max-w-lg overflow-hidden p-0">
          {/* Clean Hero Header */}
          <div className="relative px-6 pt-8 pb-6 bg-gradient-to-b from-muted/50 to-background">
            {/* Success Badge */}
            <div className="flex justify-center mb-4">
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r text-white font-medium shadow-lg",
                tierConfig.gradient
              )}>
                <TierIcon className="h-4 w-4" />
                <span>{tierConfig.headline}</span>
              </div>
            </div>

            {/* Big Lender Count */}
            <LenderDisplay count={result.lenderCount} config={tierConfig} />
            
            {/* Subtext */}
            <p className="text-center text-sm text-muted-foreground mt-3">
              {tierConfig.subtext}
            </p>
          </div>

          {/* Content Section */}
          <div className="px-6 pb-6 space-y-5">
            {/* Student Card - Compact */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {quickForm.student_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  +91 {quickForm.student_phone}
                </p>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Lead Saved</span>
              </div>
            </div>

            {/* Key Metrics - Clean horizontal layout */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-muted/50">
                <GraduationCap className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground mb-0.5">University</p>
                <p className="text-sm font-semibold truncate" title={universityName}>
                  {universityName?.split(' ').slice(0, 2).join(' ') || '...'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <Building2 className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground mb-0.5">Loan</p>
                <p className="text-sm font-semibold">
                  ₹{(loanAmountFormatted / 100000).toFixed(1)}L
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground mb-0.5">Salary</p>
                <p className="text-sm font-semibold">
                  ₹{(salaryFormatted / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xs text-primary/70 mb-0.5">Rate</p>
                <p className="text-sm font-semibold text-primary">
                  {result.estimatedRateMin}-{result.estimatedRateMax}%
                </p>
              </div>
            </div>

            {/* Next Steps - Compact */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Just 3 more details to complete
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Course • Co-Applicant Phone • PIN Code
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="space-y-3 pt-1">
              <Button 
                onClick={handleContinueApplication} 
                size="lg"
                className={cn(
                  "w-full h-14 gap-2.5 text-base font-semibold bg-gradient-to-r shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]",
                  tierConfig.gradient
                )}
              >
                <TierIcon className="h-5 w-5" />
                Complete Application Now
                <ArrowRight className="h-5 w-5" />
              </Button>

              <Button 
                variant="ghost" 
                onClick={handleClose} 
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Save & Continue Later
              </Button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Secure
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" />
                  24hr Response
                </span>
                <span className="flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-blue-500" />
                  Verified
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
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0">
        {/* Hero Header - Compact for mobile */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-5 py-4 sm:px-6 sm:py-5 text-primary-foreground">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2Mkgy NHYtMmgxMnptMC00djJIMjR2LTJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Quick Eligibility Check</h2>
                <p className="text-xs sm:text-sm text-primary-foreground/80">Get instant results in 30 seconds</p>
              </div>
            </div>
            {/* Step indicator */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-medium text-primary-foreground/70">Step 1 of 2</span>
              <div className="flex items-center gap-1">
                <div className="w-6 h-1.5 rounded-full bg-white/90" />
                <div className="w-6 h-1.5 rounded-full bg-white/30" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          {/* Two-column layout for name & phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Student Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Student Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={quickForm.student_name}
                  onChange={(e) => handleQuickChange('student_name', e.target.value)}
                  placeholder="e.g. Rahul Sharma"
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
                  placeholder="e.g. 9876543210"
                  className={cn("pl-10 h-12 bg-muted/50 border-border/50 focus:bg-background transition-colors", quickErrors.student_phone && 'border-destructive')}
                />
              </div>
              {quickErrors.student_phone && (
                <p className="text-xs text-destructive">{quickErrors.student_phone}</p>
              )}
            </div>
          </div>

          {/* Country - Flag chips with horizontal scroll on mobile */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Study Destination</Label>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => {
                const flags: Record<string, string> = {
                  "United States": "🇺🇸",
                  "United Kingdom": "🇬🇧", 
                  "Canada": "🇨🇦",
                  "Australia": "🇦🇺",
                  "Germany": "🇩🇪",
                  "Ireland": "🇮🇪",
                  "Not Specified": "🌍"
                };
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      handleQuickChange('country', c.value);
                      handleQuickChange('university_id', '');
                    }}
                    className={cn(
                      "flex items-center gap-1.5 py-2 px-3 text-sm font-medium rounded-full border-2 transition-all duration-200",
                      quickForm.country === c.value
                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 scale-105"
                        : "bg-background hover:bg-muted border-border hover:border-primary/30"
                    )}
                  >
                    <span className="text-base">{flags[c.value]}</span>
                    {c.label}
                  </button>
                );
              })}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Salary */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Co-Applicant Monthly Salary</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                <Input
                  value={quickForm.co_applicant_monthly_salary}
                  onChange={(e) => handleQuickChange('co_applicant_monthly_salary', formatCurrencyInput(e.target.value))}
                  placeholder="50,000"
                  className={cn("pl-8 h-12 bg-muted/50 border-border/50 focus:bg-background text-base font-medium", quickErrors.co_applicant_monthly_salary && 'border-destructive')}
                />
              </div>
              {salaryInWords && (
                <p className="text-xs text-muted-foreground">{salaryInWords}/month</p>
              )}
              {quickErrors.co_applicant_monthly_salary && (
                <p className="text-xs text-destructive">{quickErrors.co_applicant_monthly_salary}</p>
              )}
            </div>

            {/* Loan Amount */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Loan Amount Required</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                <Input
                  value={quickForm.loan_amount}
                  onChange={(e) => handleQuickChange('loan_amount', formatCurrencyInput(e.target.value))}
                  placeholder="15,00,000"
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

        {/* Footer CTA & Trust Section */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 space-y-4">
          {/* Social Proof Banner */}
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-muted/50 rounded-lg">
            <BadgeCheck className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Trusted by <span className="text-foreground font-semibold">10,000+</span> students • <span className="text-foreground font-semibold">97%</span> prediction accuracy
            </span>
          </div>

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
                Check Eligibility Now
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
          
          {/* Enhanced Trust Indicators */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1 py-2 px-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
              <Shield className="h-5 w-5 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Secure & Private</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-2 px-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Instant Results</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-2 px-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Auto-Saved</span>
            </div>
          </div>

          {/* Incentive Hook */}
          <p className="text-center text-xs text-muted-foreground">
            <Sparkles className="inline h-3.5 w-3.5 text-amber-500 mr-1" />
            Complete your application & get <span className="font-semibold text-foreground">₹500 cashback</span> on disbursal!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
