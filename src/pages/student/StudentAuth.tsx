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
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm">
              <GraduationCap className="h-10 w-10" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight">
                Your Education,<br />Our Priority
              </h1>
              <p className="text-lg text-white/80 max-w-md">
                Track your loan application in real-time, upload documents securely, and get instant updates on your journey to studying abroad.
              </p>
            </div>
            
            {/* Features */}
            <div className="space-y-4 pt-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Bank-grade Security</p>
                  <p className="text-sm text-white/70">Your data is encrypted & protected</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Instant Updates</p>
                  <p className="text-sm text-white/70">Real-time status notifications</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Trusted by Thousands</p>
                  <p className="text-sm text-white/70">Join students who got their dream loans</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <header className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <Link to="/partner/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Partner Login →
            </Link>
          </div>
        </header>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="text-center mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            {/* Welcome Text */}
            <div className="text-center mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                {step === 'phone' ? 'Welcome Back' : 'Verify Your Phone'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {step === 'phone' 
                  ? 'Sign in to access your student portal' 
                  : 'Enter the code we sent to your phone'}
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-3 mb-8">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
                step === 'phone' 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                  : 'bg-primary/20 text-primary'
              }`}>
                {step === 'otp' ? <CheckCircle2 className="h-5 w-5" /> : '1'}
              </div>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full bg-primary transition-all duration-500 ease-out ${
                  step === 'otp' ? 'w-full' : 'w-0'
                }`} />
              </div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
                step === 'otp' 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
            </div>

            {/* Form Card */}
            <Card className="shadow-2xl border-0 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 lg:p-8">
                {step === 'phone' ? (
                  <form onSubmit={handleSendOTP} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                        <Smartphone className="h-4 w-4 text-primary" />
                        Phone Number
                      </Label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 font-medium text-base text-muted-foreground">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <Input 
                          id="phone" 
                          type="tel" 
                          placeholder="98765 43210" 
                          value={formatPhoneDisplay(phone)} 
                          onChange={handlePhoneChange} 
                          className="h-14 pl-[4.5rem] text-base font-medium border-2 focus:border-primary transition-colors" 
                          autoFocus 
                          required 
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        We'll send you a verification code via SMS
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Your Name 
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input 
                        id="name" 
                        type="text" 
                        placeholder="Enter your name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="h-12 border-2 focus:border-primary transition-colors" 
                      />
                    </div>

                    <LoadingButton 
                      type="submit" 
                      className="w-full h-14 text-base font-semibold gap-2 shadow-lg shadow-primary/20" 
                      loading={isLoading} 
                      loadingText="Sending OTP..."
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </LoadingButton>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="text-center space-y-3">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
                        <KeyRound className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Enter the 4-digit code sent to
                        </p>
                        <p className="font-semibold text-lg text-foreground mt-1">
                          +91 {formatPhoneDisplay(phone)}
                        </p>
                      </div>
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

                    {/* Resend Timer */}
                    <div className="text-center">
                      {canResend ? (
                        <button 
                          type="button" 
                          onClick={handleResendOTP} 
                          className="text-sm text-primary font-medium hover:underline"
                        >
                          Resend OTP
                        </button>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Resend OTP in <span className="font-semibold text-foreground">{resendTimer}s</span>
                        </p>
                      )}
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        <span className="font-semibold">Testing mode:</span> Use code{' '}
                        <span className="font-mono font-bold">9955</span>
                      </p>
                    </div>

                    <div className="space-y-3">
                      <LoadingButton 
                        type="submit" 
                        className="w-full h-14 text-base font-semibold gap-2 shadow-lg shadow-primary/20" 
                        loading={isLoading} 
                        loadingText="Verifying..." 
                        disabled={otp.length !== 4}
                      >
                        Verify & Sign In
                        <ArrowRight className="h-4 w-4" />
                      </LoadingButton>

                      <button 
                        type="button" 
                        onClick={handleBack} 
                        disabled={isLoading} 
                        className="w-full h-10 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Change phone number
                      </button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Trust Indicators - Mobile only */}
            <div className="flex items-center justify-center gap-6 mt-8 lg:hidden">
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
          </div>
        </div>
      </div>
    </div>
  );
};
export default StudentAuth;