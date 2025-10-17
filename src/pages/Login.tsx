import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GraduationCap, Mail, Lock, Shield, Info, CheckCircle2, Zap, FileCheck, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardRouter from '@/components/DashboardRouter';
import { LoadingButton } from '@/components/ui/loading-button';

const Login = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });

  // If user is authenticated, route them to appropriate dashboard
  if (user && !loading) {
    return <DashboardRouter />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignUpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignUpData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(formData.email, formData.password);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    if (signUpData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await signUp(signUpData.email, signUpData.password);
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to verify your account",
      });
    }
    
    setIsLoading(false);
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      {/* LEFT SIDE - COMIC-STYLE BRANDING PANEL */}
      <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-[hsl(217,91%,55%)] to-[hsl(262,83%,58%)] relative overflow-hidden">
        {/* Comic-style halftone pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle,_#000_1px,_transparent_1px)] bg-[size:8px_8px]" />
        </div>
        
        {/* Animated radial bursts */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-20 animate-float text-white/20" style={{ animationDelay: '0s' }}>
          <GraduationCap className="w-16 h-16" />
        </div>
        <div className="absolute top-40 right-32 animate-float text-white/20" style={{ animationDelay: '1.5s' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor">
            <path d="M20 2 L24 16 L38 16 L27 24 L31 38 L20 30 L9 38 L13 24 L2 16 L16 16 Z" />
          </svg>
        </div>
        <div className="absolute bottom-32 left-28 animate-float text-white/20" style={{ animationDelay: '0.7s' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor">
            <rect x="8" y="12" width="32" height="28" rx="2" />
            <path d="M12 12 L24 24 L36 12" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <div className="absolute top-1/2 right-20 animate-twinkle text-yellow-300" style={{ animationDelay: '0.3s' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 2 L18 14 L30 16 L18 18 L16 30 L14 18 L2 16 L14 14 Z" />
          </svg>
        </div>
        <div className="absolute bottom-20 right-40 animate-twinkle text-yellow-300" style={{ animationDelay: '2s' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2 L13 11 L22 12 L13 13 L12 22 L11 13 L2 12 L11 11 Z" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-md space-y-12 text-white">
          {/* Brand with comic speech bubble effect */}
          <div className="space-y-4 animate-bounce-in">
            <div className="relative">
              {/* Comic speech bubble background */}
              <div className="absolute -inset-8 bg-white/20 rounded-3xl blur-2xl" />
              <div className="relative w-24 h-24 rounded-3xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_2px_8px_rgba(255,255,255,0.3)] flex items-center justify-center border-4 border-white/30">
                <GraduationCap className="w-12 h-12 text-[hsl(217,91%,55%)] animate-pulse" />
              </div>
              {/* Comic style decorative stars */}
              <div className="absolute -top-2 -right-2 text-yellow-300 animate-spin-slow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2 L13 11 L22 12 L13 13 L12 22 L11 13 L2 12 L11 11 Z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-6xl font-brand font-black tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] animate-shimmer bg-gradient-to-r from-white via-yellow-100 to-white bg-[length:200%_auto] bg-clip-text">
                EduLoan<span className="text-yellow-200">Pro</span>
              </h1>
              <p className="text-2xl text-white font-bold mt-4 drop-shadow-lg">
                💥 Empowering Your Education Journey
              </p>
            </div>
          </div>

          {/* Comic-style feature cards with stagger animation */}
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/30 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
              <div className="relative flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg border-2 border-white/50 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-white" />
                {/* Comic burst behind icon */}
                <div className="absolute inset-0 -z-10">
                  <svg className="w-20 h-20 -ml-3 -mt-3 text-yellow-300/30" viewBox="0 0 100 100">
                    <path d="M50,10 L55,45 L90,50 L55,55 L50,90 L45,55 L10,50 L45,45 Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-black text-lg mb-1 drop-shadow">Smart Loan Matching</h3>
                <p className="text-white/90 text-sm font-medium">Get matched with the best lenders instantly! 🎯</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/30 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
              <div className="relative flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg border-2 border-white/50">
                <FileCheck className="w-7 h-7 text-white" />
                <div className="absolute inset-0 -z-10">
                  <svg className="w-20 h-20 -ml-3 -mt-3 text-green-300/30" viewBox="0 0 100 100">
                    <path d="M50,10 L55,45 L90,50 L55,55 L50,90 L45,55 L10,50 L45,45 Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-black text-lg mb-1 drop-shadow">Real-time Tracking</h3>
                <p className="text-white/90 text-sm font-medium">Monitor every step of your journey! 📊</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/30 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
              <div className="relative flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center shadow-lg border-2 border-white/50">
                <Shield className="w-7 h-7 text-white" />
                <div className="absolute inset-0 -z-10">
                  <svg className="w-20 h-20 -ml-3 -mt-3 text-blue-300/30" viewBox="0 0 100 100">
                    <path d="M50,10 L55,45 L90,50 L55,55 L50,90 L45,55 L10,50 L45,45 Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-black text-lg mb-1 drop-shadow">Secure & Private</h3>
                <p className="text-white/90 text-sm font-medium">Bank-grade protection for your data! 🔒</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/30 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 animate-slide-in-left" style={{ animationDelay: '0.4s' }}>
              <div className="relative flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center shadow-lg border-2 border-white/50">
                <Zap className="w-7 h-7 text-white" />
                <div className="absolute inset-0 -z-10">
                  <svg className="w-20 h-20 -ml-3 -mt-3 text-purple-300/30" viewBox="0 0 100 100">
                    <path d="M50,10 L55,45 L90,50 L55,55 L50,90 L45,55 L10,50 L45,45 Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-black text-lg mb-1 drop-shadow">Fast Approval</h3>
                <p className="text-white/90 text-sm font-medium">Lightning-speed processing! ⚡</p>
              </div>
            </div>
          </div>

          {/* Comic-style trust badge */}
          <div className="pt-8 border-t-4 border-white/30 animate-slide-in-left" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-400/20 border-2 border-yellow-300/50 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center border-2 border-white shadow-lg">
                <span className="text-2xl">🏆</span>
              </div>
              <p className="text-white font-bold text-base">
                Trusted by <span className="text-yellow-300 text-xl">10,000+</span> students!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background relative overflow-hidden">
        {/* Subtle background pattern for right side */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        <Card className="w-full max-w-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border relative z-10">
        <CardHeader className="text-center space-y-6 pb-8 pt-10 px-8">
          {/* Brand Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(217,91%,55%)] to-[hsl(262,83%,58%)] rounded-2xl blur-xl opacity-40" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(217,91%,55%)] to-[hsl(262,83%,58%)] flex items-center justify-center shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {/* Brand Name */}
            <div className="space-y-1">
              <h1 className="text-3xl font-brand font-bold text-foreground tracking-tight">
                EduLoan<span className="text-[hsl(217,91%,55%)]">Pro</span>
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Your Education Finance Partner
              </p>
            </div>
          </div>
          
          <div className="pt-2">
            <CardDescription className="text-base">
              Empowering students with smart loan solutions
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="signin">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup">
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="mt-6 space-y-5">
              <Alert className="bg-muted/50 border-muted-foreground/20">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Returning students: Sign in to track your loan applications and view status updates
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">We'll never share your email with anyone</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="h-11"
                  />
                </div>
                <LoadingButton 
                  type="submit" 
                  className="w-full h-11 font-medium" 
                  loading={isLoading}
                  loadingText="Signing in..."
                >
                  Sign In
                </LoadingButton>
                <p className="text-xs text-center text-muted-foreground">
                  First time here? Switch to Sign Up to create an account
                </p>
              </form>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                <Shield className="h-4 w-4" />
                <span>Your data is encrypted and secure</span>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="mt-6 space-y-5">
              <Alert className="bg-primary/5 border-primary/20">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <strong>Create your account to:</strong>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>✓ Track all your loan applications in one place</li>
                    <li>✓ Get real-time updates on application status</li>
                    <li>✓ Upload and manage documents securely</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={signUpData.name}
                    onChange={handleSignUpInputChange}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="signup-phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={signUpData.phone}
                    onChange={handleSignUpInputChange}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={signUpData.email}
                    onChange={handleSignUpInputChange}
                    required
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">You'll receive a verification email after signing up</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Create a secure password"
                    value={signUpData.password}
                    onChange={handleSignUpInputChange}
                    required
                    minLength={6}
                    className="h-11"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      <li className={signUpData.password.length >= 6 ? "text-green-600" : ""}>
                        {signUpData.password.length >= 6 ? "✓" : "•"} At least 6 characters
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={signUpData.confirmPassword}
                    onChange={handleSignUpInputChange}
                    required
                    className="h-11"
                  />
                  {signUpData.confirmPassword && signUpData.password !== signUpData.confirmPassword && (
                    <p className="text-xs text-destructive">Passwords don't match</p>
                  )}
                  {signUpData.confirmPassword && signUpData.password === signUpData.confirmPassword && (
                    <p className="text-xs text-green-600">✓ Passwords match</p>
                  )}
                </div>
                <LoadingButton 
                  type="submit" 
                  className="w-full h-11 font-medium mt-6" 
                  loading={isLoading}
                  loadingText="Creating account..."
                >
                  Create Account
                </LoadingButton>
                <p className="text-xs text-center text-muted-foreground">
                  Already have an account? Switch to Sign In
                </p>
              </form>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                <Shield className="h-4 w-4" />
                <span>Your data is encrypted and secure</span>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;