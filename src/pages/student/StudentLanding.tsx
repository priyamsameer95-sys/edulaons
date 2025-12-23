import { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { UniversityCombobox } from "@/components/ui/university-combobox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  GraduationCap, 
  ArrowRight, 
  Sparkles,
  Check,
  TrendingUp,
  Clock,
  Shield,
  Star,
  Zap,
  User,
  Phone,
  Loader2,
  Trophy,
  Rocket,
  Building2,
  Users,
  BadgeCheck,
  ChevronLeft
} from "lucide-react";
import { formatIndianNumber } from "@/utils/currencyFormatter";

// Country data
const COUNTRIES = [
  { code: "USA", name: "USA", flag: "🇺🇸", value: "United States" },
  { code: "UK", name: "UK", flag: "🇬🇧", value: "United Kingdom" },
  { code: "Canada", name: "Canada", flag: "🇨🇦", value: "Canada" },
  { code: "Australia", name: "Australia", flag: "🇦🇺", value: "Australia" },
  { code: "Germany", name: "Germany", flag: "🇩🇪", value: "Germany" },
  { code: "Ireland", name: "Ireland", flag: "🇮🇪", value: "Ireland" },
];

interface FormData {
  student_name: string;
  student_phone: string;
  country: string;
  university_id: string;
  loan_amount: number[];
  co_applicant_monthly_salary: string;
}

interface FormErrors {
  student_name?: string;
  student_phone?: string;
  country?: string;
  university_id?: string;
  loan_amount?: string;
  co_applicant_monthly_salary?: string;
}

interface EligibilityResult {
  score: number;
  lenderCount: number;
  estimatedRateMin: number;
  estimatedRateMax: number;
  estimatedLoanMin: number;
  estimatedLoanMax: number;
}

interface TierConfig {
  headline: string;
  emoji: string;
  subtext: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
}

const getTierConfig = (lenderCount: number): TierConfig => {
  if (lenderCount >= 4) {
    return {
      headline: "Excellent Match!",
      emoji: "🎉",
      subtext: "You qualify with multiple top lenders",
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      icon: Trophy,
    };
  } else if (lenderCount >= 3) {
    return {
      headline: "Strong Profile!",
      emoji: "✨",
      subtext: "Great options available for you",
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      icon: Star,
    };
  } else if (lenderCount >= 2) {
    return {
      headline: "Good Options!",
      emoji: "💪",
      subtext: "Lenders available for your profile",
      gradient: "from-amber-500 via-orange-500 to-yellow-500",
      icon: Rocket,
    };
  } else if (lenderCount >= 1) {
    return {
      headline: "Option Found!",
      emoji: "🚀",
      subtext: "A lender is ready for your application",
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      icon: Sparkles,
    };
  } else {
    return {
      headline: "Let's Explore",
      emoji: "🔍",
      subtext: "Complete application for personalized options",
      gradient: "from-slate-500 via-gray-500 to-zinc-500",
      icon: Sparkles,
    };
  }
};

// Calculate EMI
const calculateEMI = (principal: number, rate: number, years: number = 10): number => {
  const monthlyRate = rate / 12 / 100;
  const months = years * 12;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi);
};

const initialFormData: FormData = {
  student_name: "",
  student_phone: "",
  country: "",
  university_id: "",
  loan_amount: [35],
  co_applicant_monthly_salary: "",
};

