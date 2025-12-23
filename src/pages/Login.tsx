import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  GraduationCap, 
  Mail, 
  Lock, 
  Shield, 
  CheckCircle2, 
  Briefcase,
  Zap,
  ArrowRight,
  Quote,
  Star
} from 'lucide-react';
import DashboardRouter from '@/components/DashboardRouter';
import { LoadingButton } from '@/components/ui/loading-button';

const testimonials = [
  {
    quote: "EduLoans by Cashkaro helped me secure my MBA at LBS — the process was seamless!",
    name: "Priya Sharma",
    meta: "MBA 2024, London Business School",
    rating: 5,
    initials: "PS"
  },
  {
    quote: "Got my education loan approved in 48 hours. Amazing support!",
    name: "Arjun Patel",
    meta: "MS, University of Melbourne",
    rating: 5,
    initials: "AP"
  },
  {
    quote: "Best platform for abroad study financing — super easy!",
    name: "Aditi Menon",
    meta: "MBA 2025, ISB",
    rating: 5,
    initials: "AM"
  }
];

const stats = [
  { icon: "🎓", value: '10,000+', label: 'Students Funded' },
  { icon: "💰", value: '₹2,500Cr+', label: 'Loans Processed' },
  { icon: "⚡", value: '48 Hours', label: 'Avg. Approval' },
  { icon: "⭐", value: '4.8/5', label: 'Student Rating' },
];

