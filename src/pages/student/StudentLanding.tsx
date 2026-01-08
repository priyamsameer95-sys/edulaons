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
import { formatIndianNumber } from "@/utils/currencyFormatter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

// Lender logo imports
import sbiLogo from "@/assets/lenders/sbi-logo.jpg";
import pnbLogo from "@/assets/lenders/pnb-logo.jpg";
import credilaLogo from "@/assets/lenders/credila-logo.jpg";
import avanseLogo from "@/assets/lenders/avanse-logo.jpg";
import boiLogo from "@/assets/lenders/boi-logo.jpg";

// Country data - synced with universities master
const COUNTRIES = [
  { code: "US", name: "US", value: "United States", flag: "🇺🇸" },
  { code: "UK", name: "UK", value: "United Kingdom", flag: "🇬🇧" },
  { code: "Canada", name: "Canada", value: "Canada", flag: "🇨🇦" },
  { code: "Australia", name: "Australia", value: "Australia", flag: "🇦🇺" },
  { code: "Germany", name: "Germany", value: "Germany", flag: "🇩🇪" },
  { code: "Ireland", name: "Ireland", value: "Ireland", flag: "🇮🇪" },
  { code: "NZ", name: "New Zealand", value: "New Zealand", flag: "🇳🇿" },
  { code: "SG", name: "Singapore", value: "Singapore", flag: "🇸🇬" },
  { code: "HK", name: "Hong Kong", value: "Hong Kong SAR", flag: "🇭🇰" },
  { code: "JP", name: "Japan", value: "Japan", flag: "🇯🇵" },
  { code: "CH", name: "Switzerland", value: "Switzerland", flag: "🇨🇭" },
  { code: "CN", name: "China", value: "China", flag: "🇨🇳" },
  { code: "Other", name: "Other", value: "Other", flag: "🌍" }
];

