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
  ChevronLeft,
  Sparkles
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
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
}

const getTierConfig = (lenderCount: number): TierConfig => {
  if (lenderCount >= 4) {
    return {
      headline: "Excellent Match",
      subtext: "You qualify with multiple top lenders",
      icon: Trophy,
    };
  } else if (lenderCount >= 3) {
    return {
      headline: "Strong Profile",
      subtext: "Great options available for you",
      icon: Star,
    };
  } else if (lenderCount >= 2) {
    return {
      headline: "Good Options",
      subtext: "Lenders available for your profile",
      icon: Rocket,
    };
  } else if (lenderCount >= 1) {
    return {
      headline: "Option Found",
      subtext: "A lender is ready for your application",
      icon: Sparkles,
    };
  } else {
    return {
      headline: "Let's Explore",
      subtext: "Complete application for personalized options",
      icon: Sparkles,
    };
  }
};

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

  const formatAmount = (value: number): string => {
    if (value >= 100) return "₹1 Cr+";
    return `₹${value}L`;
  };

  const formatCurrencyInput = useCallback((value: string): string => {
    const num = value.replace(/,/g, '').replace(/\D/g, '');
    if (!num) return '';
    return parseInt(num).toLocaleString('en-IN');
  }, []);

  const getAmountInWords = useCallback((value: string): string => {
    const num = parseInt(value.replace(/,/g, '') || '0');
    if (num === 0) return '';
    if (num >= 100000) return `${(num / 100000).toFixed(num % 100000 === 0 ? 0 : 1)}L/mo`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K/mo`;
    return `₹${num.toLocaleString('en-IN')}/mo`;
  }, []);

  const salaryInWords = useMemo(() => getAmountInWords(formData.co_applicant_monthly_salary), [formData.co_applicant_monthly_salary, getAmountInWords]);

  const handleChange = useCallback((field: keyof FormData, value: string | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

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

    if (!formData.student_name.trim() || formData.student_name.trim().length < 2) {
      newErrors.student_name = "Enter your name";
    }

    const cleanPhone = formData.student_phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      newErrors.student_phone = "Enter valid 10-digit number";
    }

    if (!formData.country) {
      newErrors.country = "Select destination";
    }

    if (!formData.university_id) {
      newErrors.university_id = "Select university";
    }

    const salary = parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, ''));
    if (!formData.co_applicant_monthly_salary || isNaN(salary) || salary < 10000) {
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
        .select('score')
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
    
    let salaryScore = salary >= 100000 ? 35 : salary >= 75000 ? 28 : salary >= 50000 ? 20 : 12;
    let score = Math.min(100, Math.max(0, universityScore + salaryScore + 15));
    
    let rateMin = 14, rateMax = 16, loanMin = 0, loanMax = 0;
    
    if (score >= 80) { loanMin = loanAmount * 0.9; loanMax = loanAmount; rateMin = 10.5; rateMax = 11.5; }
    else if (score >= 65) { loanMin = loanAmount * 0.7; loanMax = loanAmount * 0.9; rateMin = 11.5; rateMax = 12.5; }
    else if (score >= 50) { loanMin = loanAmount * 0.5; loanMax = loanAmount * 0.7; rateMin = 12.5; rateMax = 13.5; }
    else if (score >= 40) { loanMin = loanAmount * 0.3; loanMax = loanAmount * 0.5; rateMin = 13.5; rateMax = 14.5; }
    
    const { count } = await supabase.from('lenders').select('*', { count: 'exact', head: true }).eq('is_active', true);
    
    return { score: Math.round(score), lenderCount: count || 4, estimatedLoanMin: loanMin, estimatedLoanMax: loanMax, estimatedRateMin: rateMin, estimatedRateMax: rateMax };
  };

  const handleCheckEligibility = async () => {
    if (!validateForm()) return;
    setIsChecking(true);

    try {
      const loanAmount = formData.loan_amount[0] * 100000;
      const salary = parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, ''));
      const studentPhone = formData.student_phone.replace(/\D/g, '');
      const countryData = COUNTRIES.find(c => c.code === formData.country);
      
      const eligibility = await calculateEligibility(loanAmount, salary, formData.university_id);
      setResult(eligibility);
      
      const now = new Date();
      const futureDate = new Date(now.setMonth(now.getMonth() + 3));

      try {
        const { data } = await supabase.functions.invoke('create-lead-quick', {
          body: {
            student_name: formData.student_name.trim(),
            student_phone: studentPhone,
            student_pin_code: '000000',
            country: countryData?.value || formData.country,
            university_id: formData.university_id.length > 10 ? formData.university_id : undefined,
            loan_amount: loanAmount,
            intake_month: futureDate.getMonth() + 1,
            intake_year: futureDate.getFullYear(),
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
        if (data?.success && data?.lead?.id) setLeadId(data.lead.id);
      } catch {
        console.log('Lead save skipped');
      }

      toast.success('Eligibility check complete!');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsChecking(false);
    }
  };

  const handleStartOver = () => { setResult(null); setLeadId(null); };

  const handleContinue = () => {
    sessionStorage.setItem('eligibility_form', JSON.stringify({ ...formData, loan_amount: formData.loan_amount[0] * 100000 }));
    navigate("/student/auth");
  };

  const tierConfig = result ? getTierConfig(result.lenderCount) : null;
  const TierIcon = tierConfig?.icon || Sparkles;
  const loanAmountLakhs = formData.loan_amount[0];
  const estimatedEMI = result ? calculateEMI(loanAmountLakhs * 100000, result.estimatedRateMin) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-background" />
            </div>
            <span className="font-semibold text-foreground">EduLoanPro</span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/student/auth">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="pt-16 min-h-screen flex flex-col lg:flex-row">
        
        {/* Left Side - Hero Content */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-12 lg:py-0">
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-sm text-muted-foreground mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              15,000+ students funded
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-[1.1] tracking-tight mb-6">
              Education loans,
              <br />
              <span className="text-muted-foreground">simplified.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-md">
              Check your eligibility in 60 seconds. Compare rates from India's top lenders. No impact on credit score.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>₹500Cr+ Disbursed</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>4.8/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4" />
                <span>RBI Registered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-0 bg-muted/30">
          <div className="w-full max-w-md">
            
            {!result ? (
              /* Form State */
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold text-foreground">Quick eligibility check</h2>
                  <p className="text-sm text-muted-foreground">Fill in your details to see matching lenders</p>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">Your name</Label>
                    <Input
                      value={formData.student_name}
                      onChange={(e) => handleChange('student_name', e.target.value)}
                      placeholder="Rahul Sharma"
                      className={cn("h-12 bg-background", errors.student_name && 'border-destructive')}
                    />
                    {errors.student_name && <p className="text-xs text-destructive">{errors.student_name}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">Phone number</Label>
                    <Input
                      value={formData.student_phone}
                      onChange={(e) => handleChange('student_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className={cn("h-12 bg-background", errors.student_phone && 'border-destructive')}
                    />
                    {errors.student_phone && <p className="text-xs text-destructive">{errors.student_phone}</p>}
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">Study destination</Label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {COUNTRIES.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => { handleChange('country', country.code); handleChange('university_id', ''); }}
                          className={cn(
                            "flex flex-col items-center justify-center py-2.5 rounded-lg border transition-all text-center",
                            formData.country === country.code 
                              ? 'border-foreground bg-foreground text-background' 
                              : 'border-border bg-background hover:border-foreground/50'
                          )}
                        >
                          <span className="text-lg">{country.flag}</span>
                          <span className="text-[10px] font-medium mt-0.5">{country.name}</span>
                        </button>
                      ))}
                    </div>
                    {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
                  </div>

                  {/* University */}
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">University</Label>
                    <div className={cn(errors.university_id && '[&_button]:border-destructive')}>
                      <UniversityCombobox
                        country={COUNTRIES.find(c => c.code === formData.country)?.value || ""}
                        value={formData.university_id}
                        onChange={(value) => handleChange('university_id', value)}
                        placeholder={formData.country ? "Search university..." : "Select country first"}
                        disabled={!formData.country}
                      />
                    </div>
                    {errors.university_id && <p className="text-xs text-destructive">{errors.university_id}</p>}
                  </div>

                  {/* Loan Amount */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-foreground">Loan amount</Label>
                      <span className="text-lg font-semibold text-foreground">{formatAmount(formData.loan_amount[0])}</span>
                    </div>
                    <Slider
                      value={formData.loan_amount}
                      onValueChange={(val) => handleChange('loan_amount', val)}
                      min={5}
                      max={100}
                      step={5}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>₹5L</span>
                      <span>₹1Cr</span>
                    </div>
                  </div>

                  {/* Salary */}
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">Co-applicant monthly salary</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        value={formData.co_applicant_monthly_salary}
                        onChange={(e) => handleChange('co_applicant_monthly_salary', formatCurrencyInput(e.target.value))}
                        placeholder="75,000"
                        className={cn("h-12 pl-7 bg-background", errors.co_applicant_monthly_salary && 'border-destructive')}
                      />
                    </div>
                    {salaryInWords && <p className="text-xs text-muted-foreground">{salaryInWords}</p>}
                    {errors.co_applicant_monthly_salary && <p className="text-xs text-destructive">{errors.co_applicant_monthly_salary}</p>}
                  </div>
                </div>

                {/* CTA */}
                <Button 
                  size="lg" 
                  className="w-full h-12 font-medium"
                  onClick={handleCheckEligibility}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      Check Eligibility
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  No impact on credit score · 100% secure
                </p>
              </div>
            ) : (
              /* Result State */
              <div className="space-y-6 animate-fade-in">
                {/* Result Header */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-foreground text-background mb-2">
                    <TierIcon className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground">{tierConfig?.headline}</h2>
                  <p className="text-sm text-muted-foreground">{tierConfig?.subtext}</p>
                </div>

                {/* Lender Count */}
                <div className="text-center py-6 border-y border-border">
                  <div className="text-6xl font-semibold text-foreground">{result.lenderCount}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {result.lenderCount === 1 ? 'Lender' : 'Lenders'} matched
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-background border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
                    <p className="text-lg font-semibold text-foreground">{formatAmount(loanAmountLakhs)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-background border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Interest Rate</p>
                    <p className="text-lg font-semibold text-foreground">{result.estimatedRateMin}–{result.estimatedRateMax}%</p>
                  </div>
                </div>

                {/* EMI */}
                <div className="p-4 rounded-xl bg-background border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Estimated EMI</p>
                      <p className="text-2xl font-semibold text-foreground">₹{formatIndianNumber(estimatedEMI)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                    </div>
                    <p className="text-xs text-muted-foreground">10 year tenure</p>
                  </div>
                </div>

                {/* Student Info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{formData.student_name}</p>
                    <p className="text-xs text-muted-foreground">+91 {formData.student_phone}</p>
                  </div>
                  {leadId && (
                    <div className="flex items-center gap-1 text-success text-xs font-medium">
                      <Check className="h-3.5 w-3.5" />
                      Saved
                    </div>
                  )}
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  <Button size="lg" className="w-full h-12 font-medium" onClick={handleContinue}>
                    Complete Application
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleStartOver}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Start over
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  No impact on credit score · Takes 2 min to complete
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentLanding;