const Login = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
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

  // Auto-rotate testimonials every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (user && !loading) {
    return <DashboardRouter />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
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

  const currentTestimonial = testimonials[activeTestimonial];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT SIDE - HERO */}
        <div className="hidden lg:flex flex-col justify-center p-8 xl:p-12 bg-gradient-to-b from-[#1D4ED8] to-[#60A5FA] relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-lg space-y-8 text-white">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium border border-white/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Trusted by 10,000+ Students</span>
            </div>
            
            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
                Your Dream University<br />
                <span className="text-white/90">is Within Reach</span>
              </h1>
              
              <p className="text-lg text-white/80 leading-relaxed max-w-md">
                Secure your education loan in minutes — with top lenders, fast approvals, and zero stress.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]"
                >
                  <span className="text-2xl mb-2 block">{stat.icon}</span>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial Carousel */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 relative overflow-hidden">
              <Quote className="w-6 h-6 text-white/30 mb-3" />
              
              <div 
                key={activeTestimonial} 
                className="animate-fade-in"
              >
                <p className="text-white/95 italic leading-relaxed mb-4">
                  "{currentTestimonial.quote}"
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                      {currentTestimonial.initials}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{currentTestimonial.name}</div>
                      <div className="text-xs text-white/60">{currentTestimonial.meta}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3.5 h-3.5 ${i < currentTestimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Carousel Dots */}
              <div className="flex justify-center gap-2 mt-4 pt-3 border-t border-white/10">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === activeTestimonial 
                        ? 'bg-white w-6' 
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-background via-background to-muted/30 relative overflow-y-auto">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/3 to-transparent rounded-full blur-3xl" />
          </div>
          
          {/* Partner Login - Top Right */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="gap-2 text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm shadow-sm border-border/50 hover:border-primary/30 transition-all"
            >
              <Link to="/partner/login">
                <Briefcase className="h-4 w-4" />
                <span>Partner Login</span>
              </Link>
            </Button>
          </div>

          {/* Mobile Hero - Shown only on small screens */}
          <div className="lg:hidden text-center mb-8 pt-14 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary text-xs font-semibold mb-4 border border-primary/20 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Trusted by 10,000+ students</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
              Your Dream University<br />
              <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">is Within Reach</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
              Secure your education loan in minutes — with top lenders and fast approvals.
            </p>
            
            {/* Mobile Stats */}
            <div className="grid grid-cols-2 gap-3 mt-6 max-w-sm mx-auto">
              {stats.slice(0, 2).map((stat, index) => (
                <div 
                  key={index} 
                  className="bg-background/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-border/50 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                >
                  <span className="text-2xl block mb-1">{stat.icon}</span>
                  <div className="text-xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          <Card className="w-full max-w-md shadow-2xl shadow-black/10 border-0 rounded-3xl relative z-10 bg-background ring-1 ring-border/50">
            <CardHeader className="text-center space-y-4 pb-2 pt-8 px-8">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-500 rounded-2xl blur-xl opacity-40 animate-pulse" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center shadow-xl shadow-primary/25">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold text-foreground">
                    Welcome, Future Graduate!
                  </h2>
                  <CardDescription className="text-sm text-muted-foreground">
                    Start your education loan journey today.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-5 px-8 pb-8">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 mb-6 rounded-xl bg-muted p-1.5">
                  <TabsTrigger value="signin" className="text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground transition-all">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground transition-all">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-5 mt-0 animate-fade-in">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <Mail className="h-4 w-4 text-primary" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="student@university.edu"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="h-12 rounded-xl bg-muted/50 border-border focus:bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <Lock className="h-4 w-4 text-primary" />
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
                        className="h-12 rounded-xl bg-muted/50 border-border focus:bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/70"
                      />
                    </div>
                    
                    <div className="pt-3 space-y-3">
                      <LoadingButton 
                        type="submit" 
                        className="w-full h-13 py-3.5 font-semibold text-base gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25" 
                        loading={isLoading}
                        loadingText="Verifying your details..."
                      >
                        Start My Loan Journey
                        <ArrowRight className="w-5 h-5" />
                      </LoadingButton>
                      
                      <p className="text-xs text-center text-muted-foreground">
                        ⚡ Takes under 2 minutes. No credit score impact.
                      </p>
                    </div>
                  </form>
                  
                  <p className="text-sm text-center text-muted-foreground pt-2">
                    New here? <button onClick={() => {}} className="font-semibold text-primary hover:underline underline-offset-2">Switch to Sign Up</button>
                  </p>

                  {/* Trust Indicators */}
                  <div className="flex items-center justify-center gap-8 pt-5 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-foreground/80">Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-sm font-medium text-foreground/80">30s Approval</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-5 mt-0 animate-fade-in">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/50 dark:border-emerald-800/50">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      <span className="font-semibold">Create your free account</span>
                      <br />
                      <span className="text-xs opacity-80">Track applications • Get instant updates • Secure docs</span>
                    </p>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-sm font-semibold text-foreground">Full Name</Label>
                        <Input
                          id="signup-name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          value={signUpData.name}
                          onChange={handleSignUpInputChange}
                          required
                          className="h-11 rounded-xl bg-muted/50 border-border focus:bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone" className="text-sm font-semibold text-foreground">Phone</Label>
                        <Input
                          id="signup-phone"
                          name="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={signUpData.phone}
                          onChange={handleSignUpInputChange}
                          required
                          className="h-11 rounded-xl bg-muted/50 border-border focus:bg-background"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <Mail className="h-4 w-4 text-primary" />
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="student@university.edu"
                        value={signUpData.email}
                        onChange={handleSignUpInputChange}
                        required
                        className="h-11 rounded-xl bg-muted/50 border-border focus:bg-background"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-semibold text-foreground">Password</Label>
                        <Input
                          id="signup-password"
                          name="password"
                          type="password"
                          placeholder="Min. 6 chars"
                          value={signUpData.password}
                          onChange={handleSignUpInputChange}
                          required
                          minLength={6}
                          className="h-11 rounded-xl bg-muted/50 border-border focus:bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password" className="text-sm font-semibold text-foreground">Confirm</Label>
                        <Input
                          id="signup-confirm-password"
                          name="confirmPassword"
                          type="password"
                          placeholder="Re-enter"
                          value={signUpData.confirmPassword}
                          onChange={handleSignUpInputChange}
                          required
                          className="h-11 rounded-xl bg-muted/50 border-border focus:bg-background"
                        />
                      </div>
                    </div>
                    {signUpData.confirmPassword && (
                      <p className={`text-xs ${signUpData.password === signUpData.confirmPassword ? "text-emerald-600" : "text-destructive"}`}>
                        {signUpData.password === signUpData.confirmPassword ? "✓ Passwords match" : "✗ Passwords don't match"}
                      </p>
                    )}
                    
                    <div className="pt-2 space-y-3">
                      <LoadingButton 
                        type="submit" 
                        className="w-full h-13 py-3.5 font-semibold text-base gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25" 
                        loading={isLoading}
                        loadingText="Creating your account..."
                      >
                        Start My Loan Journey
                        <ArrowRight className="w-5 h-5" />
                      </LoadingButton>
                      
                      <p className="text-xs text-center text-muted-foreground">
                        ⚡ Takes under 2 minutes. No credit score impact.
                      </p>
                    </div>
                  </form>
                  
                  <p className="text-sm text-center text-muted-foreground pt-2">
                    Already have an account? <button onClick={() => {}} className="font-semibold text-primary hover:underline underline-offset-2">Switch to Sign In</button>
                  </p>

                  {/* Trust Indicators */}
                  <div className="flex items-center justify-center gap-8 pt-5 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-foreground/80">Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-sm font-medium text-foreground/80">30s Approval</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2025 EduLoans by Cashkaro. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/partner/login" className="hover:text-foreground transition-colors">Partner Login</Link>
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
