import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { UniversityCombobox } from "@/components/ui/university-combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OTPInput } from "@/components/student/OTPInput";
import { GraduationCap, ArrowRight, Check, Shield, Star, Zap, User, Loader2, Trophy, Rocket, Sparkles, ChevronLeft, Clock, FileCheck, Smartphone, RefreshCw, FileText, ChevronRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { formatIndianNumber } from "@/utils/currencyFormatter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

// Lender logo imports
import sbiLogo from "@/assets/lenders/sbi-logo.jpg";
import pnbLogo from "@/assets/lenders/pnb-logo.jpg";
import credilaLogo from "@/assets/lenders/credila-logo.jpg";
import avanseLogo from "@/assets/lenders/avanse-logo.jpg";
import boiLogo from "@/assets/lenders/boi-logo.jpg";

// Country data - SINGLE SOURCE OF TRUTH with proper ISO2 codes
// Country data - SINGLE SOURCE OF TRUTH with proper ISO2 codes
const getFlagUrl = (iso2: string): string => `https://flagcdn.com/w40/${iso2.toLowerCase()}.png`;

const COUNTRIES = [
  { code: "US", name: "USA", value: "United States", flag: getFlagUrl("US") },
  { code: "GB", name: "UK", value: "United Kingdom", flag: getFlagUrl("GB") },
  { code: "CA", name: "Canada", value: "Canada", flag: getFlagUrl("CA") },
  { code: "AU", name: "Australia", value: "Australia", flag: getFlagUrl("AU") },
  { code: "DE", name: "Germany", value: "Germany", flag: getFlagUrl("DE") },
  { code: "IE", name: "Ireland", value: "Ireland", flag: getFlagUrl("IE") },
  { code: "NZ", name: "New Zealand", value: "New Zealand", flag: getFlagUrl("NZ") },
  { code: "SG", name: "Singapore", value: "Singapore", flag: getFlagUrl("SG") },
  { code: "HK", name: "Hong Kong", value: "Hong Kong SAR", flag: getFlagUrl("HK") },
  { code: "JP", name: "Japan", value: "Japan", flag: getFlagUrl("JP") },
  { code: "CH", name: "Switzerland", value: "Switzerland", flag: getFlagUrl("CH") },
  { code: "CN", name: "China", value: "China", flag: getFlagUrl("CN") },
  { code: "Other", name: "Other", value: "Other", flag: "" }
];

// Lender logo mapping by code
const LENDER_LOGOS: Record<string, string> = {
  'SBI': sbiLogo,
  'PNB': pnbLogo,
  'CREDILA': credilaLogo,
  'AVANSE': avanseLogo,
  'BOI': boiLogo,
  'ICICI': '', // Fallback to color
};

// Lender color mapping by code (fallback)
const LENDER_COLORS: Record<string, string> = {
  'SBI': '#1a4f9c',
  'PNB': '#c41e3a',
  'ICICI': '#f37021',
  'HDFC': '#004c8f',
  'AXIS': '#97144d',
  'BOB': '#f26522',
  'CREDILA': '#00a0e3',
  'AVANSE': '#00a651',
  'IDFC': '#9c1d26',
  'KOTAK': '#ed1c24',
  'FEDERAL': '#002f6c',
  'CANARA': '#ffd700',
};

const getLenderLogo = (code: string): string | undefined => LENDER_LOGOS[code?.toUpperCase()];

// Steps data
const STEPS = [
  { icon: FileCheck, title: "Check Eligibility", time: "60 sec", number: 1 },
  { icon: Shield, title: "Verify OTP", time: "Instant", number: 2 },
  { icon: Zap, title: "Upload Docs", time: "Upload once", number: 3 },
  { icon: Trophy, title: "Get Approved", time: "24-48 hrs", number: 4 }
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
  return Math.round(principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1));
};

const initialFormData: FormData = {
  student_name: "",
  student_phone: "",
  country: "US",
  university_id: "",
  loan_amount: [35],
  co_applicant_monthly_salary: ""
};

type AuthStep = 'results' | 'otp' | 'verifying' | 'success';

