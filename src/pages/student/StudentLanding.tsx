import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { UniversityCombobox } from "@/components/ui/university-combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OTPInput } from "@/components/student/OTPInput";
import GlobalPublicHeader from "@/components/layouts/GlobalPublicHeader";
import { GraduationCap, ArrowRight, Check, Shield, Star, Zap, User, Loader2, Trophy, Rocket, BadgeCheck, ChevronLeft, Sparkles, Clock, FileCheck, TrendingUp, Building2, Users, CheckCircle2, Smartphone, RefreshCw, FileText } from "lucide-react";
import { formatIndianNumber } from "@/utils/currencyFormatter";
import { useAuth } from "@/hooks/useAuth";

// Country data - synced with universities master
const COUNTRIES = [{
  code: "USA",
  name: "USA",
  flag: "🇺🇸",
  value: "United States"
}, {
  code: "UK",
  name: "UK",
  flag: "🇬🇧",
  value: "United Kingdom"
}, {
  code: "Canada",
  name: "Canada",
  flag: "🇨🇦",
  value: "Canada"
}, {
  code: "Australia",
  name: "Australia",
  flag: "🇦🇺",
  value: "Australia"
}, {
  code: "Germany",
  name: "Germany",
  flag: "🇩🇪",
  value: "Germany"
}, {
  code: "NZ",
  name: "New Zealand",
  flag: "🇳🇿",
  value: "New Zealand"
}, {
  code: "SG",
  name: "Singapore",
  flag: "🇸🇬",
  value: "Singapore"
}, {
  code: "HK",
  name: "Hong Kong",
  flag: "🇭🇰",
  value: "Hong Kong SAR"
}, {
  code: "JP",
  name: "Japan",
  flag: "🇯🇵",
  value: "Japan"
}, {
  code: "CH",
  name: "Switzerland",
  flag: "🇨🇭",
  value: "Switzerland"
}, {
  code: "CN",
  name: "China",
  flag: "🇨🇳",
  value: "China"
}, {
  code: "Other",
  name: "Other",
  flag: "🌍",
  value: "Other"
}];

// Lender data for carousel (brand colors come from design tokens in index.css)
const LENDERS = [{
  code: "SBI",
  name: "State Bank of India",
  shortName: "SBI",
  brandVar: "--brand-sbi",
  rate: "8.65%"
}, {
  code: "PNB",
  name: "Punjab National Bank",
  shortName: "PNB",
  brandVar: "--brand-pnb",
  rate: "7.50%"
}, {
  code: "ICICI",
  name: "ICICI Bank",
  shortName: "ICICI",
  brandVar: "--brand-icici",
  rate: "10.25%"
}, {
  code: "HDFC",
  name: "HDFC Credila",
  shortName: "Credila",
  brandVar: "--brand-hdfc",
  rate: "10.00%"
}, {
  code: "AXIS",
  name: "Axis Bank",
  shortName: "Axis",
  brandVar: "--brand-axis",
  rate: "9.75%"
}, {
  code: "BOB",
  name: "Bank of Baroda",
  shortName: "BoB",
  brandVar: "--brand-bob",
  rate: "8.85%"
}];

