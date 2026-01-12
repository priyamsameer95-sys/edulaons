import { useState, useEffect, useCallback, Component, ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { LoadingButton } from "@/components/ui/loading-button";
import { OTPInput } from "@/components/student/OTPInput";
import { supabase } from "@/integrations/supabase/client";
import DashboardRouter from "@/components/DashboardRouter";
import { GraduationCap, Phone, ArrowRight, ArrowLeft, CheckCircle2, Shield, Zap, Loader2, Smartphone, KeyRound, Sparkles, PartyPopper, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthStep = 'phone' | 'otp' | 'success';

// Error boundary to catch and recover from HMR/hook crashes
class StudentAuthErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[StudentAuth] Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Please refresh the page to try again.
            </p>
            <Button onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const StudentAuthContent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get returnTo from URL params
  const searchParams = new URLSearchParams(location.search);
  const returnTo = searchParams.get('returnTo') || '/dashboard/student';
  const [step, setStep] = useState<AuthStep>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');

  // Resend timer state
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Check if user just came from eligibility flow with verified OTP
  // If so, session might still be establishing - wait for it
  const [sessionChecking, setSessionChecking] = useState(false);
  
  useEffect(() => {
    // If user already exists, skip session checking entirely
    if (user) return;
    
    const checkEligibilityFlowSession = async () => {
      try {
        const savedData = sessionStorage.getItem('eligibility_form');
        if (!savedData) return;
        
        const parsed = JSON.parse(savedData);
        
        // Pre-fill phone/name if available
        if (parsed.student_phone && !phone) {
          setPhone(parsed.student_phone.toString().replace(/\D/g, '').slice(-10));
        }
        if (parsed.student_name && !name) {
          setName(parsed.student_name);
        }
        
        // Only check for establishing session if verified recently and no user yet
        if (!parsed.verified || loading) return;
        
        const timeSinceVerified = Date.now() - new Date(parsed.timestamp).getTime();
        if (timeSinceVerified >= 30000) return; // Too old, skip
        
        console.log('[StudentAuth] User came from eligibility flow, checking for session...');
        setSessionChecking(true);
        
        try {
          // Wait a moment for session to propagate
          await new Promise(r => setTimeout(r, 1000));
          
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            console.log('[StudentAuth] Session found, redirecting to dashboard');
            navigate('/dashboard/student', { replace: true });
            return;
          }
          
          // Try once more after another delay
          await new Promise(r => setTimeout(r, 1500));
          const { data: retryData } = await supabase.auth.getSession();
          if (retryData.session) {
            console.log('[StudentAuth] Session found on retry, redirecting to dashboard');
            navigate('/dashboard/student', { replace: true });
            return;
          }
          
          console.log('[StudentAuth] No session found, showing login form');
        } finally {
          // ALWAYS reset sessionChecking
          setSessionChecking(false);
        }
      } catch (e) {
        console.log('[StudentAuth] Error checking eligibility data:', e);
        setSessionChecking(false);
      }
    };
    
    checkEligibilityFlowSession();
  }, [user, loading, navigate]);

  // Safety: force reset sessionChecking after 5 seconds if stuck
  useEffect(() => {
    if (!sessionChecking) return;
    
    const safety = setTimeout(() => {
      console.warn('[StudentAuth] sessionChecking safety timeout - forcing reset');
      setSessionChecking(false);
    }, 5000);
    
    return () => clearTimeout(safety);
  }, [sessionChecking]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'otp') {
      setCanResend(true);
    }
  }, [resendTimer, step]);

  // Redirect if already logged in - use navigate instead of rendering DashboardRouter
  useEffect(() => {
    if (user && !loading) {
      // Navigate directly to student dashboard - don't render DashboardRouter here
      const destination = returnTo.startsWith('/dashboard') ? returnTo : '/dashboard/student';
      navigate(destination, { replace: true });
    }
  }, [user, loading, navigate, returnTo]);
  
  if (loading || sessionChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          {sessionChecking && (
            <p className="text-sm text-muted-foreground">Setting up your account...</p>
          )}
        </div>
      </div>
    );
  }
  
  // If user exists but effect hasn't navigated yet, show loading
  if (user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }
  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(value);
  };
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);

    // Simulate OTP send delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setStep('otp');
    setResendTimer(30);
    setCanResend(false);
    setIsLoading(false);
    toast({
      title: "OTP Sent!",
      description: "Use 9955 to verify (testing mode)"
    });
  };
  const handleResendOTP = async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(30);
    toast({
      title: "OTP Resent!",
      description: "Use 9955 to verify (testing mode)"
    });
  };
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) {
      toast({
        title: "Enter complete OTP",
        description: "Please enter all 4 digits",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    setOtpError(false);
    try {
      // Normalize phone - send just 10 digits (edge function handles normalization too)
      const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
      const {
        data,
        error
      } = await supabase.functions.invoke('verify-student-otp', {
        body: {
          phone: normalizedPhone,
          otp,
          name: name.trim() || undefined
        }
      });
      if (error) {
        console.error('OTP verification error:', error);
        setOtpError(true);
        toast({
          title: "Verification failed",
          description: error.message || "Could not verify OTP",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      if (!data?.success) {
        setOtpError(true);
        toast({
          title: "Invalid OTP",
          description: data?.error || "Please check and try again. Use 9955 for testing.",
          variant: "destructive"
        });
        setOtp('');
        setIsLoading(false);
        return;
      }

      // OTP verified successfully - clear foreign session data
      console.log('🧹 Clearing foreign session data on successful login');
      
      // Clear any drafts from other phone numbers
      const currentPhone = phone.replace(/\D/g, '').slice(-10);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('student_application_draft_') && !key.endsWith(currentPhone)) {
          console.log('🧹 Removing draft from different user:', key);
          localStorage.removeItem(key);
        }
      }
      // Remove legacy storage key
      localStorage.removeItem('student_application_draft');
      
      // Clear eligibility form from previous session (will be processed on next load)
      // Keep it if user just came from eligibility check (same session)
      
      // OTP verified successfully - show success screen
      setStep('success');
      console.log('OTP verified, signing in...');
      
      // Establish auth session
      if (data.auth?.token) {
        const { error: signInError } = await supabase.auth.verifyOtp({
          token_hash: data.auth.token,
          type: 'magiclink'
        });
        
        if (signInError) {
          console.error('Sign in error:', signInError);
          // Fallback to action link
          if (data.auth.actionLink) {
            window.location.href = data.auth.actionLink;
            return;
          }
        }
      }

      // CRITICAL: Wait for session to be established before navigating
      // This prevents the dashboard from loading without a valid session
      const waitForSession = async (maxAttempts = 20) => {
        for (let i = 0; i < maxAttempts; i++) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            console.log('✅ Session established, navigating to dashboard');
            const destination = returnTo.startsWith('/dashboard') ? returnTo : '/dashboard/student';
            navigate(destination, { replace: true });
            return true;
          }
          await new Promise(r => setTimeout(r, 250));
        }
        return false;
      };

      // Wait for success animation (1s) then poll for session
      setTimeout(async () => {
        const sessionReady = await waitForSession();
        if (!sessionReady) {
          console.warn('Session not established, using fallback');
          if (data.auth?.actionLink) {
            window.location.href = data.auth.actionLink;
          } else {
            navigate('/dashboard/student', { replace: true });
          }
        }
      }, 1000);
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setOtpError(true);
      toast({
        title: "Something went wrong",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setOtpError(false);
  };

  // Success screen after OTP verification
  if (step === 'success') {
    return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-emerald-500/10 flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6 animate-scale-in">
            <PartyPopper className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Verified!</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Welcome to your student portal
          </p>
          <div className="flex items-center justify-center gap-2 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Redirecting to dashboard...</span>
          </div>
        </div>
      </div>;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-emerald-50/50 dark:from-blue-950/20 dark:via-background dark:to-emerald-950/20 flex flex-col relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2" />
      
      {/* Header */}
      <header className="relative z-10 p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Link to="/login/partner" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Partner Login →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 pb-12">
        <div className="w-full max-w-sm">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25 mb-4">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {step === 'phone' ? 'Student Portal' : 'Verify Your Phone'}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {step === 'phone' ? 'Track your education loan application' : 'Enter the code we sent you'}
            </p>
          </div>

          {/* Form Card */}
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              {step === 'phone' ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      Phone Number
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm text-muted-foreground">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="98765 43210" 
                        value={formatPhoneDisplay(phone)} 
                        onChange={handlePhoneChange} 
                        className="h-12 pl-16 text-sm bg-background" 
                        autoFocus 
                        required 
                      />
                    </div>
                  </div>
                  <LoadingButton 
                    type="submit" 
                    className="w-full h-12 font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md" 
                    loading={isLoading} 
                    loadingText="Sending..."
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </LoadingButton>

                  <p className="text-xs text-center text-muted-foreground">
                    We'll send you a verification code via SMS
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Code sent to <span className="font-medium text-foreground">+91 {formatPhoneDisplay(phone)}</span>
                    </p>
                  </div>

                  <OTPInput 
                    value={otp} 
                    onChange={val => {
                      setOtp(val);
                      setOtpError(false);
                    }} 
                    disabled={isLoading} 
                    autoFocus 
                    hasError={otpError} 
                  />

                  <div className="text-center text-sm">
                    {canResend ? (
                      <button 
                        type="button" 
                        onClick={handleResendOTP} 
                        className="text-primary font-medium hover:underline"
                      >
                        Resend code
                      </button>
                    ) : (
                      <span className="text-muted-foreground">
                        Resend in {resendTimer}s
                      </span>
                    )}
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-center">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Test code: <span className="font-mono font-semibold">9955</span>
                    </p>
                  </div>

                  <LoadingButton 
                    type="submit" 
                    className="w-full h-12 font-semibold bg-gradient-to-r from-primary to-primary/90 shadow-md" 
                    loading={isLoading} 
                    loadingText="Verifying..." 
                    disabled={otp.length !== 4}
                  >
                    Verify & Sign In
                  </LoadingButton>

                  <button 
                    type="button" 
                    onClick={handleBack} 
                    disabled={isLoading} 
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Change number
                  </button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Features below card */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Secure</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Fast</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Trusted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap with error boundary to prevent white screens from HMR crashes
const StudentAuth = () => (
  <StudentAuthErrorBoundary>
    <StudentAuthContent />
  </StudentAuthErrorBoundary>
);

export default StudentAuth;