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
  onContinueApplication?: (leadId: string) => void;
  partnerId?: string;
}

interface QuickFormData {
  country: string;
  university_id: string;
  loan_amount: string;
  co_applicant_monthly_salary: string;
}

interface SaveFormData {
  student_name: string;
  student_phone: string;
}

interface QuickFormErrors {
  country?: string;
  university_id?: string;
  loan_amount?: string;
  co_applicant_monthly_salary?: string;
}

interface SaveFormErrors {
  student_name?: string;
  student_phone?: string;
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
  country: "",
  university_id: "",
  loan_amount: "",
  co_applicant_monthly_salary: "",
};

const initialSaveForm: SaveFormData = {
  student_name: "",
  student_phone: "",
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
      headline: "Excellent Match!",
      emoji: "🎉",
      subtext: "Multiple lenders are eager to fund this application!",
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50",
      icon: Trophy,
      ctaText: "Fast-Track This Application",
    };
  } else if (lenderCount >= 3) {
    return {
      headline: "Great Opportunity!",
      emoji: "✨",
      subtext: "Strong options available. Highly likely to get approved.",
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      bgGradient: "from-blue-50 to-indigo-50",
      icon: Star,
      ctaText: "Complete & Get Offers",
    };
  } else if (lenderCount >= 2) {
    return {
      headline: "Good Options!",
      emoji: "💪",
      subtext: "Solid lending options available for this profile.",
      gradient: "from-amber-500 via-orange-500 to-yellow-500",
      bgGradient: "from-amber-50 to-orange-50",
      icon: Rocket,
      ctaText: "Let's Make It Happen",
    };
  } else if (lenderCount >= 1) {
    return {
      headline: "Option Available",
      emoji: "🚀",
      subtext: "Complete the application to explore this option.",
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      bgGradient: "from-violet-50 to-purple-50",
      icon: Sparkles,
      ctaText: "Explore This Option",
    };
  } else {
    return {
      headline: "Let's Explore",
      emoji: "🔍",
      subtext: "Complete application for personalized options.",
      gradient: "from-slate-500 via-gray-500 to-zinc-500",
      bgGradient: "from-slate-50 to-gray-50",
      icon: Sparkles,
      ctaText: "Complete Application",
    };
  }
};

// Lender count display component
const LenderDisplay = ({ count, config }: { count: number; config: TierConfig }) => {
  const [animatedCount, setAnimatedCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedCount(count);
    }, 100);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div className="text-center">
      <div className={cn(
        "inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br shadow-lg",
        config.gradient
      )}>
        <span className="text-4xl font-bold text-white">
          {animatedCount}
        </span>
      </div>
      <p className="mt-3 text-lg font-semibold text-foreground">
        {count === 1 ? 'Lender' : 'Lenders'} Ready to Fund
      </p>
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
  const [saveForm, setSaveForm] = useState<SaveFormData>(initialSaveForm);
  const [quickErrors, setQuickErrors] = useState<QuickFormErrors>({});
  const [saveErrors, setSaveErrors] = useState<SaveFormErrors>({});
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  const handleQuickChange = useCallback((field: keyof QuickFormData, value: string) => {
    setQuickForm(prev => ({ ...prev, [field]: value }));
    setQuickErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const handleSaveChange = useCallback((field: keyof SaveFormData, value: string) => {
    setSaveForm(prev => ({ ...prev, [field]: value }));
    setSaveErrors(prev => ({ ...prev, [field]: undefined }));
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

  const validateSaveForm = (): boolean => {
    const newErrors: SaveFormErrors = {};

    if (!saveForm.student_name.trim()) {
      newErrors.student_name = "Required";
    } else if (saveForm.student_name.trim().length < 2) {
      newErrors.student_name = "Min 2 characters";
    }

    const cleanPhone = saveForm.student_phone.replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.student_phone = "Required";
    } else if (cleanPhone.length !== 10) {
      newErrors.student_phone = "Must be 10 digits";
    } else if (!/^[6-9]/.test(cleanPhone)) {
      newErrors.student_phone = "Invalid number";
    }

    setSaveErrors(newErrors);
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
      
      const eligibility = await calculateEligibility(loanAmount, salary, quickForm.university_id);
      setResult(eligibility);
      toast.success('Score calculated!');

    } catch (error: any) {
      toast.error(error.message || 'Failed to check eligibility');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveLead = async () => {
    if (!validateSaveForm() || !result) return;

    setIsSaving(true);

    try {
      const loanAmount = parseInt(quickForm.loan_amount.replace(/,/g, ''));
      const salary = parseFloat(quickForm.co_applicant_monthly_salary.replace(/,/g, ''));
      const studentPhone = saveForm.student_phone.replace(/\D/g, '');
      
      // Calculate default intake (next available intake - 3 months from now)
      const now = new Date();
      const futureDate = new Date(now.setMonth(now.getMonth() + 3));
      const defaultIntakeMonth = futureDate.getMonth() + 1; // 1-indexed
      const defaultIntakeYear = futureDate.getFullYear();

      const { data, error } = await supabase.functions.invoke('create-lead-quick', {
        body: {
          student_name: saveForm.student_name.trim(),
          student_phone: studentPhone,
          student_pin_code: '000000',
          country: result.universityCountry,
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
          eligibility_score: result.score,
          eligibility_result: result.result,
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
      toast.success('Lead saved successfully!');
      onSuccess?.(data.lead.id);

    } catch (error: any) {
      toast.error(error.message || 'Failed to save lead');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isChecking && !isSaving) {
      setQuickForm(initialQuickForm);
      setSaveForm(initialSaveForm);
      setQuickErrors({});
      setSaveErrors({});
      setResult(null);
      setLeadId(null);
      onClose();
    }
  };

  const handleContinueApplication = () => {
    if (leadId) {
      onContinueApplication?.(leadId);
      handleClose();
    }
  };


  // Result Screen with Save Form
  if (result) {
    const tierConfig = getTierConfig(result.lenderCount);
    const TierIcon = tierConfig.icon;

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md overflow-hidden p-0">
          {/* Lender Count Header */}
          <div className={cn(
            "relative px-6 pt-5 pb-6 bg-gradient-to-br text-center",
            tierConfig.bgGradient
          )}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">{tierConfig.emoji}</span>
              <h2 className={cn(
                "text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                tierConfig.gradient
              )}>
                {tierConfig.headline}
              </h2>
            </div>

            <LenderDisplay count={result.lenderCount} config={tierConfig} />

            <p className="mt-3 text-sm text-muted-foreground">
              {tierConfig.subtext}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Quick Breakdown */}
            <div className="flex gap-4">
              <div className="flex-1 text-center p-3 rounded-lg bg-muted/50">
                <GraduationCap className="h-5 w-5 mx-auto text-primary mb-1" />
                <div className="text-sm font-semibold">Grade {result.breakdown.university.grade}</div>
                <div className="text-xs text-muted-foreground">University</div>
              </div>
              <div className="flex-1 text-center p-3 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 mx-auto text-primary mb-1" />
                <div className="text-sm font-semibold">{result.breakdown.coApplicant.salaryBand}</div>
                <div className="text-xs text-muted-foreground">Co-Applicant</div>
              </div>
            </div>

            {/* Loan Estimate */}
            <div className="p-3 rounded-xl border bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Potential Loan</div>
                  <div className="text-xl font-bold text-primary">
                    ₹{(result.estimatedLoanMax / 100000).toFixed(0)}L
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Interest Rate</div>
                  <div className="text-sm font-semibold">
                    {result.estimatedRateMin}% - {result.estimatedRateMax}%
                  </div>
                </div>
              </div>
            </div>

            {/* Save Lead Form */}
            {!leadId ? (
              <div className="space-y-3 pt-2 border-t">
                <div className="text-center">
                  <h3 className="font-semibold text-sm">Save This Result</h3>
                  <p className="text-xs text-muted-foreground">Enter student details to continue</p>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={saveForm.student_name}
                      onChange={(e) => handleSaveChange('student_name', e.target.value)}
                      placeholder="Student Name"
                      className={cn("pl-9 h-10", saveErrors.student_name && 'border-destructive')}
                    />
                  </div>
                  {saveErrors.student_name && (
                    <p className="text-xs text-destructive">{saveErrors.student_name}</p>
                  )}

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={saveForm.student_phone}
                      onChange={(e) => handleSaveChange('student_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Phone Number (10 digits)"
                      className={cn("pl-9 h-10", saveErrors.student_phone && 'border-destructive')}
                    />
                  </div>
                  {saveErrors.student_phone && (
                    <p className="text-xs text-destructive">{saveErrors.student_phone}</p>
                  )}
                </div>

                <Button 
                  onClick={handleSaveLead} 
                  disabled={isSaving}
                  className="w-full h-11 gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Save & Continue
                    </>
                  )}
                </Button>
              </div>
            ) : (
              /* Lead Saved - Show Continue Button */
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Lead Saved!</span>
                </div>

                <Button 
                  onClick={handleContinueApplication} 
                  size="lg"
                  className="w-full h-12 gap-2"
                >
                  <TierIcon className="h-5 w-5" />
                  {tierConfig.ctaText}
                  <ArrowRight className="h-5 w-5" />
                </Button>

                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-green-600" />
                    Secure
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    48hr Response
                  </span>
                </div>

                <Button variant="ghost" onClick={handleClose} className="w-full">
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Quick Check Form - Just 3 Fields!
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            30-Second Eligibility Check
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground -mt-2 mb-4">
          Just 3 quick questions to see the score
        </div>

        <div className="space-y-4">
          {/* Country - Inline Buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Study Destination</Label>
            <div className="grid grid-cols-3 gap-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    handleQuickChange('country', c.value);
                    handleQuickChange('university_id', '');
                  }}
                  className={cn(
                    "py-2 px-3 text-sm rounded-lg border transition-all",
                    quickForm.country === c.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border"
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
            <Label className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              University
            </Label>
            <div className={quickErrors.university_id ? '[&_button]:border-destructive' : ''}>
              <UniversityCombobox
                country={quickForm.country}
                value={quickForm.university_id}
                onChange={(value) => handleQuickChange('university_id', value)}
                placeholder="Type to search university..."
                disabled={!quickForm.country}
              />
            </div>
            {quickErrors.university_id && (
              <p className="text-xs text-destructive">{quickErrors.university_id}</p>
            )}
          </div>

          {/* Salary */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Co-Applicant Monthly Salary
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                value={quickForm.co_applicant_monthly_salary}
                onChange={(e) => handleQuickChange('co_applicant_monthly_salary', formatCurrencyInput(e.target.value))}
                placeholder="75,000"
                className={cn("pl-7 h-11 text-base", quickErrors.co_applicant_monthly_salary && 'border-destructive')}
              />
            </div>
            {salaryInWords && (
              <p className="text-xs text-muted-foreground">₹ {salaryInWords} per month</p>
            )}
            {quickErrors.co_applicant_monthly_salary && (
              <p className="text-xs text-destructive">{quickErrors.co_applicant_monthly_salary}</p>
            )}
          </div>

          {/* Loan Amount */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Loan Amount Needed
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                value={quickForm.loan_amount}
                onChange={(e) => handleQuickChange('loan_amount', formatCurrencyInput(e.target.value))}
                placeholder="15,00,000"
                className={cn("pl-7 h-11 text-base", quickErrors.loan_amount && 'border-destructive')}
              />
            </div>
            {loanAmountInWords && (
              <p className="text-xs text-muted-foreground">₹ {loanAmountInWords}</p>
            )}
            {quickErrors.loan_amount && (
              <p className="text-xs text-destructive">{quickErrors.loan_amount}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col gap-2 pt-4">
          <Button 
            onClick={handleCheckEligibility} 
            disabled={isChecking} 
            size="lg"
            className="w-full h-12 gap-2 text-base"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <TrendingUp className="h-5 w-5" />
                Check Eligibility
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
          
          <p className="text-center text-xs text-muted-foreground">
            No lead created until you save
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