// Steps with time anchors
const STEPS = [{
  icon: FileCheck,
  title: "Check Eligibility",
  time: "60 sec",
  desc: "Quick assessment"
}, {
  icon: Shield,
  title: "Verify OTP",
  time: "Instant",
  desc: "Mobile verify"
}, {
  icon: Zap,
  title: "Upload Docs",
  time: "Upload once",
  desc: "Simple forms"
}, {
  icon: Trophy,
  title: "Get Approved",
  time: "24-48 hrs",
  desc: "Fast approval"
}];
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
  if (lenderCount >= 4) return {
    headline: "Excellent Match!",
    subtext: "Multiple top lenders ready for you",
    icon: Trophy,
    color: "text-emerald-600"
  };
  if (lenderCount >= 3) return {
    headline: "Strong Profile!",
    subtext: "Great options available",
    icon: Star,
    color: "text-primary"
  };
  if (lenderCount >= 2) return {
    headline: "Good Options!",
    subtext: "Lenders ready to help",
    icon: Rocket,
    color: "text-primary"
  };
  if (lenderCount >= 1) return {
    headline: "Match Found!",
    subtext: "A lender is interested",
    icon: Sparkles,
    color: "text-primary"
  };
  return {
    headline: "Let's Explore",
    subtext: "Complete for more options",
    icon: Sparkles,
    color: "text-muted-foreground"
  };
};
const calculateEMI = (principal: number, rate: number, years: number = 10): number => {
  const monthlyRate = rate / 12 / 100;
  const months = years * 12;
  return Math.round(principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1));
};
const initialFormData: FormData = {
  student_name: "",
  student_phone: "",
  country: "",
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
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // Inline OTP verification states
  const [authStep, setAuthStep] = useState<AuthStep>('results');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  // Redirect authenticated users to their dashboard - don't wait for appUser
  useEffect(() => {
    if (!authLoading && user) {
      // If we have appUser, use role for precise routing
      if (appUser) {
        if (appUser.role === 'student') {
          navigate('/dashboard/student', { replace: true });
        } else if (appUser.role === 'partner') {
          navigate('/dashboard', { replace: true });
        } else if (appUser.role === 'admin' || appUser.role === 'super_admin') {
          navigate('/dashboard/admin', { replace: true });
        }
      } else {
        // User exists but no appUser yet - redirect to generic dashboard
        // DashboardRouter will handle proper routing when appUser loads
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authLoading, user, appUser, navigate]);

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
    // Normalize phone - send just 10 digits (edge function handles normalization too)
    const normalizedPhone = formData.student_phone.replace(/\D/g, '').slice(-10);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('verify-student-otp', {
        body: {
          phone: normalizedPhone,
          otp,
          name: formData.student_name.trim() || undefined
        }
      });
      if (error) throw error;
      if (data?.success) {
        setAuthStep('success');
        toast.success('Phone verified successfully!');

        // Find country data for proper value mapping
        const countryData = COUNTRIES.find(c => c.code === formData.country);
        
        // Save complete eligibility data for pre-filling application form
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
        console.log('📤 Saved eligibility data to sessionStorage for pre-fill');

        // CRITICAL: Establish the auth session BEFORE navigating
        // This prevents the double OTP verification issue
        if (data.auth?.token) {
          console.log('🔐 Establishing auth session via verifyOtp...');
          const { error: signInError } = await supabase.auth.verifyOtp({
            token_hash: data.auth.token,
            type: 'magiclink'
          });
          
          if (signInError) {
            console.warn('⚠️ verifyOtp failed, using magic link fallback:', signInError.message);
            // Fallback: use the action link directly
            if (data.auth.actionLink) {
              window.location.href = data.auth.actionLink;
              return;
            }
          }
        }
        
        // CRITICAL: Wait for session to be fully established before navigating
        const waitForSession = async (maxAttempts = 20) => {
          for (let i = 0; i < maxAttempts; i++) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              console.log('✅ Session established, navigating to dashboard');
              navigate('/dashboard/student', { replace: true });
              return true;
            }
            await new Promise(r => setTimeout(r, 250));
          }
          return false;
        };

        // Wait for success animation then poll for session
        setTimeout(async () => {
          const sessionReady = await waitForSession();
          if (!sessionReady) {
            console.warn('Session not established after polling');
            if (data.auth?.actionLink) {
              window.location.href = data.auth.actionLink;
            } else {
              navigate('/dashboard/student', { replace: true });
            }
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  }, []);
  const scrollToForm = () => formRef.current?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.student_name.trim() || formData.student_name.trim().length < 2) newErrors.student_name = "Enter your name";
    const cleanPhone = formData.student_phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) newErrors.student_phone = "Enter valid 10-digit number";
    if (!formData.country) newErrors.country = "Select destination";
    // For "Other" country, accept any university name; for others, require selection
    if (formData.country === 'Other') {
      if (!formData.university_id.trim() || formData.university_id.trim().length < 2) newErrors.university_id = "Enter university name";
    } else {
      if (!formData.university_id) newErrors.university_id = "Select university";
    }
    const salary = parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, ''));
    if (!formData.co_applicant_monthly_salary || isNaN(salary) || salary < 25000) newErrors.co_applicant_monthly_salary = "Min ₹25,000 (₹3 LPA)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const calculateEligibility = async (loanAmount: number, salary: number, universityId: string): Promise<EligibilityResult> => {
    let universityScore = 20;
    if (universityId && universityId.length > 10) {
      const {
        data: university
      } = await supabase.from('universities').select('score').eq('id', universityId).single();
      if (university) {
        const uniScore = university.score || 0;
        universityScore = uniScore >= 90 ? 40 : uniScore >= 70 ? 32 : uniScore >= 50 ? 25 : 18;
      }
    }
    const salaryScore = salary >= 100000 ? 35 : salary >= 75000 ? 28 : salary >= 50000 ? 20 : 12;
    const score = Math.min(100, Math.max(0, universityScore + salaryScore + 15));
    let rateMin = 14,
      rateMax = 16,
      loanMin = 0,
      loanMax = 0;
    if (score >= 80) {
      loanMin = loanAmount * 0.9;
      loanMax = loanAmount;
      rateMin = 10.5;
      rateMax = 11.5;
    } else if (score >= 65) {
      loanMin = loanAmount * 0.7;
      loanMax = loanAmount * 0.9;
      rateMin = 11.5;
      rateMax = 12.5;
    } else if (score >= 50) {
      loanMin = loanAmount * 0.5;
      loanMax = loanAmount * 0.7;
      rateMin = 12.5;
      rateMax = 13.5;
    } else if (score >= 40) {
      loanMin = loanAmount * 0.3;
      loanMax = loanAmount * 0.5;
      rateMin = 13.5;
      rateMax = 14.5;
    }
    const {
      count
    } = await supabase.from('lenders').select('*', {
      count: 'exact',
      head: true
    }).eq('is_active', true);
    return {
      score: Math.round(score),
      lenderCount: count || 4,
      estimatedLoanMin: loanMin,
      estimatedLoanMax: loanMax,
      estimatedRateMin: rateMin,
      estimatedRateMax: rateMax
    };
  };
  const handleCheckEligibility = async () => {
    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      return;
    }
    setIsChecking(true);
    
    // Log form data for debugging
    console.log('📋 Form data being submitted:', {
      student_name: formData.student_name,
      student_phone: formData.student_phone,
      country: formData.country,
      university_id: formData.university_id,
      loan_amount: formData.loan_amount[0] * 100000,
      co_applicant_monthly_salary: formData.co_applicant_monthly_salary
    });
    
    try {
      const loanAmount = formData.loan_amount[0] * 100000;
      const salary = parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, ''));
      const studentPhone = formData.student_phone.replace(/\D/g, '');
      const countryData = COUNTRIES.find(c => c.code === formData.country);
      
      console.log('🔍 Calculating eligibility...');
      const eligibility = await calculateEligibility(loanAmount, salary, formData.university_id);
      console.log('✅ Eligibility calculated:', eligibility);
      setResult(eligibility);

      // Save organic lead using student-specific edge function
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
      
      console.log('📤 Sending lead creation request:', requestPayload);
      
      let leadSaveSuccess = false;
      try {
        const { data, error } = await supabase.functions.invoke('create-lead-student', {
          body: requestPayload
        });

        // Handle response with detailed logging
        if (error) {
          console.error('❌ Lead save failed (network error):', error.message, error);
          // Show specific error to user
          toast.error(`Unable to save: ${error.message}`);
        } else if (data?.success && data?.lead?.id) {
          console.log('✅ Lead created/updated successfully:', data.lead.id);
          setLeadId(data.lead.id);
          leadSaveSuccess = true;
          // Show partner info if this is a partner-created lead
          if (data.is_existing && data.lead.is_partner_lead && data.lead.partner_name) {
            toast.success(`Great news! ${data.lead.partner_name} has already started your application.`);
          }
        } else if (data?.success === false) {
          console.error('❌ Lead creation failed:', data?.error || 'Unknown reason', data);
          // Show specific error from server
          if (data?.error) {
            toast.error(`Error: ${data.error}`);
          }
        }
      } catch (e: any) {
        console.error('❌ Lead save exception:', e?.message || e);
        toast.error(`Network error: ${e?.message || 'Please check your connection'}`);
      }
      
      // Only show success if lead was saved OR we at least have eligibility results
      if (leadSaveSuccess || result) {
        toast.success('Great news! We found matching lenders for you.');
      }
    } catch (error: any) {
      console.error('❌ Eligibility check failed:', error);
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
  return <div className="min-h-screen bg-background">
      {/* Global Header with Student/Partner Login */}
      <GlobalPublicHeader />

      {/* Main Content - Single Scroll Design */}
      <main className="pt-16">
        {/* Hero + Form Section */}
        <section className="min-h-[calc(100vh-64px)] flex items-start justify-center pt-6 lg:pt-10">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:gap-10 xl:gap-16 items-start">
          {/* Left - Hero Content */}
          <div className="flex-1 flex flex-col items-center lg:items-start py-4 lg:py-0 lg:max-w-[560px] xl:max-w-[600px] overflow-hidden">
              {/* Headline - Clear & Bold */}
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-foreground leading-[1.15] tracking-tight mb-4 text-center lg:text-left">
                <span className="text-primary">4 Simple Steps</span> to Fund Your Dream University
              </h1>

              {/* Subheadline - Reassurance */}
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-5 max-w-lg text-center lg:text-left">
                Compare and secure loans from India's top lenders in 60 seconds — with zero credit impact.
              </p>
              
              {/* Trust Badge - Gradient Background */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-500/10 border border-primary/20 text-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-foreground font-medium">₹500Cr+ loans funded</span>
                <span className="text-muted-foreground">with India's top RBI-registered lenders</span>
              </div>

              {/* 4 Simple Steps Section */}
              <div className="w-full mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">4 Simple Steps</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STEPS.map((step, i) => (
                    <div 
                      key={i} 
                      className="bg-muted/40 rounded-xl p-4 text-center border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-default"
                      onMouseEnter={() => setHoveredStep(i)} 
                      onMouseLeave={() => setHoveredStep(null)}
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-primary">{i + 1}</span>
                        <step.icon className={cn("h-5 w-5", hoveredStep === i ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{step.title}</p>
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">{step.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Our Top Lenders Section */}
              <div className="w-full">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Our Top Lenders</p>
                <div className="relative overflow-hidden rounded-lg">
                  {/* Gradient fades */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10" />
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10" />
                  
                  {/* Scrolling container */}
                  <div className="flex animate-[scroll_25s_linear_infinite] hover:pause">
                    {[...LENDERS, ...LENDERS].map((lender, idx) => (
                      <div key={`${lender.code}-${idx}`} className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 mx-1.5 bg-card rounded-lg border border-border/50 min-w-[100px]">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm" 
                          style={{ backgroundColor: `hsl(var(${lender.brandVar}))` }}
                        >
                          {lender.shortName.slice(0, 3)}
                        </div>
                        <span className="text-xs font-medium text-foreground whitespace-nowrap">{lender.shortName}</span>
                        <span className="text-[11px] text-emerald-600 font-medium">From {lender.rate}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">All lenders are RBI-approved • See All Lenders</p>
              </div>
          </div>

          {/* Right - Form with Enhanced Styling */}
          <div ref={formRef} className="flex-1 flex items-start justify-center py-4 lg:py-0 lg:max-w-md xl:max-w-lg w-full">
            <div className="w-full max-w-md">
              <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-lg">
                {!result ? (/* Form State */
              <div className="space-y-5 animate-fade-in">
                    <div className="mb-2">
                      <h2 className="text-xl font-bold text-foreground">Quick Eligibility Check</h2>
                      <p className="text-sm text-muted-foreground">See matching lenders instantly — takes 60 seconds</p>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Your name</Label>
                      <Input value={formData.student_name} onChange={e => handleChange('student_name', e.target.value)} placeholder="Name as per Aadhaar" className={cn("h-11 text-sm bg-background transition-all", errors.student_name && 'border-destructive')} />
                      {errors.student_name && <p className="text-xs text-destructive">{errors.student_name}</p>}
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Phone</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-muted border border-r-0 border-border rounded-l-md text-sm text-muted-foreground">
                          +91
                        </div>
                        <Input value={formData.student_phone} onChange={e => handleChange('student_phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" className={cn("h-11 text-sm bg-background rounded-l-none", errors.student_phone && 'border-destructive')} />
                      </div>
                      {errors.student_phone && <p className="text-xs text-destructive">{errors.student_phone}</p>}
                    </div>

                    {/* Country - Pill Buttons */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-foreground">Study destination</Label>
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
                              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                              formData.country === country.code 
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm' 
                                : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50'
                            )}
                          >
                            {country.name}
                          </button>
                        ))}
                      </div>
                      {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
                    </div>

                    {/* University - Show manual input for "Other" country */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">University</Label>
                      {formData.country === 'Other' ? (
                        <Input 
                          value={formData.university_id} 
                          onChange={e => handleChange('university_id', e.target.value)} 
                          placeholder="Enter university name" 
                          className={cn("h-11 text-sm bg-background", errors.university_id && 'border-destructive')} 
                        />
                      ) : (
                        <div className={cn(errors.university_id && '[&_button]:border-destructive')}>
                          <UniversityCombobox country={COUNTRIES.find(c => c.code === formData.country)?.value || ""} value={formData.university_id} onChange={value => handleChange('university_id', value)} placeholder={formData.country ? "Search university..." : "Select country first"} disabled={!formData.country} />
                        </div>
                      )}
                      {errors.university_id && <p className="text-xs text-destructive">{errors.university_id}</p>}
                    </div>

                    {/* Loan Amount - Full Width Slider */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-foreground">Loan amount</Label>
                        <span className="text-lg font-bold text-primary">{formatAmount(formData.loan_amount[0])}</span>
                      </div>
                      <Slider value={formData.loan_amount} onValueChange={val => handleChange('loan_amount', val)} min={5} max={100} step={5} className="cursor-pointer" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>₹5L</span>
                        <span>₹1Cr</span>
                      </div>
                    </div>

                    {/* Co-applicant Salary */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Co-applicant monthly salary</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                        <Input value={formData.co_applicant_monthly_salary} onChange={e => handleChange('co_applicant_monthly_salary', formatCurrencyInput(e.target.value))} placeholder="75,000" className={cn("h-11 pl-7 text-sm bg-background", errors.co_applicant_monthly_salary && 'border-destructive')} />
                        {salaryInWords && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{salaryInWords}</span>}
                      </div>
                      {errors.co_applicant_monthly_salary && <p className="text-xs text-destructive">{errors.co_applicant_monthly_salary}</p>}
                    </div>

                    {/* CTA - Enhanced */}
                    <Button size="lg" className="w-full h-12 font-semibold text-base transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20" onClick={handleCheckEligibility} disabled={isChecking}>
                      {isChecking ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Finding Best Lenders...</> : <>Check Eligibility<ArrowRight className="h-4 w-4 ml-2" /></>}
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
                  </div>) : authStep === 'success' ? (/* Success State - Verified! */
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
                  </div>) : authStep === 'otp' || authStep === 'verifying' ? (/* OTP Verification State */
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
                      <OTPInput length={4} value={otp} onChange={setOtp} disabled={authStep === 'verifying'} hasError={!!otpError} autoFocus />
                      
                      {otpError && <p className="text-sm text-destructive text-center mt-3 animate-shake">
                          {otpError}
                        </p>}
                      
                      {authStep === 'verifying' && <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Verifying...</span>
                        </div>}
                    </div>

                    {/* Resend OTP */}
                    <div className="text-center">
                      {resendTimer > 0 ? <p className="text-sm text-muted-foreground">
                          Resend OTP in <span className="font-medium text-foreground">{resendTimer}s</span>
                        </p> : <button onClick={sendOTP} disabled={authStep === 'verifying'} className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50">
                          <RefreshCw className="h-3.5 w-3.5" />
                          Resend OTP
                        </button>}
                    </div>

                    {/* Back Button */}
                    <button onClick={handleBackToResults} disabled={authStep === 'verifying'} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center justify-center gap-1 disabled:opacity-50">
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
                  </div>) : (/* Result State - authStep === 'results' */
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
                      {leadId && <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">
                          <Check className="h-3 w-3" />Saved
                        </div>}
                    </div>

                    <div className="space-y-2">
                      {/* CTA - Pulsing with glow animation */}
                      <Button size="lg" className="w-full h-12 font-semibold text-base transition-all hover:scale-[1.02] animate-cta-pulse shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-primary/90 relative overflow-hidden" onClick={handleContinueToOTP}>
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
                      
                      <button onClick={handleStartOver} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
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
                  </div>)}
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Why Choose Us - Enhanced Strip */}
        

        {/* Footer */}
        <footer className="py-6 px-4 sm:px-6 border-t border-border bg-muted/30">
          <div className="max-w-6xl mx-auto">
            {/* Footer Links Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">EduLoans</span>
                <span className="text-sm text-muted-foreground">by Cashkaro</span>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Privacy Policy
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                      <div className="prose prose-sm dark:prose-invert">
                        <p>Your privacy is important to us. This policy outlines how we collect, use, and protect your information.</p>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">Terms</button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Terms & Conditions
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                      <div className="prose prose-sm dark:prose-invert">
                        <h3>1. Introduction</h3>
                        <p>Welcome to EduLoans. These Terms and Conditions govern your use of our education loan comparison and application platform. By using our services, you agree to be bound by these terms.</p>
                        
                        <h3>2. Services</h3>
                        <p>EduLoans provides a platform to compare education loan offers from various RBI-registered lenders. We do not directly provide loans but facilitate connections between students and lending partners.</p>
                        
                        <h3>3. Eligibility</h3>
                        <p>To use our services, you must be an Indian citizen, at least 18 years old, and have a valid admission offer from a recognized educational institution abroad.</p>
                        
                        <h3>4. Data Privacy</h3>
                        <p>We collect and process your personal information in accordance with applicable data protection laws. Your data is shared with lending partners only with your consent and for the purpose of loan processing.</p>
                        
                        <h3>5. User Responsibilities</h3>
                        <p>You agree to provide accurate and complete information. Submission of false or misleading information may result in rejection of your application and/or legal action.</p>
                        
                        <h3>6. Loan Terms</h3>
                        <p>Final loan terms including interest rates, amounts, and repayment schedules are determined by the respective lending partners. EduLoans does not guarantee loan approval.</p>
                        
                        <h3>7. Disclaimer</h3>
                        <p>EduLoans is a loan marketplace and does not guarantee the accuracy of information provided by lending partners. All loan decisions are at the sole discretion of the lenders.</p>
                        
                        <h3>8. Contact</h3>
                        <p>For queries, contact us at support@eduloans.cashkaro.com</p>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Social Icons Placeholder */}
              <div className="flex items-center gap-3">
                <a href="#" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                </a>
              </div>
            </div>
            
            {/* Copyright Row */}
            <div className="pt-4 border-t border-border/50 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} EduLoans by Cashkaro. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>;
};
export default StudentLanding;