const StudentLanding = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string>("");

  // Format amount for display
  const formatAmount = (value: number): string => {
    if (value >= 100) return "₹1 Cr+";
    return `₹${value} Lakhs`;
  };

  const formatCurrencyInput = useCallback((value: string): string => {
    const num = value.replace(/,/g, '').replace(/\D/g, '');
    if (!num) return '';
    return parseInt(num).toLocaleString('en-IN');
  }, []);

  const getAmountInWords = useCallback((value: string): string => {
    const num = parseInt(value.replace(/,/g, '') || '0');
    if (num === 0) return '';
    
    if (num >= 100000) {
      const lakhs = num / 100000;
      return `${lakhs.toFixed(lakhs % 1 === 0 ? 0 : 1)} Lakh/month`;
    }
    
    if (num >= 1000) {
      const thousands = num / 1000;
      return `${thousands.toFixed(0)}K/month`;
    }
    
    return `₹${num.toLocaleString('en-IN')}/month`;
  }, []);

  const salaryInWords = useMemo(() => getAmountInWords(formData.co_applicant_monthly_salary), [formData.co_applicant_monthly_salary, getAmountInWords]);

  const handleChange = useCallback((field: keyof FormData, value: string | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  // Fetch university name when selected
  useEffect(() => {
    const fetchUniversityName = async () => {
      if (formData.university_id && formData.university_id.length > 10) {
        const { data } = await supabase
          .from('universities')
          .select('name')
          .eq('id', formData.university_id)
          .single();
        if (data) setUniversityName(data.name);
      } else {
        setUniversityName(formData.university_id || "");
      }
    };
    fetchUniversityName();
  }, [formData.university_id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.student_name.trim()) {
      newErrors.student_name = "Name is required";
    } else if (formData.student_name.trim().length < 2) {
      newErrors.student_name = "Min 2 characters";
    }

    const cleanPhone = formData.student_phone.replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.student_phone = "Phone is required";
    } else if (cleanPhone.length !== 10) {
      newErrors.student_phone = "Must be 10 digits";
    } else if (!/^[6-9]/.test(cleanPhone)) {
      newErrors.student_phone = "Invalid number";
    }

    if (!formData.country) {
      newErrors.country = "Select a country";
    }

    if (!formData.university_id) {
      newErrors.university_id = "University is required";
    }

    const salary = parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, ''));
    if (!formData.co_applicant_monthly_salary) {
      newErrors.co_applicant_monthly_salary = "Salary is required";
    } else if (isNaN(salary) || salary < 10000) {
      newErrors.co_applicant_monthly_salary = "Min ₹10,000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEligibility = async (loanAmount: number, salary: number, universityId: string): Promise<EligibilityResult> => {
    let universityScore = 20;
    
    if (universityId && universityId.length > 10) {
      const { data: university } = await supabase
        .from('universities')
        .select('score, global_rank')
        .eq('id', universityId)
        .single();
      
      if (university) {
        const uniScore = university.score || 0;
        if (uniScore >= 90) universityScore = 40;
        else if (uniScore >= 70) universityScore = 32;
        else if (uniScore >= 50) universityScore = 25;
        else universityScore = 18;
      }
    }
    
    let salaryScore = 0;
    if (salary >= 100000) salaryScore = 35;
    else if (salary >= 75000) salaryScore = 28;
    else if (salary >= 50000) salaryScore = 20;
    else salaryScore = 12;
    
    const relationshipScore = 15;
    let score = Math.min(100, Math.max(0, universityScore + salaryScore + relationshipScore));
    
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
    
    const { count } = await supabase
      .from('lenders')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    return {
      score: Math.round(score),
      lenderCount: count || 4,
      estimatedLoanMin: loanMin,
      estimatedLoanMax: loanMax,
      estimatedRateMin: rateMin,
      estimatedRateMax: rateMax,
    };
  };

  const handleCheckEligibility = async () => {
    if (!validateForm()) return;

    setIsChecking(true);

    try {
      const loanAmount = formData.loan_amount[0] * 100000;
      const salary = parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, ''));
      const studentPhone = formData.student_phone.replace(/\D/g, '');
      
      // Get country value for DB
      const countryData = COUNTRIES.find(c => c.code === formData.country);
      const countryValue = countryData?.value || formData.country;
      
      const eligibility = await calculateEligibility(loanAmount, salary, formData.university_id);
      setResult(eligibility);
      
      // Calculate default intake (3 months from now)
      const now = new Date();
      const futureDate = new Date(now.setMonth(now.getMonth() + 3));
      const defaultIntakeMonth = futureDate.getMonth() + 1;
      const defaultIntakeYear = futureDate.getFullYear();

      // Try to save lead (without auth - this will use the edge function's anon capability)
      try {
        const { data, error } = await supabase.functions.invoke('create-lead-quick', {
          body: {
            student_name: formData.student_name.trim(),
            student_phone: studentPhone,
            student_pin_code: '000000',
            country: countryValue,
            university_id: formData.university_id.length > 10 ? formData.university_id : undefined,
            loan_amount: loanAmount,
            intake_month: defaultIntakeMonth,
            intake_year: defaultIntakeYear,
            co_applicant_relationship: 'parent',
            co_applicant_name: 'Co-Applicant',
            co_applicant_monthly_salary: salary,
            co_applicant_phone: studentPhone,
            co_applicant_pin_code: '000000',
            source: 'student_landing',
            eligibility_score: eligibility.score,
            eligibility_result: eligibility.lenderCount >= 3 ? 'eligible' : eligibility.lenderCount >= 1 ? 'conditional' : 'unlikely',
          }
        });

        if (data?.success && data?.lead?.id) {
          setLeadId(data.lead.id);
        }
      } catch (leadError) {
        // Silently fail lead creation for unauthenticated users
        console.log('Lead save skipped (auth required)');
      }

      toast.success('Eligibility check complete!');

    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsChecking(false);
    }
  };

  const handleStartOver = () => {
    setResult(null);
    setLeadId(null);
  };

  const handleContinue = () => {
    // Store form data in session for after login
    sessionStorage.setItem('eligibility_form', JSON.stringify({
      ...formData,
      loan_amount: formData.loan_amount[0] * 100000,
    }));
    navigate("/student/auth");
  };

  const tierConfig = result ? getTierConfig(result.lenderCount) : null;
  const TierIcon = tierConfig?.icon || Sparkles;
  const loanAmountLakhs = formData.loan_amount[0];
  const estimatedEMI = result ? calculateEMI(loanAmountLakhs * 100000, result.estimatedRateMin) : 0;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">EduLoanPro</span>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/student/auth">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 md:px-8 pb-8">
        <div className="max-w-2xl mx-auto pt-6 md:pt-12">
          
          {/* Headline */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              15,000+ students funded
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-3">
              Check your loan eligibility
              <br />
              <span className="text-primary">in 60 seconds</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-lg mx-auto">
              Get instant results from India's top education loan lenders. No impact on credit score.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card border border-border rounded-2xl shadow-xl shadow-primary/5 overflow-hidden">
            
            {!result ? (
              /* STEP 1: Form */
              <div className="animate-fade-in">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4 text-primary-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-bold text-lg">Quick Eligibility Check</h2>
                        <p className="text-sm text-primary-foreground/80">Fill details below</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-primary-foreground/70">Step 1 of 2</span>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-6 h-1.5 rounded-full bg-white/90" />
                        <div className="w-6 h-1.5 rounded-full bg-white/30" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-muted-foreground">Student Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={formData.student_name}
                          onChange={(e) => handleChange('student_name', e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className={cn("pl-10 h-12 bg-muted/50 border-border/50 focus:bg-background transition-colors", errors.student_name && 'border-destructive')}
                        />
                      </div>
                      {errors.student_name && <p className="text-xs text-destructive">{errors.student_name}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={formData.student_phone}
                          onChange={(e) => handleChange('student_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="e.g. 9876543210"
                          className={cn("pl-10 h-12 bg-muted/50 border-border/50 focus:bg-background transition-colors", errors.student_phone && 'border-destructive')}
                        />
                      </div>
                      {errors.student_phone && <p className="text-xs text-destructive">{errors.student_phone}</p>}
                    </div>
                  </div>

                  {/* Country Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Study Destination</Label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {COUNTRIES.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            handleChange('country', country.code);
                            handleChange('university_id', '');
                          }}
                          className={cn(
                            "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200",
                            formData.country === country.code 
                              ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' 
                              : 'border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5'
                          )}
                        >
                          <span className="text-2xl mb-1">{country.flag}</span>
                          <span className={cn("text-xs font-medium", formData.country === country.code ? 'text-primary' : 'text-foreground')}>
                            {country.name}
                          </span>
                          {formData.country === country.code && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
                  </div>

                  {/* University */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      University
                    </Label>
                    <div className={cn(errors.university_id ? '[&_button]:border-destructive' : '')}>
                      <UniversityCombobox
                        country={COUNTRIES.find(c => c.code === formData.country)?.value || ""}
                        value={formData.university_id}
                        onChange={(value) => handleChange('university_id', value)}
                        placeholder={formData.country ? "Search and select university..." : "Select country first"}
                        disabled={!formData.country}
                      />
                    </div>
                    {errors.university_id && <p className="text-xs text-destructive">{errors.university_id}</p>}
                  </div>

                  {/* Loan Amount Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-muted-foreground">Loan Amount Required</Label>
                      <span className="text-xl font-bold text-foreground">{formatAmount(formData.loan_amount[0])}</span>
                    </div>
                    <div className="py-2">
                      <Slider
                        value={formData.loan_amount}
                        onValueChange={(val) => handleChange('loan_amount', val)}
                        min={5}
                        max={100}
                        step={5}
                        className="cursor-pointer"
                      />
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>₹5L</span>
                        <span>₹25L</span>
                        <span>₹50L</span>
                        <span>₹75L</span>
                        <span>₹1Cr+</span>
                      </div>
                    </div>
                  </div>

                  {/* Co-Applicant Salary */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground">Co-Applicant Monthly Salary</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                      <Input
                        value={formData.co_applicant_monthly_salary}
                        onChange={(e) => handleChange('co_applicant_monthly_salary', formatCurrencyInput(e.target.value))}
                        placeholder="e.g. 75,000"
                        className={cn("pl-8 h-12 bg-muted/50 border-border/50 focus:bg-background text-base font-medium", errors.co_applicant_monthly_salary && 'border-destructive')}
                      />
                    </div>
                    {salaryInWords && <p className="text-xs text-muted-foreground">{salaryInWords}</p>}
                    {errors.co_applicant_monthly_salary && <p className="text-xs text-destructive">{errors.co_applicant_monthly_salary}</p>}
                  </div>

                  {/* CTA */}
                  <Button 
                    size="lg" 
                    className="w-full h-14 text-base font-semibold gap-2 rounded-xl shadow-lg shadow-primary/20"
                    onClick={handleCheckEligibility}
                    disabled={isChecking}
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Checking Eligibility...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        Check My Eligibility
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                  
                  <p className="text-center text-xs text-muted-foreground">
                    No impact on credit score • 100% secure
                  </p>
                </div>
              </div>
            ) : (
              /* STEP 2: Results */
              <div className="animate-fade-in">
                {/* Result Header */}
                <div className={cn("px-6 py-6 bg-gradient-to-r text-white", tierConfig?.gradient)}>
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-3">
                      <TierIcon className="h-4 w-4" />
                      <span className="font-semibold">{tierConfig?.headline}</span>
                    </div>
                    
                    {/* Big lender count */}
                    <div className="mt-4">
                      <div className="text-7xl font-black">{result.lenderCount}</div>
                      <div className="text-lg font-medium opacity-90">
                        {result.lenderCount === 1 ? 'Lender' : 'Lenders'} Matched
                      </div>
                    </div>
                    
                    <p className="text-sm opacity-80 mt-2">{tierConfig?.subtext}</p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Student Info */}
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{formData.student_name}</p>
                      <p className="text-xs text-muted-foreground">+91 {formData.student_phone}</p>
                    </div>
                    {leadId && (
                      <div className="flex items-center gap-1 text-success bg-success/10 px-2.5 py-1 rounded-full">
                        <Check className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Saved</span>
                      </div>
                    )}
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-3 rounded-xl bg-muted/50">
                      <GraduationCap className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground mb-0.5">University</p>
                      <p className="text-sm font-semibold truncate" title={universityName}>
                        {universityName?.split(' ').slice(0, 2).join(' ') || 'Custom'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50">
                      <Building2 className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground mb-0.5">Loan</p>
                      <p className="text-sm font-semibold">{formatAmount(loanAmountLakhs)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50">
                      <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground mb-0.5">Salary</p>
                      <p className="text-sm font-semibold">
                        ₹{(parseInt(formData.co_applicant_monthly_salary.replace(/,/g, '')) / 1000).toFixed(0)}K
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

                  {/* EMI Estimate */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated EMI</p>
                      <p className="text-2xl font-bold text-foreground">
                        ₹{formatIndianNumber(estimatedEMI)}<span className="text-sm font-normal text-muted-foreground">/month</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">10 year tenure</p>
                      <p className="text-sm font-medium text-primary">{result.estimatedRateMin}% p.a.</p>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-warning/20">
                      <Clock className="h-4 w-4 text-warning" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Complete application to get approved</p>
                      <p className="text-xs text-muted-foreground">Just a few more details needed</p>
                    </div>
                  </div>

                  {/* CTAs */}
                  <Button 
                    size="lg"
                    className={cn("w-full h-14 gap-2.5 text-base font-semibold bg-gradient-to-r shadow-xl", tierConfig?.gradient)}
                    onClick={handleContinue}
                  >
                    <TierIcon className="h-5 w-5" />
                    Complete Application
                    <ArrowRight className="h-5 w-5" />
                  </Button>

                  <Button 
                    variant="ghost" 
                    onClick={handleStartOver} 
                    className="w-full text-muted-foreground hover:text-foreground gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Start Over
                  </Button>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-success" />
                      100% Secure
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-warning" />
                      24hr Response
                    </span>
                    <span className="flex items-center gap-1">
                      <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Trust Bar */}
          <div className="mt-6 flex items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-success" />
              <span>₹500Cr+ Disbursed</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-border"></div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-warning" />
              <span>4.8/5 Rating</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-border"></div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" />
              <span>RBI Registered</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentLanding;
