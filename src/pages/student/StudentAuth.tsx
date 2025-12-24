import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { LoadingButton } from "@/components/ui/loading-button";
import { OTPInput } from "@/components/student/OTPInput";
import { supabase } from "@/integrations/supabase/client";
import DashboardRouter from "@/components/DashboardRouter";
import { GraduationCap, Phone, ArrowRight, ArrowLeft, CheckCircle2, Shield, Zap, Loader2, Smartphone, KeyRound, Sparkles, PartyPopper } from "lucide-react";
type AuthStep = 'phone' | 'otp' | 'success';
const StudentAuth = () => {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');

  // Resend timer state
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Pre-fill from sessionStorage (from landing page eligibility form)
  useEffect(() => {
    try {
      const savedData = sessionStorage.getItem('eligibility_form');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.phone && !phone) {
          setPhone(parsed.phone.replace(/\D/g, '').slice(-10));
        }
        if (parsed.name && !name) {
          setName(parsed.name);
        }
      }
    } catch (e) {
      console.log('No saved eligibility data');
    }
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'otp') {
      setCanResend(true);
    }
  }, [resendTimer, step]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/student', {
        replace: true
      });
    }
  }, [user, loading, navigate]);
  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (user) {
    return <DashboardRouter />;
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
      const fullPhone = `+91${phone}`;
      const {
        data,
        error
      } = await supabase.functions.invoke('verify-student-otp', {
        body: {
          phone: fullPhone,
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

      // OTP verified successfully - show success screen
      setStep('success');
      console.log('OTP verified, signing in...');
      if (data.auth?.actionLink) {
        const {
          error: signInError
        } = await supabase.auth.verifyOtp({
          token_hash: data.auth.token,
          type: 'magiclink'
        });
        if (signInError) {
          console.error('Sign in error:', signInError);
          window.location.href = data.auth.actionLink;
          return;
        }
      }

      // Wait for success animation then redirect
      setTimeout(() => {
        navigate('/student', {
          replace: true
        });
      }, 2000);
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
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-blue-500/5 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Link to="/partner/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Partner Login →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Student Portal</h1>
            <p className="text-muted-foreground mt-1">
              {step === 'phone' ? 'Sign in with your phone number' : 'Enter verification code'}
            </p>
          </div>

          <Card className="shadow-xl border-0 overflow-hidden">
            {/* Step Indicator */}
            <div className="bg-muted/30 px-6 py-3 flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${step === 'phone' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}>
                {step === 'otp' ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </div>
              <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                <div className={`h-full bg-primary transition-all duration-300 ${step === 'otp' ? 'w-full' : 'w-0'}`} />
              </div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${step === 'otp' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
            </div>

            <CardContent className="p-6">
              {step === 'phone' ? <form onSubmit={handleSendOTP} className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      Phone Number
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground font-medium">
                        <span className="text-lg">🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <Input id="phone" type="tel" placeholder="98765 43210" value={formatPhoneDisplay(phone)} onChange={handlePhoneChange} className="h-14 pl-24 text-lg font-medium tracking-wide" autoFocus required />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We'll send you a verification code via SMS
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      Your Name <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input id="name" type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} className="h-12" />
                  </div>

                  <LoadingButton type="submit" className="w-full h-14 text-base font-semibold gap-2" loading={isLoading} loadingText="Sending OTP...">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </LoadingButton>
                </form> : <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                      <KeyRound className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enter the 4-digit code sent to
                    </p>
                    <p className="font-semibold text-foreground">
                      +91 {formatPhoneDisplay(phone)}
                    </p>
                  </div>

                  <OTPInput value={otp} onChange={val => {
                setOtp(val);
                setOtpError(false);
              }} disabled={isLoading} autoFocus hasError={otpError} />

                  {/* Resend Timer */}
                  <div className="text-center">
                    {canResend ? <button type="button" onClick={handleResendOTP} className="text-sm text-primary font-medium hover:underline">
                        Resend OTP
                      </button> : <p className="text-sm text-muted-foreground">
                        Resend OTP in <span className="font-semibold text-foreground">{resendTimer}s</span>
                      </p>}
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <span className="font-semibold">Testing mode:</span> Use code <span className="font-mono font-bold">9955</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <LoadingButton type="submit" className="w-full h-14 text-base font-semibold gap-2" loading={isLoading} loadingText="Verifying..." disabled={otp.length !== 4}>
                      Verify & Sign In
                      <ArrowRight className="h-4 w-4" />
                    </LoadingButton>

                    <button type="button" onClick={handleBack} disabled={isLoading} className="w-full h-10 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Change phone number
                    </button>
                  </div>
                </form>}

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-6 pt-6 mt-6 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Secure
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Fast
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Trusted
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          
        </div>
      </div>
    </div>;
};
export default StudentAuth;