// Lender logo mapping by code
const LENDER_LOGOS: Record<string, string> = {
  'SBI': sbiLogo,
  'PNB': pnbLogo,
  'CREDILA': credilaLogo,
  'AVANSE': avanseLogo,
  'BOI': boiLogo,
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
  const [lenderScrollPosition, setLenderScrollPosition] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Fetch lenders from database
  const { data: lenders = [] } = useQuery({
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

  // Auto-rotate lenders carousel
  useEffect(() => {
    if (lenders.length <= 4 || isCarouselPaused) return;
    
    const interval = setInterval(() => {
      setLenderScrollPosition(prev => {
        const maxScroll = lenders.length - 4;
        return prev >= maxScroll ? 0 : prev + 1;
      });
    }, 3000); // Rotate every 3 seconds
    
    return () => clearInterval(interval);
  }, [lenders.length, isCarouselPaused]);

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

  const scrollLenders = (direction: 'left' | 'right') => {
    const maxScroll = Math.max(0, lenders.length - 4);
    if (direction === 'left') setLenderScrollPosition(prev => prev === 0 ? maxScroll : prev - 1);
    else setLenderScrollPosition(prev => prev >= maxScroll ? 0 : prev + 1);
  };

  const visibleLenders = lenders.slice(lenderScrollPosition, lenderScrollPosition + 4);
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
      <main className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:gap-16 items-start">
            
            {/* Left Content */}
            <div className="flex-1 max-w-xl">
              {/* Headline */}
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
                <span className="text-primary">4 Simple Steps</span> to Fund<br />
                Your Dream University
              </h1>

              {/* Subheadline */}
              <p className="text-lg text-muted-foreground mb-6">
                Compare and secure loans from India's top lenders in 60 seconds – with zero credit impact.
              </p>

              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium mb-10">
                ₹500Cr+ loans funded with India's top RBI-registered lenders
              </div>

              {/* 4 Simple Steps */}
              <div className="mb-10">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
                  4 Simple Steps
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {STEPS.map((step) => (
                    <div key={step.number} className="bg-white rounded-xl p-4 border border-border/50 text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl font-bold text-primary">{step.number}</span>
                        <step.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-0.5">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Our Top Lenders */}
              <div className="mb-8">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Our Top Lenders
                </p>
                <div 
                  className="flex items-center gap-2"
                  onMouseEnter={() => setIsCarouselPaused(true)}
                  onMouseLeave={() => setIsCarouselPaused(false)}
                >
                  <button 
                    onClick={() => scrollLenders('left')} 
                    className="w-8 h-8 rounded-full border border-border bg-white flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <div className="flex-1 flex gap-3 transition-all duration-500 ease-in-out">
                    {visibleLenders.map((lender) => {
                      const logoSrc = getLenderLogo(lender.code);
                      return (
                        <div key={lender.id} className="flex-1 bg-white rounded-xl p-4 border border-border/50 text-center shadow-sm">
                          <div className="h-12 flex items-center justify-center mb-2 rounded px-2 overflow-hidden bg-white">
                            {logoSrc ? (
                              <img 
                                src={logoSrc} 
                                alt={lender.name} 
                                className="h-10 object-contain max-w-full" 
                              />
                            ) : (
                              <div 
                                className="h-10 w-full flex items-center justify-center rounded"
                                style={{ backgroundColor: getLenderColor(lender.code) }}
                              >
                                <span className="text-white text-xs font-bold truncate">{lender.name}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            From <span className="font-semibold text-foreground">{lender.interest_rate_min || '8.5'}%</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  
                  <button 
                    onClick={() => scrollLenders('right')} 
                    className="w-8 h-8 rounded-full border border-border bg-white flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* See All Lenders Button */}
                <div className="text-center mt-6">
                  <Button variant="outline" className="rounded-full px-6">
                    See All Lenders
                  </Button>
                </div>
              </div>
            </div>

            {/* Right - Form Card */}
            <div ref={formRef} className="w-full lg:w-[420px] flex-shrink-0">
              <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-lg">
                {!result ? (
                  <div className="space-y-5">
                    <h2 className="text-xl font-bold text-foreground">Quick Eligibility Check</h2>

                    {/* Your name */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">Your name</Label>
                      <Input 
                        value={formData.student_name} 
                        onChange={e => handleChange('student_name', e.target.value)} 
                        placeholder="Your name" 
                        className={cn("h-11 bg-background", errors.student_name && 'border-destructive')} 
                      />
                      {errors.student_name && <p className="text-xs text-destructive">{errors.student_name}</p>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">Phone</Label>
                      <div className="flex">
                        <div className="flex items-center gap-1.5 px-3 bg-muted border border-r-0 border-input rounded-l-md">
                          <span className="text-lg">🇮🇳</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground rotate-90" />
                        </div>
                        <Input 
                          value={formData.student_phone} 
                          onChange={e => handleChange('student_phone', e.target.value.replace(/\D/g, '').slice(0, 10))} 
                          placeholder="Phone number" 
                          className={cn("h-11 rounded-l-none bg-background", errors.student_phone && 'border-destructive')} 
                        />
                      </div>
                      {errors.student_phone && <p className="text-xs text-destructive">{errors.student_phone}</p>}
                    </div>

                    {/* Study destination */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Study destination</Label>
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
                              "px-3 py-1.5 rounded-full text-sm font-medium border transition-all inline-flex items-center gap-1.5",
                              formData.country === country.code 
                                ? 'border-primary bg-primary text-primary-foreground' 
                                : 'border-border bg-background text-foreground hover:border-primary/50'
                            )}
                          >
                            <span className="text-base">{country.flag}</span>
                            <span>{country.name}</span>
                          </button>
                        ))}
                      </div>
                      {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
                    </div>

                    {/* University */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">University</Label>
                      {formData.country === 'Other' ? (
                        <Input 
                          value={formData.university_id} 
                          onChange={e => handleChange('university_id', e.target.value)} 
                          placeholder="Enter university name" 
                          className={cn("h-11 bg-background", errors.university_id && 'border-destructive')} 
                        />
                      ) : (
                        <div className={cn(errors.university_id && '[&_button]:border-destructive')}>
                          <UniversityCombobox 
                            country={COUNTRIES.find(c => c.code === formData.country)?.value || ""} 
                            value={formData.university_id} 
                            onChange={value => handleChange('university_id', value)} 
                            placeholder="University" 
                            disabled={!formData.country} 
                          />
                        </div>
                      )}
                      {errors.university_id && <p className="text-xs text-destructive">{errors.university_id}</p>}
                    </div>

                    {/* Loan amount */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-foreground">Loan amount</Label>
                        <span className="text-base font-bold text-foreground">{formatAmount(formData.loan_amount[0])}</span>
                      </div>
                      <Slider 
                        value={formData.loan_amount} 
                        onValueChange={val => handleChange('loan_amount', val)} 
                        min={5} 
                        max={100} 
                        step={5} 
                        className="cursor-pointer" 
                      />
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>₹5L</span>
                        <span className="font-semibold text-foreground">{formatAmount(formData.loan_amount[0])}</span>
                        <span>₹1Cr</span>
                      </div>
                    </div>

                    {/* Co-applicant salary */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">Co-applicant salary</Label>
                      <Input 
                        value={formData.co_applicant_monthly_salary} 
                        onChange={e => handleChange('co_applicant_monthly_salary', formatCurrencyInput(e.target.value))} 
                        placeholder="e.g. ₹ 75,000" 
                        className={cn("h-11 bg-background", errors.co_applicant_monthly_salary && 'border-destructive')} 
                      />
                      {errors.co_applicant_monthly_salary && <p className="text-xs text-destructive">{errors.co_applicant_monthly_salary}</p>}
                    </div>

                    {/* CTA Button */}
                    <Button 
                      size="lg" 
                      className="w-full h-12 font-semibold text-base" 
                      onClick={handleCheckEligibility} 
                      disabled={isChecking}
                    >
                      {isChecking ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Checking...</>
                      ) : (
                        <>Check Eligibility <ArrowRight className="h-4 w-4 ml-2" /></>
                      )}
                    </Button>
                  </div>
                ) : authStep === 'success' ? (
                  <div className="space-y-6 py-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
                      <Check className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Phone Verified!</h3>
                    <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
                    <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                  </div>
                ) : authStep === 'otp' || authStep === 'verifying' ? (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-1">
                        <Smartphone className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Verify Your Phone</h3>
                      <p className="text-sm text-muted-foreground">Enter the 4-digit OTP sent to</p>
                      <p className="text-base font-semibold text-foreground">+91 {formData.student_phone}</p>
                    </div>
                    <div className="py-4">
                      <OTPInput length={4} value={otp} onChange={setOtp} disabled={authStep === 'verifying'} hasError={!!otpError} autoFocus />
                      {otpError && <p className="text-sm text-destructive text-center mt-3">{otpError}</p>}
                      {authStep === 'verifying' && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Verifying...</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      {resendTimer > 0 ? (
                        <p className="text-sm text-muted-foreground">Resend OTP in <span className="font-medium text-foreground">{resendTimer}s</span></p>
                      ) : (
                        <button onClick={sendOTP} disabled={authStep === 'verifying'} className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium">
                          <RefreshCw className="h-3.5 w-3.5" />Resend OTP
                        </button>
                      )}
                    </div>
                    <button onClick={handleBackToResults} disabled={authStep === 'verifying'} className="w-full text-xs text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1">
                      <ChevronLeft className="h-3 w-3" />Back to results
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                    <Button size="lg" className="w-full h-12 font-semibold text-base" onClick={handleContinueToOTP}>
                      Verify Phone & Continue <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <button onClick={handleStartOver} className="w-full text-xs text-muted-foreground hover:text-foreground py-1">
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
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
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