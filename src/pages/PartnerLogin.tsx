import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Mail, 
  Lock, 
  Shield, 
  Briefcase,
  ArrowRight,
  Quote,
  Star,
  TrendingUp,
  Users,
  IndianRupee,
  Headphones
} from 'lucide-react';
import DashboardRouter from '@/components/DashboardRouter';
import { LoadingButton } from '@/components/ui/loading-button';

const partnerTestimonials = [
  {
    quote: "EduLoanPro transformed our consultancy — we've processed ₹50Cr in loans this year!",
    name: "Rajesh Kumar",
    meta: "ABC Education Consultants, Mumbai",
    rating: 5,
    initials: "RK"
  },
  {
    quote: "The partner portal is incredibly intuitive. Our team onboarded in just one day.",
    name: "Sneha Reddy",
    meta: "Global Study Partners, Hyderabad",
    rating: 5,
    initials: "SR"
  },
  {
    quote: "Best commission rates in the industry, and payouts are always on time.",
    name: "Vikram Singh",
    meta: "EduPath Advisors, Delhi",
    rating: 5,
    initials: "VS"
  }
];

const partnerStats = [
  { icon: Users, value: '500+', label: 'Active Partners' },
  { icon: IndianRupee, value: '₹1,000Cr+', label: 'Loans Processed' },
  { icon: TrendingUp, value: '25%', label: 'Avg. Commission' },
  { icon: Headphones, value: '24/7', label: 'Partner Support' },
];

const PartnerLogin = () => {
  const { user, loading, signIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Auto-rotate testimonials every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % partnerTestimonials.length);
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
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
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

  const currentTestimonial = partnerTestimonials[activeTestimonial];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT SIDE - HERO (Teal/Emerald theme for partners) */}
        <div className="hidden lg:flex flex-col justify-center p-8 xl:p-12 bg-gradient-to-b from-teal-600 to-emerald-500 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-lg space-y-8 text-white">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium border border-white/20">
              <TrendingUp className="w-4 h-4 text-emerald-200" />
              <span>Grow Your Business With Us</span>
            </div>
            
            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
                Grow Your Education<br />
                <span className="text-white/90">Lending Business</span>
              </h1>
              
              <p className="text-lg text-white/80 leading-relaxed max-w-md">
                Join 500+ partners earning competitive commissions — with real-time tracking, fast approvals, and dedicated support.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {partnerStats.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]"
                >
                  <stat.icon className="w-6 h-6 mb-2 text-emerald-200" />
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
                {partnerTestimonials.map((_, index) => (
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
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-background via-background to-teal-50/30 dark:to-teal-950/10 relative overflow-y-auto">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-teal-500/3 to-transparent rounded-full blur-3xl" />
          </div>

          {/* Mobile Hero - Shown only on small screens */}
          <div className="lg:hidden text-center mb-8 pt-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-700 dark:text-teal-400 text-xs font-semibold mb-4 border border-teal-500/20 shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Partner Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
              Partner<br />
              <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">Sign In</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
              Access your partner dashboard to manage leads and track commissions.
            </p>
          </div>
          
          <Card className="w-full max-w-md shadow-2xl shadow-black/10 border-0 rounded-3xl relative z-10 bg-background ring-1 ring-border/50">
            <CardHeader className="text-center space-y-4 pb-2 pt-8 px-8">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl blur-xl opacity-40 animate-pulse" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center shadow-xl shadow-teal-500/25">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold text-foreground">
                    Partner Portal
                  </h2>
                  <CardDescription className="text-sm text-muted-foreground">
                    Sign in to access your dashboard
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-5 px-8 pb-8">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Mail className="h-4 w-4 text-teal-600" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="partner@company.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="h-12 rounded-xl bg-muted/50 border-border focus:bg-background focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder:text-muted-foreground/70"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Lock className="h-4 w-4 text-teal-600" />
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
                    className="h-12 rounded-xl bg-muted/50 border-border focus:bg-background focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder:text-muted-foreground/70"
                  />
                </div>
                
                <div className="pt-3 space-y-3">
                  <LoadingButton 
                    type="submit" 
                    className="w-full h-13 py-3.5 font-semibold text-base gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-teal-500/25" 
                    loading={isLoading}
                    loadingText="Signing in..."
                  >
                    Access Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </LoadingButton>
                </div>
              </form>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-8 pt-5 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-teal-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80">Secure Portal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80">Real-time Tracking</span>
                </div>
              </div>
              
              {/* Become a Partner CTA */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Want to become a partner?{' '}
                  <a href="mailto:partners@eduloanpro.com" className="font-semibold text-teal-600 hover:underline underline-offset-2">
                    Contact us
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Student Login Link */}
          <div className="mt-6 text-center relative z-10">
            <p className="text-sm text-muted-foreground">
              Are you a student?{' '}
              <Link to="/student/auth" className="font-semibold text-primary hover:underline underline-offset-2">
                Student Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2025 EduLoanPro. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-foreground transition-colors">Partner Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PartnerLogin;
