import { useState, useCallback, useMemo, useEffect } from "react";
import { 
  Loader2, CheckCircle2, TrendingUp, Building2, ArrowRight, Share2,
  Sparkles, Trophy, Rocket, Shield, Zap, Clock, Smartphone, Star,
  GraduationCap, Users, BadgeCheck
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
import { cn } from "@/lib/utils";

interface EligibilityCheckModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (leadId: string) => void;
  onContinueApplication?: (leadId: string) => void;
  partnerId?: string;
}

interface FormData {
  student_name: string;
  student_phone: string;
  country: string;
  university_id: string;
  loan_amount: string;
  co_applicant_relationship: string;
  co_applicant_monthly_salary: string;
  student_credit_score: string;
  co_applicant_credit_score: string;
}

interface FormErrors {
  student_name?: string;
  student_phone?: string;
  country?: string;
  university_id?: string;
  loan_amount?: string;
  co_applicant_relationship?: string;
  co_applicant_monthly_salary?: string;
}

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
  leadId: string;
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
  country: "",
  university_id: "",
  loan_amount: "",
  co_applicant_relationship: "",
  co_applicant_monthly_salary: "",
  student_credit_score: "",
  co_applicant_credit_score: "",
};

export const EligibilityCheckModal = ({ 
  open, 
  onClose, 
  onSuccess,
  onContinueApplication,
  partnerId
}: EligibilityCheckModalProps) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
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

  const loanAmountInWords = useMemo(() => getAmountInWords(formData.loan_amount), [formData.loan_amount, getAmountInWords]);
  const salaryInWords = useMemo(() => getAmountInWords(formData.co_applicant_monthly_salary), [formData.co_applicant_monthly_salary, getAmountInWords]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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

    if (!formData.country) {
      newErrors.country = "Required";
    }

    if (!formData.university_id) {
      newErrors.university_id = "Required";
    }

    const loanAmount = parseInt(formData.loan_amount.replace(/,/g, '') || '0');
    if (!formData.loan_amount) {
      newErrors.loan_amount = "Required";
    } else if (loanAmount < 100000) {
      newErrors.loan_amount = "Min ₹1 Lakh";
    } else if (loanAmount > 10000000) {
      newErrors.loan_amount = "Max ₹1 Crore";
    }

    if (!formData.co_applicant_relationship) {
      newErrors.co_applicant_relationship = "Required";
    }

    const salary = parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, ''));
    if (!formData.co_applicant_monthly_salary) {
      newErrors.co_applicant_monthly_salary = "Required";
    } else if (isNaN(salary) || salary < 10000) {
      newErrors.co_applicant_monthly_salary = "Min ₹10,000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEligibility = async (loanAmount: number, salary: number, universityId: string): Promise<EligibilityResult> => {
    // Scoring breakdown (adds up to 100):
    // - University: max 40 points
    // - Co-Applicant Salary: max 35 points
    // - Relationship: max 15 points
    // - Credit Bonus: max 10 points
    
    // Fetch university score from database
    let universityScore = 20; // Default for unknown
    let universityGrade = 'C';
    
    if (universityId) {
      const { data: university } = await supabase
        .from('universities')
        .select('score, global_rank')
        .eq('id', universityId)
        .single();
      
      if (university) {
        const uniScore = university.score || 0;
        // Map university score to grade and points (max 40)
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
    
    // Relationship scoring (max 15 points)
    const relationshipScores: Record<string, number> = {
      'parent': 15,
      'spouse': 12,
      'sibling': 10,
      'guardian': 10,
      'other': 7
    };
    const relationshipScore = relationshipScores[formData.co_applicant_relationship] || 7;
    
    // Credit score bonus (max 10 points - 5 each for student and co-applicant)
    let creditBonus = 0;
    const studentCredit = parseInt(formData.student_credit_score) || 0;
    const coAppCredit = parseInt(formData.co_applicant_credit_score) || 0;
    if (studentCredit >= 750) creditBonus += 5;
    else if (studentCredit >= 650) creditBonus += 3;
    if (coAppCredit >= 750) creditBonus += 5;
    else if (coAppCredit >= 650) creditBonus += 3;
    
    // Total score (max 100)
    let score = universityScore + salaryScore + relationshipScore + creditBonus;
    score = Math.min(100, Math.max(0, score));
    
    // Determine result category
    let result: 'eligible' | 'conditional' | 'unlikely';
    if (score >= 65) result = 'eligible';
    else if (score >= 45) result = 'conditional';
    else result = 'unlikely';
    
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
      result,
      breakdown: {
        university: { score: universityScore, maxScore: 40, grade: universityGrade },
        coApplicant: { score: salaryScore + relationshipScore, maxScore: 50, salaryBand },
      },
      estimatedLoanMin: loanMin,
      estimatedLoanMax: loanMax,
      estimatedRateMin: rateMin,
      estimatedRateMax: rateMax,
      lenderCount: count || 4,
      leadId: '',
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const loanAmount = parseInt(formData.loan_amount.replace(/,/g, ''));
      const salary = parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, ''));
      
      // Calculate eligibility (now async)
      const eligibility = await calculateEligibility(loanAmount, salary, formData.university_id);

      // Create lead via edge function
      const { data, error } = await supabase.functions.invoke('create-lead-quick', {
        body: {
          student_name: formData.student_name.trim(),
          student_phone: formData.student_phone.replace(/\D/g, ''),
          student_pin_code: '000000', // Placeholder for eligibility check
          country: formData.country,
          university_id: formData.university_id || undefined,
          loan_amount: loanAmount,
          co_applicant_relationship: formData.co_applicant_relationship,
          co_applicant_name: 'Co-Applicant', // Placeholder
          co_applicant_monthly_salary: salary,
          source: 'eligibility_check',
          eligibility_score: eligibility.score,
          eligibility_result: eligibility.result,
          partner_id: partnerId,
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to check eligibility');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to check eligibility');
      }

      eligibility.leadId = data.lead.id;
      setResult(eligibility);
      toast.success('Eligibility check complete!');
      onSuccess?.(data.lead.id);

    } catch (error: any) {
      toast.error(error.message || 'Failed to check eligibility');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialFormData);
      setErrors({});
      setResult(null);
      onClose();
    }
  };

  const handleContinueApplication = () => {
    if (result?.leadId) {
      onContinueApplication?.(result.leadId);
      handleClose();
    }
  };

  // Tier-based messaging and styling
  const getTierConfig = (score: number) => {
    if (score >= 80) {
      return {
        headline: "Excellent Match!",
        emoji: "🎉",
        subtext: "This student is in the top tier of applicants. Lenders are eager to fund!",
        gradient: "from-emerald-500 via-green-500 to-teal-500",
        bgGradient: "from-emerald-50 to-teal-50",
        ringColor: "stroke-emerald-500",
        icon: Trophy,
        ctaText: "Fast-Track This Application",
      };
    } else if (score >= 65) {
      return {
        headline: "Great Opportunity!",
        emoji: "✨",
        subtext: "Strong profile! With complete documents, this is highly likely to get approved.",
        gradient: "from-blue-500 via-indigo-500 to-purple-500",
        bgGradient: "from-blue-50 to-indigo-50",
        ringColor: "stroke-blue-500",
        icon: Star,
        ctaText: "Complete & Get Offers",
      };
    } else if (score >= 45) {
      return {
        headline: "Good to Go!",
        emoji: "💪",
        subtext: "Many students with similar profiles get funded. Complete details make the difference!",
        gradient: "from-amber-500 via-orange-500 to-yellow-500",
        bgGradient: "from-amber-50 to-orange-50",
        ringColor: "stroke-amber-500",
        icon: Rocket,
        ctaText: "Let's Make It Happen",
      };
    } else {
      return {
        headline: "Let's Build This Together",
        emoji: "🚀",
        subtext: "Every successful journey starts somewhere. Complete the application to explore all options.",
        gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
        bgGradient: "from-violet-50 to-purple-50",
        ringColor: "stroke-violet-500",
        icon: Sparkles,
        ctaText: "Explore All Options",
      };
    }
  };

  // Animated score ring component
  const ScoreRing = ({ score, config }: { score: number; config: ReturnType<typeof getTierConfig> }) => {
    const [animatedScore, setAnimatedScore] = useState(0);
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

    useEffect(() => {
      const timer = setTimeout(() => {
        setAnimatedScore(score);
      }, 100);
      return () => clearTimeout(timer);
    }, [score]);

    return (
      <div className="relative w-36 h-36 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Background ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          {/* Animated progress ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn(config.ringColor, "transition-all duration-1000 ease-out")}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
            }}
          />
        </svg>
        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
            config.gradient
          )}>
            {animatedScore}
          </span>
          <span className="text-xs text-muted-foreground font-medium">out of 100</span>
        </div>
      </div>
    );
  };

  // Result Screen
  if (result) {
    const tierConfig = getTierConfig(result.score);
    const TierIcon = tierConfig.icon;

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg overflow-hidden p-0">
          {/* Celebratory Header */}
          <div className={cn(
            "relative px-6 pt-6 pb-8 bg-gradient-to-br text-center overflow-hidden",
            tierConfig.bgGradient
          )}>
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-white/30 animate-pulse"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${20 + (i % 3) * 25}%`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              {/* Headline with emoji */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-3xl animate-bounce">{tierConfig.emoji}</span>
                <h2 className={cn(
                  "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  tierConfig.gradient
                )}>
                  {tierConfig.headline}
                </h2>
              </div>

              {/* Animated Score Ring */}
              <ScoreRing score={result.score} config={tierConfig} />

              {/* Motivational subtext */}
              <p className="mt-4 text-sm text-muted-foreground max-w-xs mx-auto">
                {tierConfig.subtext}
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-6 py-4 space-y-4">
            {/* Score Breakdown - Progress Style */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-primary" />
                Profile Strengths
              </h4>
              
              {/* University */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5" />
                    University Rating
                  </span>
                  <span className="font-medium text-foreground">
                    Grade {result.breakdown.university.grade}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", tierConfig.gradient)}
                    style={{ width: `${(result.breakdown.university.score / result.breakdown.university.maxScore) * 100}%` }}
                  />
                </div>
              </div>

              {/* Co-Applicant */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Co-Applicant Strength
                  </span>
                  <span className="font-medium text-foreground">
                    {result.breakdown.coApplicant.salaryBand}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700 delay-150", tierConfig.gradient)}
                    style={{ width: `${(result.breakdown.coApplicant.score / result.breakdown.coApplicant.maxScore) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Unlock Potential - Loan Range */}
            <div className={cn(
              "relative p-4 rounded-xl border-2 border-dashed",
              "bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/30"
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Unlock Up To
                  </h4>
                  <div className="text-2xl font-bold text-primary mt-1">
                    ₹{(result.estimatedLoanMax / 100000).toFixed(0)} Lakhs
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    @ {result.estimatedRateMin}% - {result.estimatedRateMax}% interest
                  </p>
                </div>
                <div className="text-right">
                  <Building2 className="h-8 w-8 text-primary/30" />
                </div>
              </div>
              <p className="text-xs text-primary/80 mt-2 font-medium">
                Complete application to maximize loan amount →
              </p>
            </div>

            {/* Dynamic Lender Message with Urgency */}
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200"
            )}>
              <div className="flex -space-x-2">
                {[...Array(Math.min(result.lenderCount, 4))].map((_, i) => (
                  <div 
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 border-2 border-white flex items-center justify-center"
                  >
                    <Building2 className="h-4 w-4 text-primary-foreground" />
                  </div>
                ))}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800">
                  {result.lenderCount}+ lenders competing for this student
                </p>
                <p className="text-xs text-emerald-600">
                  Complete now to get multiple offers
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            </div>
          </div>

          {/* Enhanced CTA Section */}
          <div className="px-6 pb-6 space-y-4">
            {/* Primary CTA */}
            <Button 
              onClick={handleContinueApplication} 
              size="lg"
              className={cn(
                "w-full h-14 text-base font-semibold gap-2 relative overflow-hidden group",
                "bg-gradient-to-r from-primary via-primary to-primary/90 hover:opacity-90"
              )}
            >
              <span className="relative z-10 flex items-center gap-2">
                <TierIcon className="h-5 w-5" />
                {tierConfig.ctaText}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </Button>
            
            {/* Helper text */}
            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Takes just 5 minutes to complete
            </p>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-4 pt-2 border-t">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-green-600" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>48hr Response</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Smartphone className="h-3.5 w-3.5 text-blue-500" />
                <span>Real-time Updates</span>
              </div>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Save & Continue Later
              </Button>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Form Screen
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Quick Eligibility Check
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-muted-foreground -mt-2 mb-2">
          Check eligibility in 45 seconds. A lead will be created automatically.
        </div>

        <div className="grid grid-cols-2 gap-3 py-2">
          {/* Student Name */}
          <div className="space-y-1">
            <Label htmlFor="student_name" className="text-xs">
              Student Name *
            </Label>
            <Input
              id="student_name"
              value={formData.student_name}
              onChange={(e) => handleInputChange('student_name', e.target.value)}
              placeholder="Full name"
              className={cn("h-9", errors.student_name && 'border-destructive')}
            />
            {errors.student_name && (
              <p className="text-xs text-destructive">{errors.student_name}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label htmlFor="student_phone" className="text-xs">
              Phone *
            </Label>
            <Input
              id="student_phone"
              value={formData.student_phone}
              onChange={(e) => handleInputChange('student_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10 digits"
              className={cn("h-9", errors.student_phone && 'border-destructive')}
            />
            {errors.student_phone && (
              <p className="text-xs text-destructive">{errors.student_phone}</p>
            )}
          </div>

          {/* Country */}
          <div className="space-y-1">
            <Label className="text-xs">Study Destination *</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => {
                handleInputChange('country', value);
                handleInputChange('university_id', '');
              }}
            >
              <SelectTrigger className={cn("h-9", errors.country && 'border-destructive')}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-xs text-destructive">{errors.country}</p>
            )}
          </div>

          {/* University */}
          <div className="space-y-1">
            <Label className="text-xs">University *</Label>
            <UniversityCombobox
              country={formData.country}
              value={formData.university_id}
              onChange={(value) => handleInputChange('university_id', value)}
              placeholder="Select university"
              disabled={!formData.country}
            />
            {errors.university_id && (
              <p className="text-xs text-destructive">{errors.university_id}</p>
            )}
          </div>

          {/* Loan Amount */}
          <div className="space-y-1">
            <Label className="text-xs">Loan Amount *</Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                value={formData.loan_amount}
                onChange={(e) => handleInputChange('loan_amount', formatCurrencyInput(e.target.value))}
                placeholder="15,00,000"
                className={cn("h-9 pl-6", errors.loan_amount && 'border-destructive')}
              />
            </div>
            {loanAmountInWords && (
              <p className="text-xs text-muted-foreground">₹ {loanAmountInWords}</p>
            )}
            {errors.loan_amount && (
              <p className="text-xs text-destructive">{errors.loan_amount}</p>
            )}
          </div>

          {/* Relationship */}
          <div className="space-y-1">
            <Label className="text-xs">Co-Applicant Relationship *</Label>
            <Select
              value={formData.co_applicant_relationship}
              onValueChange={(value) => handleInputChange('co_applicant_relationship', value)}
            >
              <SelectTrigger className={cn("h-9", errors.co_applicant_relationship && 'border-destructive')}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.co_applicant_relationship && (
              <p className="text-xs text-destructive">{errors.co_applicant_relationship}</p>
            )}
          </div>

          {/* Salary */}
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Co-Applicant Monthly Salary *</Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                value={formData.co_applicant_monthly_salary}
                onChange={(e) => handleInputChange('co_applicant_monthly_salary', formatCurrencyInput(e.target.value))}
                placeholder="75,000"
                className={cn("h-9 pl-6", errors.co_applicant_monthly_salary && 'border-destructive')}
              />
            </div>
            {salaryInWords && (
              <p className="text-xs text-muted-foreground">₹ {salaryInWords} per month</p>
            )}
            {errors.co_applicant_monthly_salary && (
              <p className="text-xs text-destructive">{errors.co_applicant_monthly_salary}</p>
            )}
          </div>

          {/* Optional Credit Scores */}
          <div className="col-span-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Optional: Add credit scores for better accuracy
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Student Credit Score</Label>
                <Input
                  value={formData.student_credit_score}
                  onChange={(e) => handleInputChange('student_credit_score', e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="e.g., 750"
                  className="h-9"
                  maxLength={3}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Co-Applicant Credit Score</Label>
                <Input
                  value={formData.co_applicant_credit_score}
                  onChange={(e) => handleInputChange('co_applicant_credit_score', e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="e.g., 780"
                  className="h-9"
                  maxLength={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                Check Eligibility
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
