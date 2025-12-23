import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
  Shield,
  Star,
  Zap,
  User,
  Loader2,
  Trophy,
  Rocket,
  BadgeCheck,
  ChevronLeft,
  Sparkles,
  Clock,
  FileCheck,
  TrendingUp,
  Building2,
  Users
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

// Lender data
const LENDERS = [
  { code: "SBI", name: "SBI", color: "bg-blue-600", rate: "8.65%" },
  { code: "PNB", name: "PNB", color: "bg-rose-600", rate: "7.50%" },
  { code: "ICICI", name: "ICICI", color: "bg-orange-500", rate: "10.25%" },
  { code: "CREDILA", name: "Credila", color: "bg-emerald-600", rate: "10.00%" },
];

const STEPS = [
  { icon: FileCheck, title: "Check Eligibility", desc: "60 seconds" },
  { icon: Shield, title: "Login via OTP", desc: "Mobile verify" },
  { icon: Zap, title: "Complete Form", desc: "Upload docs" },
  { icon: Trophy, title: "Get Approved", desc: "24-48 hours" },
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

const getTierConfig = (lenderCount: number) => {
  if (lenderCount >= 4) return { headline: "Excellent Match", subtext: "Multiple top lenders available", icon: Trophy };
  if (lenderCount >= 3) return { headline: "Strong Profile", subtext: "Great options for you", icon: Star };
  if (lenderCount >= 2) return { headline: "Good Options", subtext: "Lenders available", icon: Rocket };
  if (lenderCount >= 1) return { headline: "Option Found", subtext: "A lender is ready", icon: Sparkles };
  return { headline: "Let's Explore", subtext: "Complete for options", icon: Sparkles };
};

const calculateEMI = (principal: number, rate: number, years: number = 10): number => {
  const monthlyRate = rate / 12 / 100;
  const months = years * 12;
  return Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1));
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
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  const formatAmount = (value: number): string => value >= 100 ? "₹1Cr+" : `₹${value}L`;

  const formatCurrencyInput = useCallback((value: string): string => {
    const num = value.replace(/,/g, '').replace(/\D/g, '');
    return num ? parseInt(num).toLocaleString('en-IN') : '';
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

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.student_name.trim() || formData.student_name.trim().length < 2) newErrors.student_name = "Enter your name";
    const cleanPhone = formData.student_phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) newErrors.student_phone = "Enter valid 10-digit number";
    if (!formData.country) newErrors.country = "Select destination";
    if (!formData.university_id) newErrors.university_id = "Select university";
    const salary = parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, ''));
    if (!formData.co_applicant_monthly_salary || isNaN(salary) || salary < 10000) newErrors.co_applicant_monthly_salary = "Min ₹10,000";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEligibility = async (loanAmount: number, salary: number, universityId: string): Promise<EligibilityResult> => {
    let universityScore = 20;
    if (universityId && universityId.length > 10) {
      const { data: university } = await supabase.from('universities').select('score').eq('id', universityId).single();
      if (university) {
        const uniScore = university.score || 0;
        universityScore = uniScore >= 90 ? 40 : uniScore >= 70 ? 32 : uniScore >= 50 ? 25 : 18;
      }
    }
    const salaryScore = salary >= 100000 ? 35 : salary >= 75000 ? 28 : salary >= 50000 ? 20 : 12;
    const score = Math.min(100, Math.max(0, universityScore + salaryScore + 15));
    
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
      
      // Try to save lead (optional - doesn't block eligibility check)
      const now = new Date();
      const futureDate = new Date(now.setMonth(now.getMonth() + 3));
      try {
        const { data, error } = await supabase.functions.invoke('create-lead-quick', {
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
        
        // Handle response - lead already exists is OK, we just won't show the saved badge
        if (error) {
          console.log('Lead save failed (network error):', error.message);
        } else if (data?.success && data?.lead?.id) {
          setLeadId(data.lead.id);
        } else if (data?.success === false) {
          // Lead already exists or other business logic error - this is fine
          console.log('Lead not created:', data?.error || 'Unknown reason');
        }
      } catch (e) {
        // Catch any unexpected errors
        console.log('Lead save error:', e);
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
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-background" />
            </div>
            <span className="font-semibold text-foreground">EduLoanPro</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
              <Link to="/partner/login">Partner</Link>
            </Button>
            <Button size="sm" asChild className="text-xs">
              <Link to="/student/auth">Login</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Single Scroll Design */}
      <main className="pt-14">
        {/* Hero + Form Section */}
        <section className="min-h-[calc(100vh-56px)] flex flex-col lg:flex-row">
          {/* Left - Hero Content */}
          <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-8 lg:py-0">
            <div className="max-w-lg">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted/50 border border-border text-xs text-muted-foreground mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ₹500Cr+ disbursed · 15,000+ students
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight mb-4">
                Education Loans in{" "}
                <span className="text-primary">4 Simple Steps</span>
              </h1>

              {/* Subheadline */}
              <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-md">
                Compare rates from India's top banks. Check eligibility in 60 seconds — no credit score impact.
              </p>

              {/* How It Works - Compact */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {STEPS.map((step, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 mx-auto rounded-lg bg-muted flex items-center justify-center mb-1.5">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-xs font-medium text-foreground">{step.title}</p>
                    <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                  </div>
                ))}
              </div>

              {/* Lenders */}
              <div className="flex flex-wrap gap-2 mb-6">
                {LENDERS.map((lender) => (
                  <div key={lender.code} className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border border-border">
                    <div className={cn("w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold", lender.color)}>
                      {lender.code.slice(0, 2)}
                    </div>
                    <span className="text-xs text-foreground">{lender.name}</span>
                    <span className="text-[10px] text-muted-foreground">{lender.rate}</span>
                  </div>
                ))}
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  <span>RBI Registered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  <span>4.8/5 Rating</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>24-48h Approval</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Form */}
          <div ref={formRef} className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 lg:py-0 bg-muted/20">
            <div className="w-full max-w-md">
              <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-lg">
                {!result ? (
                  /* Form State */
                  <div className="space-y-4 animate-fade-in">
                    <div className="mb-1">
                      <h2 className="text-xl font-semibold text-foreground">Quick Eligibility Check</h2>
                      <p className="text-xs text-muted-foreground">See matching lenders instantly</p>
                    </div>

                    {/* Name & Phone Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-foreground">Your name</Label>
                        <Input
                          value={formData.student_name}
                          onChange={(e) => handleChange('student_name', e.target.value)}
                          placeholder="Rahul Sharma"
                          className={cn("h-10 text-sm bg-background", errors.student_name && 'border-destructive')}
                        />
                        {errors.student_name && <p className="text-[10px] text-destructive">{errors.student_name}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-foreground">Phone</Label>
                        <Input
                          value={formData.student_phone}
                          onChange={(e) => handleChange('student_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="9876543210"
                          className={cn("h-10 text-sm bg-background", errors.student_phone && 'border-destructive')}
                        />
                        {errors.student_phone && <p className="text-[10px] text-destructive">{errors.student_phone}</p>}
                      </div>
                    </div>

                    {/* Country */}
                    <div className="space-y-1">
                      <Label className="text-xs text-foreground">Study destination</Label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {COUNTRIES.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => { handleChange('country', country.code); handleChange('university_id', ''); }}
                            className={cn(
                              "flex flex-col items-center justify-center py-2 rounded-lg border transition-all",
                              formData.country === country.code 
                                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                : 'border-border bg-background hover:border-primary/50'
                            )}
                          >
                            <span className="text-lg">{country.flag}</span>
                            <span className="text-[9px] font-medium mt-0.5 text-foreground">{country.name}</span>
                          </button>
                        ))}
                      </div>
                      {errors.country && <p className="text-[10px] text-destructive">{errors.country}</p>}
                    </div>

                    {/* University */}
                    <div className="space-y-1">
                      <Label className="text-xs text-foreground">University</Label>
                      <div className={cn(errors.university_id && '[&_button]:border-destructive')}>
                        <UniversityCombobox
                          country={COUNTRIES.find(c => c.code === formData.country)?.value || ""}
                          value={formData.university_id}
                          onChange={(value) => handleChange('university_id', value)}
                          placeholder={formData.country ? "Search university..." : "Select country first"}
                          disabled={!formData.country}
                        />
                      </div>
                      {errors.university_id && <p className="text-[10px] text-destructive">{errors.university_id}</p>}
                    </div>

                    {/* Loan Amount & Salary Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-foreground">Loan amount</Label>
                          <span className="text-sm font-semibold text-foreground">{formatAmount(formData.loan_amount[0])}</span>
                        </div>
                        <Slider
                          value={formData.loan_amount}
                          onValueChange={(val) => handleChange('loan_amount', val)}
                          min={5}
                          max={100}
                          step={5}
                          className="cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>₹5L</span>
                          <span>₹1Cr</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-foreground">Co-applicant salary</Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                          <Input
                            value={formData.co_applicant_monthly_salary}
                            onChange={(e) => handleChange('co_applicant_monthly_salary', formatCurrencyInput(e.target.value))}
                            placeholder="75,000"
                            className={cn("h-10 pl-6 text-sm bg-background", errors.co_applicant_monthly_salary && 'border-destructive')}
                          />
                        </div>
                        {salaryInWords && <p className="text-[10px] text-muted-foreground">{salaryInWords}</p>}
                        {errors.co_applicant_monthly_salary && <p className="text-[10px] text-destructive">{errors.co_applicant_monthly_salary}</p>}
                      </div>
                    </div>

                    {/* CTA */}
                    <Button 
                      size="lg" 
                      className="w-full h-11 font-medium"
                      onClick={handleCheckEligibility}
                      disabled={isChecking}
                    >
                      {isChecking ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Checking...</>
                      ) : (
                        <>Check Eligibility<ArrowRight className="h-4 w-4 ml-2" /></>
                      )}
                    </Button>

                    <p className="text-center text-[10px] text-muted-foreground">
                      No credit score impact · 100% secure
                    </p>
                  </div>
                ) : (
                  /* Result State */
                  <div className="space-y-4 animate-fade-in">
                    <div className="text-center space-y-1">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-1">
                        <TierIcon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{tierConfig?.headline}</h3>
                      <p className="text-xs text-muted-foreground">{tierConfig?.subtext}</p>
                    </div>

                    <div className="text-center py-4 border-y border-border">
                      <div className="text-5xl font-bold text-primary">{result.lenderCount}</div>
                      <div className="text-xs text-muted-foreground">{result.lenderCount === 1 ? 'Lender' : 'Lenders'} matched</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                        <p className="text-[10px] text-muted-foreground">Amount</p>
                        <p className="text-sm font-semibold text-foreground">{formatAmount(loanAmountLakhs)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                        <p className="text-[10px] text-muted-foreground">Rate</p>
                        <p className="text-sm font-semibold text-foreground">{result.estimatedRateMin}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                        <p className="text-[10px] text-muted-foreground">EMI</p>
                        <p className="text-sm font-semibold text-foreground">₹{formatIndianNumber(estimatedEMI)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{formData.student_name}</p>
                        <p className="text-[10px] text-muted-foreground">+91 {formData.student_phone}</p>
                      </div>
                      {leadId && (
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-medium">
                          <Check className="h-3 w-3" />Saved
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Button size="lg" className="w-full h-11 font-medium" onClick={handleContinue}>
                        Complete Application<ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={handleStartOver}>
                        <ChevronLeft className="h-3 w-3 mr-1" />Start over
                      </Button>
                    </div>

                    <p className="text-center text-[10px] text-muted-foreground">
                      No credit impact · Takes 2 min
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us - Compact Strip */}
        <section className="py-6 px-4 sm:px-6 bg-muted/30 border-t border-border/50">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: TrendingUp, text: "Compare 4+ Lenders" },
                { icon: Shield, text: "No Credit Impact" },
                { icon: Clock, text: "24-48h Approval" },
                { icon: Building2, text: "100% Online" },
                { icon: Users, text: "15,000+ Students" },
                { icon: BadgeCheck, text: "RBI Registered" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-4 px-4 sm:px-6 border-t border-border bg-background">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
                <GraduationCap className="h-3 w-3 text-background" />
              </div>
              <span className="font-medium text-foreground">EduLoanPro</span>
            </div>
            <div className="flex gap-4">
              <Link to="/student/auth" className="hover:text-foreground transition-colors">Student Login</Link>
              <Link to="/partner/login" className="hover:text-foreground transition-colors">Partner Login</Link>
              <span>support@eduloanpro.com</span>
            </div>
            <span>© {new Date().getFullYear()} EduLoanPro</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default StudentLanding;