const StudentLanding = () => {
  const navigate = useNavigate();
  const { user, appUser, loading: authLoading } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);


  // Fetch lenders from database
  const { data: lenders = [], isLoading: isLoadingLenders } = useQuery({
    queryKey: ['public-lenders-landing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lenders')
        .select('id, name, code, logo_url, interest_rate_min, is_active, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });



  // Inline OTP verification states
  const [authStep, setAuthStep] = useState<AuthStep>('results');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  // Redirect authenticated users
  useEffect(() => {
    if (!authLoading && user) {
      if (appUser) {
        if (appUser.role === 'student') navigate('/dashboard/student', { replace: true });
        else if (appUser.role === 'partner') navigate('/dashboard', { replace: true });
        else if (appUser.role === 'admin' || appUser.role === 'super_admin') navigate('/dashboard/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authLoading, user, appUser, navigate]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    if (otp.length === 4 && authStep === 'otp') verifyOTP();
  }, [otp]);

  const sendOTP = async () => {
    setOtpError('');
    setOtp('');
    try {
      setOtpSent(true);
      setResendTimer(30);
      toast.success(`OTP sent to +91 ${formData.student_phone}`);
    } catch (error: any) {
      toast.error('Failed to send OTP');
    }
  };

  const verifyOTP = async () => {
    setAuthStep('verifying');
    setOtpError('');
    const normalizedPhone = formData.student_phone.replace(/\D/g, '').slice(-10);
    try {
      const { data, error } = await supabase.functions.invoke('verify-student-otp', {
        body: { phone: normalizedPhone, otp, name: formData.student_name.trim() || undefined }
      });
      if (error) throw error;
      if (data?.success) {
        setAuthStep('success');
        toast.success('Phone verified successfully!');
        const countryData = COUNTRIES.find(c => c.code === formData.country);
        sessionStorage.setItem('eligibility_form', JSON.stringify({
          student_name: formData.student_name,
          student_phone: formData.student_phone.replace(/\D/g, ''),
          country: formData.country,
          country_value: countryData?.value || formData.country,
          university_id: formData.university_id,
          loan_amount: formData.loan_amount[0] * 100000,
          co_applicant_monthly_salary: parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, '')) || 0,
          verified: true,
          timestamp: new Date().toISOString(),
          source: 'student_landing'
        }));
        if (data.auth?.token) {
          const { error: signInError } = await supabase.auth.verifyOtp({ token_hash: data.auth.token, type: 'magiclink' });
          if (signInError && data.auth.actionLink) {
            window.location.href = data.auth.actionLink;
            return;
          }
        }
        const waitForSession = async (maxAttempts = 20) => {
          for (let i = 0; i < maxAttempts; i++) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              navigate('/dashboard/student', { replace: true });
              return true;
            }
            await new Promise(r => setTimeout(r, 250));
          }
          return false;
        };
        setTimeout(async () => {
          const sessionReady = await waitForSession();
          if (!sessionReady) {
            if (data.auth?.actionLink) window.location.href = data.auth.actionLink;
            else navigate('/dashboard/student', { replace: true });
          }
        }, 800);
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

  const handleContinueToOTP = () => { setAuthStep('otp'); sendOTP(); };
  const handleBackToResults = () => { setAuthStep('results'); setOtp(''); setOtpError(''); };

  const formatAmount = (value: number): string => value >= 100 ? "₹1Cr+" : `₹${value}L`;

  const formatCurrencyInput = useCallback((value: string): string => {
    const num = value.replace(/,/g, '').replace(/\D/g, '');
    return num ? parseInt(num).toLocaleString('en-IN') : '';
  }, []);

  const handleChange = useCallback((field: keyof FormData, value: string | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.student_name.trim() || formData.student_name.trim().length < 2) newErrors.student_name = "Enter your name";
    const cleanPhone = formData.student_phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) newErrors.student_phone = "Enter valid 10-digit number";
    if (!formData.country) newErrors.country = "Select destination";
    if (formData.country === 'Other') {
      if (!formData.university_id.trim() || formData.university_id.trim().length < 2) newErrors.university_id = "Enter university name";
    } else {
      if (!formData.university_id) newErrors.university_id = "Select university";
    }
    const salary = parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, ''));
    if (!formData.co_applicant_monthly_salary || isNaN(salary) || salary < 25000) newErrors.co_applicant_monthly_salary = "Min ₹25,000";
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
      const now = new Date();
      const futureDate = new Date(now.setMonth(now.getMonth() + 3));
      const requestPayload = {
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
        eligibility_result: eligibility.lenderCount >= 3 ? 'eligible' : eligibility.lenderCount >= 1 ? 'conditional' : 'unlikely'
      };
      try {
        const { data, error } = await supabase.functions.invoke('create-lead-student', { body: requestPayload });
        if (!error && data?.success && data?.lead?.id) {
          setLeadId(data.lead.id);
          if (data.is_existing && data.lead.is_partner_lead && data.lead.partner_name) {
            toast.success(`Great news! ${data.lead.partner_name} has already started your application.`);
          }
        }
      } catch (e: any) {
        console.error('Lead save exception:', e?.message || e);
      }
      toast.success('Great news! We found matching lenders for you.');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
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


  const getLenderColor = (code: string) => LENDER_COLORS[code?.toUpperCase()] || '#6366f1';

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Header */}
      <header className="bg-white border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">
                  Edu<span className="text-primary">Loans</span>
                </span>
                <span className="text-[10px] text-muted-foreground -mt-1">by Cashkaro</span>
              </div>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/login/partner" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Partner Login
              </Link>
              <Button size="sm" asChild>
                <Link to="/login/student">Student Login</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative py-12 lg:py-20 overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[55%] h-full bg-blue-50/50 rounded-l-[50px] -z-10 hidden lg:block" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:gap-12 items-start justify-between">

            {/* Left Content */}
            <div className="flex-1 max-w-2xl pt-2">
              {/* Headline */}
              <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-[1.15] mb-6 tracking-tight">
                <span className="text-primary">4 Simple Steps</span> to Fund<br />
                Your Dream University
              </h1>

              {/* Subheadline */}
              <p className="text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
                Compare and secure loans from India's top lenders in 60 seconds – with zero credit impact.
              </p>

              {/* Trust Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#1e40af] text-white text-sm font-semibold mb-12 shadow-lg shadow-blue-900/10">
                <span>₹500Cr+ loans funded with India's top RBI-registered lenders</span>
              </div>

              {/* 4 Simple Steps */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-[1px] bg-slate-200 flex-1 mr-4"></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    4 SIMPLE STEPS
                  </p>
                  <div className="h-[1px] bg-slate-200 flex-1 ml-4"></div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {STEPS.map((step) => (
                    <div key={step.number} className="bg-white rounded-2xl p-4 border border-slate-100 text-center shadow-sm hover:shadow-md transition-all duration-300 group">
                      <div className="flex flex-col items-center justify-center gap-3 mb-2">
                        <span className="text-4xl font-black text-slate-100 group-hover:text-primary/10 transition-colors">{step.number}</span>
                        <step.icon className="h-6 w-6 text-primary absolute mt-1" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 leading-tight mb-1">{step.title}</p>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">{step.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
                  OUR TOP LENDERS
                </p>
                {isLoadingLenders ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground text-sm bg-white rounded-xl border border-border/50">
                    Loading lenders...
                  </div>
                ) : (
                  <Carousel
                    opts={{ align: "start", loop: true }}
                    plugins={[
                      Autoplay({
                        delay: 3000,
                        stopOnInteraction: true,
                      }),
                    ]}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-3 md:-ml-4">
                      {lenders.map((lender) => {
                        const logoSrc = getLenderLogo(lender.code);
                        return (
                          <CarouselItem key={lender.id} className="pl-3 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center shadow-sm h-[140px] flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
                              <div className="h-10 flex items-center justify-center mb-2 overflow-hidden">
                                {logoSrc ? (
                                  <img
                                    src={logoSrc}
                                    alt={lender.name}
                                    className="h-full w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-80 group-hover:opacity-100"
                                  />
                                ) : (
                                  <div
                                    className="h-full w-full flex items-center justify-center rounded-lg bg-slate-50"
                                  >
                                    <span className="text-slate-400 text-xs font-bold truncate px-2">{lender.name}</span>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs text-slate-400 font-medium">From</p>
                                <p className="text-lg font-bold text-slate-800 leading-none">
                                  {lender.interest_rate_min ? `${lender.interest_rate_min}%` : '8.5%'}
                                </p>
                              </div>
                            </div>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                    <div className="hidden md:block">
                      <CarouselPrevious className="-left-4 lg:-left-6 h-8 w-8 border-slate-200 bg-white shadow-sm hover:bg-white hover:text-primary hover:border-primary transition-colors" />
                      <CarouselNext className="-right-4 lg:-right-6 h-8 w-8 border-slate-200 bg-white shadow-sm hover:bg-white hover:text-primary hover:border-primary transition-colors" />
                    </div>
                  </Carousel>
                )}

                {/* See All Lenders Button */}
                <div className="text-center mt-8">
                  <Button variant="outline" className="rounded-full px-8 py-6 border-slate-200 text-slate-500 hover:text-primary hover:bg-white hover:border-primary font-semibold text-sm transition-all">
                    See All Lenders
                  </Button>
                </div>
              </div>
            </div>

            {/* Right - Form Card */}
            <div ref={formRef} className="w-full lg:w-[440px] flex-shrink-0 relative z-10">
              <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl shadow-blue-900/5">
                {!result ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900">Quick Eligibility Check</h2>

                    {/* Your name */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Your name</Label>
                      <Input
                        value={formData.student_name}
                        onChange={e => handleChange('student_name', e.target.value)}
                        placeholder="Your name"
                        className={cn("h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg", errors.student_name && 'border-destructive bg-red-50')}
                      />
                      {errors.student_name && <p className="text-xs text-destructive font-medium">{errors.student_name}</p>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Phone</Label>
                      <div className="flex">
                        <div className="flex items-center gap-2 px-3 bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg">
                          <img src="https://flagcdn.com/w40/in.png" alt="India" className="w-5 h-3.5 object-cover rounded-[1px]" />
                          <ChevronRight className="h-3 w-3 text-slate-400 rotate-90" />
                        </div>
                        <Input
                          value={formData.student_phone}
                          onChange={e => handleChange('student_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="Phone number"
                          className={cn("h-12 rounded-l-none bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-r-lg", errors.student_phone && 'border-destructive bg-red-50')}
                        />
                      </div>
                      {errors.student_phone && <p className="text-xs text-destructive font-medium">{errors.student_phone}</p>}
                    </div>

                    {/* Study destination */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-700">Study destination</Label>
                      <div className="flex flex-wrap gap-2">
                        {COUNTRIES.map(country => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              handleChange('country', country.code);
                              handleChange('university_id', '');
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-sm font-medium border transition-all inline-flex items-center gap-2",
                              formData.country === country.code
                                ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            )}
                          >
                            {country.flag ? (
                              <img src={country.flag} alt={country.name} className="w-5 h-3.5 object-cover rounded-[1px]" />
                            ) : (
                              <span className="text-base leading-none">🌍</span>
                            )}
                            <span>{country.name}</span>
                          </button>
                        ))}
                      </div>
                      {errors.country && <p className="text-xs text-destructive font-medium">{errors.country}</p>}
                    </div>

                    {/* University */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">University</Label>
                      {formData.country === 'Other' ? (
                        <Input
                          value={formData.university_id}
                          onChange={e => handleChange('university_id', e.target.value)}
                          placeholder="Enter university name"
                          className={cn("h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg", errors.university_id && 'border-destructive bg-red-50')}
                        />
                      ) : (
                        <div className={cn("h-12 [&>button]:h-12 [&>button]:bg-slate-50 [&>button]:border-slate-200 [&>button]:rounded-lg", errors.university_id && '[&_button]:border-destructive [&_button]:bg-red-50')}>
                          <UniversityCombobox
                            country={COUNTRIES.find(c => c.code === formData.country)?.value || ""}
                            value={formData.university_id}
                            onChange={value => handleChange('university_id', value)}
                            placeholder="University"
                            disabled={!formData.country}
                          />
                        </div>
                      )}
                      {errors.university_id && <p className="text-xs text-destructive font-medium">{errors.university_id}</p>}
                    </div>

                    {/* Loan amount */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-slate-700">Loan amount</Label>
                        <span className="text-lg font-bold text-primary">{formatAmount(formData.loan_amount[0])}</span>
                      </div>
                      <Slider
                        value={formData.loan_amount}
                        onValueChange={val => handleChange('loan_amount', val)}
                        min={5}
                        max={100}
                        step={5}
                        className="cursor-pointer py-1"
                      />
                      <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                        <span>₹5L</span>
                        <span>₹35L</span>
                        <span>₹1Cr</span>
                      </div>
                    </div>



                    {/* Co-applicant salary - NOW A RANGE SELECTOR */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Co-applicant salary</Label>
                      <Select
                        value={formData.co_applicant_monthly_salary}
                        onValueChange={(value) => handleChange('co_applicant_monthly_salary', value)}
                      >
                        <SelectTrigger className={cn("h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg", errors.co_applicant_monthly_salary && 'border-destructive bg-red-50')}>
                          <SelectValue placeholder="Select salary range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30000">₹30k - ₹50k</SelectItem>
                          <SelectItem value="50000">₹50k - ₹1 Lakh</SelectItem>
                          <SelectItem value="100000">₹1 Lakh - ₹1.5 Lakhs</SelectItem>
                          <SelectItem value="150000">₹1.5 Lakhs - ₹2 Lakhs</SelectItem>
                          <SelectItem value="200000">More than ₹2 Lakhs</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.co_applicant_monthly_salary && <p className="text-xs text-destructive font-medium">{errors.co_applicant_monthly_salary}</p>}
                    </div>

                    {/* CTA Button */}
                    <Button
                      size="lg"
                      className="w-full h-14 font-bold text-base mt-2 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                      onClick={handleCheckEligibility}
                      disabled={isChecking}
                    >
                      {isChecking ? (
                        <><Loader2 className="h-5 w-5 animate-spin mr-2" />Checking...</>
                      ) : (
                        <>Check Eligibility <ArrowRight className="h-5 w-5 ml-2" /></>
                      )}
                    </Button>
                  </div>
                ) : authStep === 'success' ? (
                  <div className="space-y-6 py-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4 animate-bounce">
                      <Check className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Phone Verified!</h3>
                    <p className="text-slate-500">Redirecting to your dashboard...</p>
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : authStep === 'otp' || authStep === 'verifying' ? (
                  <div className="space-y-6 pt-4">
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-2">
                        <Smartphone className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Verify Your Phone</h3>
                      <p className="text-sm text-slate-500">Enter the 4-digit OTP sent to</p>
                      <p className="text-lg font-bold text-slate-900">+91 {formData.student_phone}</p>
                    </div>
                    <div className="py-2">
                      <OTPInput length={4} value={otp} onChange={setOtp} disabled={authStep === 'verifying'} hasError={!!otpError} autoFocus />
                      {otpError && <p className="text-sm text-destructive text-center mt-3 font-medium bg-red-50 py-1 px-3 rounded-full inline-block mx-auto">{otpError}</p>}
                      {authStep === 'verifying' && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary font-medium">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Verifying code...</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      {resendTimer > 0 ? (
                        <p className="text-sm text-slate-400">Resend OTP in <span className="font-semibold text-slate-700">{resendTimer}s</span></p>
                      ) : (
                        <button onClick={sendOTP} disabled={authStep === 'verifying'} className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-semibold px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors">
                          <RefreshCw className="h-4 w-4" />Resend OTP
                        </button>
                      )}
                    </div>
                    <button onClick={handleBackToResults} disabled={authStep === 'verifying'} className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 flex items-center justify-center gap-1 transition-colors">
                      <ChevronLeft className="h-3 w-3" />Back to results
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8 pt-4">
                    <div className="text-center space-y-3">
                      <div className={cn("inline-flex items-center justify-center w-20 h-20 rounded-full mb-3 shadow-sm", tierConfig?.color?.replace('text-', 'bg-').replace('600', '100'))}>
                        <TierIcon className={cn("h-10 w-10", tierConfig?.color)} />
                      </div>
                      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{tierConfig?.headline}</h3>
                      <p className="text-base text-slate-500 font-medium">{tierConfig?.subtext}</p>
                    </div>

                    <div className="text-center py-8 border-2 border-dashed border-blue-100 bg-blue-50/30 rounded-2xl">
                      <div className="text-6xl font-black text-[#2563eb] tracking-tighter mb-2">{result.lenderCount}</div>
                      <div className="text-base text-slate-600 font-bold">Lenders Ready to Help</div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 text-center group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">AMOUNT</p>
                        <p className="text-lg font-bold text-slate-900">{formatAmount(loanAmountLakhs)}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 text-center group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">RATE</p>
                        <p className="text-lg font-bold text-emerald-600">{result.estimatedRateMin}%</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 text-center group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">EMI</p>
                        <p className="text-lg font-bold text-slate-900">₹{formatIndianNumber(estimatedEMI)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-slate-900 truncate">{formData.student_name}</p>
                        <p className="text-sm text-slate-500 font-medium">+91 {formData.student_phone}</p>
                      </div>
                    </div>

                    <Button size="lg" className="w-full h-14 font-bold text-base rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all" onClick={handleContinueToOTP}>
                      Verify Phone & Continue <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                    <button onClick={handleStartOver} className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 transition-colors font-medium">
                      ← Start over
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-foreground transition-colors">About Us</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:text-foreground transition-colors">Privacy Policy</button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Privacy Policy</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="prose prose-sm">
                      <p>Your privacy is important to us. This policy outlines how we collect, use, and protect your information.</p>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:text-foreground transition-colors">Terms</button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Terms & Conditions</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="prose prose-sm">
                      <p>Welcome to EduLoans. These terms govern your use of our education loan comparison platform.</p>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
              </a>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border text-center text-sm text-muted-foreground">
            Copyright © {new Date().getFullYear()} EduLoan. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentLanding;