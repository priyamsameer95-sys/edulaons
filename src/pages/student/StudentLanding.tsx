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
import { OTPInput } from "@/components/student/OTPInput";
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
  Users,
  CheckCircle2,
  Smartphone,
  RefreshCw
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

// Lender data for carousel (brand colors come from design tokens in index.css)
const LENDERS = [
  { code: "SBI", name: "State Bank of India", shortName: "SBI", brandVar: "--brand-sbi", rate: "8.65%" },
  { code: "PNB", name: "Punjab National Bank", shortName: "PNB", brandVar: "--brand-pnb", rate: "7.50%" },
  { code: "ICICI", name: "ICICI Bank", shortName: "ICICI", brandVar: "--brand-icici", rate: "10.25%" },
  { code: "HDFC", name: "HDFC Credila", shortName: "Credila", brandVar: "--brand-hdfc", rate: "10.00%" },
  { code: "AXIS", name: "Axis Bank", shortName: "Axis", brandVar: "--brand-axis", rate: "9.75%" },
  { code: "BOB", name: "Bank of Baroda", shortName: "BoB", brandVar: "--brand-bob", rate: "8.85%" },
];

// Steps with time anchors
const STEPS = [
  { icon: FileCheck, title: "Check Eligibility", time: "60 sec", desc: "Quick assessment" },
  { icon: Shield, title: "Verify OTP", time: "Instant", desc: "Mobile verify" },
  { icon: Zap, title: "Upload Docs", time: "Upload once", desc: "Simple forms" },
  { icon: Trophy, title: "Get Approved", time: "24-48 hrs", desc: "Fast approval" },
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
  if (lenderCount >= 4) return { headline: "Excellent Match!", subtext: "Multiple top lenders ready for you", icon: Trophy, color: "text-emerald-600" };
  if (lenderCount >= 3) return { headline: "Strong Profile!", subtext: "Great options available", icon: Star, color: "text-primary" };
  if (lenderCount >= 2) return { headline: "Good Options!", subtext: "Lenders ready to help", icon: Rocket, color: "text-primary" };
  if (lenderCount >= 1) return { headline: "Match Found!", subtext: "A lender is interested", icon: Sparkles, color: "text-primary" };
  return { headline: "Let's Explore", subtext: "Complete for more options", icon: Sparkles, color: "text-muted-foreground" };
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

type AuthStep = 'results' | 'otp' | 'verifying' | 'success';

const StudentLanding = () => {
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  
  // Inline OTP verification states
  const [authStep, setAuthStep] = useState<AuthStep>('results');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Auto-verify when 4 digits entered
  useEffect(() => {
    if (otp.length === 4 && authStep === 'otp') {
      verifyOTP();
    }
  }, [otp]);

  // Send OTP when transitioning to OTP step
  const sendOTP = async () => {
    const phone = formData.student_phone.replace(/\D/g, '');
    setOtpError('');
    setOtp('');
    
    try {
      // For now, we'll simulate OTP sending (the verify-student-otp edge function handles this)
      // In production, you'd call a send-otp edge function here
      setOtpSent(true);
      setResendTimer(30);
      toast.success(`OTP sent to +91 ${phone}`);
    } catch (error: any) {
      toast.error('Failed to send OTP');
    }
  };

  const verifyOTP = async () => {
    setAuthStep('verifying');
    setOtpError('');
    
    const phone = formData.student_phone.replace(/\D/g, '');
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-student-otp', {
        body: { phone, otp }
      });

      if (error) throw error;
      
      if (data?.success) {
        setAuthStep('success');
        toast.success('Phone verified successfully!');
        
        // Wait for success animation, then navigate
        setTimeout(() => {
          sessionStorage.setItem('eligibility_form', JSON.stringify({ 
            ...formData, 
            loan_amount: formData.loan_amount[0] * 100000,
            verified: true 
          }));
          navigate('/student');
        }, 1500);
      } else {
        setAuthStep('otp');
        setOtpError(data?.error || 'Invalid OTP');
        setOtp('');
      }
    } catch (error: any) {
      setAuthStep('otp');
      setOtpError('Verification failed. Please try again.');
      setOtp('');
    }
  };

  const handleContinueToOTP = () => {
    setAuthStep('otp');
    sendOTP();
  };

  const handleBackToResults = () => {
    setAuthStep('results');
    setOtp('');
    setOtpError('');
  };

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
      toast.success('Great news! We found matching lenders for you.');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsChecking(false);
    }
  };

  const handleStartOver = () => { 
    setResult(null); 
    setLeadId(null); 
    setAuthStep('results');
    setOtp('');
    setOtpError('');
    setOtpSent(false);
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
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">EduLoanPro</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground">
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
              {/* Trust Badge - Enhanced */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium mb-5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ₹500Cr+ loans funded with India's top RBI-registered lenders
              </div>

              {/* Headline - Emotional & Outcome-Driven */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight mb-3">
                <span className="text-primary">4 Simple Steps</span> to Fund{" "}
                <span className="relative">
                  Your Dream University
                  <svg className="absolute -bottom-1 left-0 w-full h-2 text-primary/30" viewBox="0 0 200 8" preserveAspectRatio="none">
                    <path d="M0 7 Q 50 0, 100 4 T 200 3" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
              </h1>

              {/* Subheadline - Reassurance */}
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2 max-w-md">
                Compare and secure loans from India's top lenders in 60 seconds — with zero credit impact.
              </p>
              
              {/* Emotional micro-copy */}
              <p className="text-sm text-primary/80 font-medium mb-6">
                Don't let finances stop your dreams — get matched with verified lenders in minutes.
              </p>

              {/* How It Works - With Time Anchors & Animations */}
              <div className="mb-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">How it works</p>
                <div className="grid grid-cols-4 gap-2">
                  {STEPS.map((step, i) => (
                    <div 
                      key={i} 
                      className="text-center group cursor-default"
                      onMouseEnter={() => setHoveredStep(i)}
                      onMouseLeave={() => setHoveredStep(null)}
                    >
                      <div className={cn(
                        "w-11 h-11 mx-auto rounded-xl bg-muted flex items-center justify-center mb-1.5 transition-all duration-300 border border-transparent",
                        hoveredStep === i && "bg-primary/10 border-primary/20 scale-110 shadow-lg shadow-primary/10"
                      )}>
                        <step.icon className={cn(
                          "h-5 w-5 transition-colors duration-300",
                          hoveredStep === i ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <p className="text-xs font-medium text-foreground leading-tight">{step.title}</p>
                      <p className={cn(
                        "text-[10px] font-semibold transition-colors mt-0.5",
                        hoveredStep === i ? "text-primary" : "text-emerald-600"
                      )}>{step.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lenders - Auto-scrolling Carousel */}
              <div className="mb-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Our Top Lenders</p>
                <div className="relative overflow-hidden">
                  {/* Gradient fades */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10" />
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10" />
                  
                  {/* Scrolling container */}
                  <div className="flex animate-[scroll_20s_linear_infinite] hover:pause">
                    {[...LENDERS, ...LENDERS].map((lender, idx) => (
                      <div 
                        key={`${lender.code}-${idx}`} 
                        className="flex-shrink-0 flex items-center gap-3 px-4 py-3 mx-2 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm text-primary-foreground"
                          style={{ backgroundColor: `hsl(var(${lender.brandVar}))` }}
                        >
                          {lender.shortName.slice(0, 3)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground whitespace-nowrap">{lender.name}</span>
                          <span className="text-xs text-emerald-600 font-medium">From {lender.rate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 text-center">All lenders are RBI-approved and offer education-focused loans only.</p>
              </div>

              {/* Trust Indicators - Enhanced */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                  <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-foreground font-medium">RBI Approved Lenders</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-foreground font-medium">4.8/5 Rating</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-foreground font-medium">24-48h Approval</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Form with Enhanced Styling */}
          <div ref={formRef} className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 lg:py-0 bg-gradient-to-b from-muted/30 to-muted/10">
            <div className="w-full max-w-md">
              <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xl shadow-primary/5">
                {!result ? (
                  /* Form State */
                  <div className="space-y-4 animate-fade-in">
                    <div className="mb-1">
                      <h2 className="text-xl font-semibold text-foreground">Quick Eligibility Check</h2>
                      <p className="text-sm text-muted-foreground">See matching lenders instantly — takes 60 seconds</p>
                    </div>

                    {/* Name & Phone Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-foreground">Your name</Label>
                        <Input
                          value={formData.student_name}
                          onChange={(e) => handleChange('student_name', e.target.value)}
                          placeholder="Rahul Sharma"
                          className={cn("h-10 text-sm bg-background transition-all focus:ring-2 focus:ring-primary/20", errors.student_name && 'border-destructive')}
                        />
                        {errors.student_name && <p className="text-[10px] text-destructive">{errors.student_name}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-foreground">Phone</Label>
                        <Input
                          value={formData.student_phone}
                          onChange={(e) => handleChange('student_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="9876543210"
                          className={cn("h-10 text-sm bg-background transition-all focus:ring-2 focus:ring-primary/20", errors.student_phone && 'border-destructive')}
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
                              "flex flex-col items-center justify-center py-2 rounded-lg border transition-all duration-200",
                              formData.country === country.code 
                                ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' 
                                : 'border-border bg-background hover:border-primary/50 hover:bg-muted/50'
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
                          <span className="text-sm font-semibold text-primary">{formatAmount(formData.loan_amount[0])}</span>
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
                            className={cn("h-10 pl-6 text-sm bg-background transition-all focus:ring-2 focus:ring-primary/20", errors.co_applicant_monthly_salary && 'border-destructive')}
                          />
                        </div>
                        {salaryInWords && <p className="text-[10px] text-muted-foreground">{salaryInWords}</p>}
                        {errors.co_applicant_monthly_salary && <p className="text-[10px] text-destructive">{errors.co_applicant_monthly_salary}</p>}
                      </div>
                    </div>

                    {/* CTA - Enhanced */}
                    <Button 
                      size="lg" 
                      className="w-full h-12 font-semibold text-base transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20"
                      onClick={handleCheckEligibility}
                      disabled={isChecking}
                    >
                      {isChecking ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Finding Best Lenders...</>
                      ) : (
                        <>Check Eligibility<ArrowRight className="h-4 w-4 ml-2" /></>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span>No credit score impact</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>100% secure</span>
                      </div>
                    </div>
                  </div>
                ) : authStep === 'success' ? (
                  /* Success State - Verified! */
                  <div className="space-y-6 animate-fade-in py-8">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 mb-4">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Phone Verified!</h3>
                      <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  </div>
                ) : authStep === 'otp' || authStep === 'verifying' ? (
                  /* OTP Verification State */
                  <div className="space-y-4 animate-fade-in">
                    {/* Progress Indicator - Step 2 Active */}
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">✓</div>
                        <span>Eligibility</span>
                      </div>
                      <div className="w-8 h-px bg-primary" />
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold animate-pulse">2</div>
                        <span className="font-medium text-foreground">Verify Phone</span>
                      </div>
                      <div className="w-8 h-px bg-border" />
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">3</div>
                        <span>Get Offers</span>
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-1">
                        <Smartphone className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Verify Your Phone</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter the 4-digit OTP sent to
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        +91 {formData.student_phone.slice(0, 5)} {formData.student_phone.slice(5)}
                      </p>
                    </div>

                    {/* OTP Input */}
                    <div className="py-4">
                      <OTPInput
                        length={4}
                        value={otp}
                        onChange={setOtp}
                        disabled={authStep === 'verifying'}
                        hasError={!!otpError}
                        autoFocus
                      />
                      
                      {otpError && (
                        <p className="text-sm text-destructive text-center mt-3 animate-shake">
                          {otpError}
                        </p>
                      )}
                      
                      {authStep === 'verifying' && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Verifying...</span>
                        </div>
                      )}
                    </div>

                    {/* Resend OTP */}
                    <div className="text-center">
                      {resendTimer > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Resend OTP in <span className="font-medium text-foreground">{resendTimer}s</span>
                        </p>
                      ) : (
                        <button
                          onClick={sendOTP}
                          disabled={authStep === 'verifying'}
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Resend OTP
                        </button>
                      )}
                    </div>

                    {/* Back Button */}
                    <button
                      onClick={handleBackToResults}
                      disabled={authStep === 'verifying'}
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      Back to results
                    </button>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-3 pt-2 border-t border-border">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Shield className="h-3 w-3 text-emerald-600" />
                        <span>Secure verification</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3 text-primary" />
                        <span>OTP valid for 10 min</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Result State - authStep === 'results' */
                  <div className="space-y-4 animate-fade-in">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">✓</div>
                        <span>Eligibility</span>
                      </div>
                      <div className="w-8 h-px bg-border" />
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">2</div>
                        <span className="font-medium text-foreground">Verify Phone</span>
                      </div>
                      <div className="w-8 h-px bg-border" />
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">3</div>
                        <span>Get Offers</span>
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <div className={cn("inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-1", tierConfig?.color)}>
                        <TierIcon className="h-7 w-7" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">{tierConfig?.headline}</h3>
                      <p className="text-sm text-muted-foreground">{tierConfig?.subtext}</p>
                    </div>

                    <div className="text-center py-4 border-y border-border bg-gradient-to-b from-primary/5 to-transparent rounded-lg">
                      <div className="text-5xl font-bold text-primary">{result.lenderCount}</div>
                      <div className="text-sm text-muted-foreground font-medium">{result.lenderCount === 1 ? 'Lender' : 'Lenders'} Ready to Help</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                        <p className="text-[10px] text-muted-foreground">Loan Amount</p>
                        <p className="text-sm font-bold text-foreground">{formatAmount(loanAmountLakhs)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                        <p className="text-[10px] text-muted-foreground">Best Rate</p>
                        <p className="text-sm font-bold text-emerald-600">{result.estimatedRateMin}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                        <p className="text-[10px] text-muted-foreground">Est. EMI</p>
                        <p className="text-sm font-bold text-foreground">₹{formatIndianNumber(estimatedEMI)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{formData.student_name}</p>
                        <p className="text-xs text-muted-foreground">+91 {formData.student_phone}</p>
                      </div>
                      {leadId && (
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">
                          <Check className="h-3 w-3" />Saved
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* CTA - Pulsing with glow animation */}
                      <Button 
                        size="lg" 
                        className="w-full h-12 font-semibold text-base transition-all hover:scale-[1.02] animate-cta-pulse shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-primary/90 relative overflow-hidden" 
                        onClick={handleContinueToOTP}
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        Verify Phone & Continue<ArrowRight className="h-4 w-4 ml-2 animate-bounce-x" />
                      </Button>
                      
                      {/* Progress continuity text */}
                      <div className="text-center space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 text-xs font-medium">
                          <Check className="h-3 w-3" />
                          Step 1 of 3 Complete
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Quick OTP verification to unlock your offers →
                        </p>
                      </div>
                      
                      <button 
                        onClick={handleStartOver}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                      >
                        ← Start over
                      </button>
                    </div>

                    {/* Trust badges near CTA */}
                    <div className="flex items-center justify-center gap-3 pt-2 border-t border-border">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Shield className="h-3 w-3 text-emerald-600" />
                        <span>No credit impact</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3 text-primary" />
                        <span>Takes 30 seconds</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us - Enhanced Strip */}
        <section className="py-8 px-4 sm:px-6 bg-muted/30 border-t border-border/50">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center mb-4">Trusted by 15,000+ Students</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: TrendingUp, text: "Compare 4+ Lenders", color: "text-primary" },
                { icon: Shield, text: "No Credit Impact", color: "text-emerald-600" },
                { icon: Clock, text: "24-48h Approval", color: "text-amber-600" },
                { icon: Building2, text: "100% Online", color: "text-blue-600" },
                { icon: Users, text: "15,000+ Students", color: "text-purple-600" },
                { icon: BadgeCheck, text: "RBI Registered", color: "text-emerald-600" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <item.icon className={cn("h-4 w-4 shrink-0", item.color)} />
                  <span className="text-xs font-medium text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-4 px-4 sm:px-6 border-t border-border bg-background">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <GraduationCap className="h-3 w-3 text-primary-foreground" />
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
