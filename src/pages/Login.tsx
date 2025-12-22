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
    quote: "EduLoanPro helped me secure my MBA at LBS — the process was seamless!",
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
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10 bg-background relative overflow-y-auto">
          {/* Partner Login - Top Right */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link to="/partner">
                <Briefcase className="h-4 w-4" />
                <span>Partner Login</span>
              </Link>
            </Button>
          </div>

          {/* Mobile Hero - Shown only on small screens */}
          <div className="lg:hidden text-center mb-6 pt-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
              <CheckCircle2 className="w-3 h-3" />
              <span>Trusted by 10,000+ students</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Your Dream University is Within Reach
            </h1>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Secure your education loan in minutes — with top lenders and fast approvals.
            </p>
            
            {/* Mobile Stats */}
            <div className="grid grid-cols-2 gap-2 mt-4 max-w-xs mx-auto">
              {stats.slice(0, 2).map((stat, index) => (
                <div key={index} className="bg-muted/50 rounded-xl p-3 text-center">
                  <span className="text-lg">{stat.icon}</span>
                  <div className="text-lg font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          <Card className="w-full max-w-md shadow-[0_8px_24px_rgba(0,0,0,0.08)] border rounded-2xl relative z-10">
            <CardHeader className="text-center space-y-3 pb-4 pt-6 px-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-foreground">
                    Welcome, Future Graduate!
                  </h2>
                  <CardDescription className="text-sm">
                    Start your education loan journey today.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 px-6 pb-6">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-11 mb-5 rounded-xl">
                  <TabsTrigger value="signin" className="text-sm rounded-lg data-[state=active]:shadow-sm">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm rounded-lg data-[state=active]:shadow-sm">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4 mt-0">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
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
                        className="h-11 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
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
                        className="h-11 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    
                    <div className="pt-2 space-y-3">
                      <LoadingButton 
                        type="submit" 
                        className="w-full h-12 font-semibold text-base gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md" 
                        loading={isLoading}
                        loadingText="Verifying your details..."
                      >
                        Start My Loan Journey
                        <ArrowRight className="w-4 h-4" />
                      </LoadingButton>
                      
                      <p className="text-xs text-center text-muted-foreground">
                        Takes under 2 minutes. No credit score impact.
                      </p>
                    </div>
                  </form>
                  
                  <p className="text-sm text-center text-muted-foreground pt-2">
                    New here? <button onClick={() => {}} className="font-medium text-primary hover:underline">Switch to Sign Up</button>
                  </p>

                  {/* Trust Indicators */}
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      <span>Your data is encrypted and secure</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>Get pre-approved results in under 30 seconds</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-0">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      <span className="font-semibold">Create your free account</span> • Track applications • Get instant updates
                    </p>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                        <Input
                          id="signup-name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          value={signUpData.name}
                          onChange={handleSignUpInputChange}
                          required
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-phone" className="text-sm font-medium">Phone</Label>
                        <Input
                          id="signup-phone"
                          name="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={signUpData.phone}
                          onChange={handleSignUpInputChange}
                          required
                          className="h-10 rounded-xl"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
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
                        className="h-10 rounded-xl"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        Password
                      </Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={signUpData.password}
                        onChange={handleSignUpInputChange}
                        required
                        minLength={6}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-confirm-password" className="text-sm font-medium">Confirm Password</Label>
                      <Input
                        id="signup-confirm-password"
                        name="confirmPassword"
                        type="password"
                        placeholder="Re-enter password"
                        value={signUpData.confirmPassword}
                        onChange={handleSignUpInputChange}
                        required
                        className="h-10 rounded-xl"
                      />
                      {signUpData.confirmPassword && (
                        <p className={`text-xs ${signUpData.password === signUpData.confirmPassword ? "text-emerald-600" : "text-destructive"}`}>
                          {signUpData.password === signUpData.confirmPassword ? "✓ Passwords match" : "Passwords don't match"}
                        </p>
                      )}
                    </div>
                    
                    <div className="pt-2 space-y-3">
                      <LoadingButton 
                        type="submit" 
                        className="w-full h-12 font-semibold text-base gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md" 
                        loading={isLoading}
                        loadingText="Creating your account..."
                      >
                        Start My Loan Journey
                        <ArrowRight className="w-4 h-4" />
                      </LoadingButton>
                      
                      <p className="text-xs text-center text-muted-foreground">
                        Takes under 2 minutes. No credit score impact.
                      </p>
                    </div>
                  </form>
                  
                  <p className="text-sm text-center text-muted-foreground pt-2">
                    Already have an account? <button onClick={() => {}} className="font-medium text-primary hover:underline">Switch to Sign In</button>
                  </p>

                  {/* Trust Indicators */}
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      <span>Your data is encrypted and secure</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>Get pre-approved results in under 30 seconds</span>
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
          <p>© 2025 EduLoanPro. All rights reserved.</p>
          <div className="flex items-center gap-4">
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
