import { Link } from 'react-router-dom';
import { useEmailAuth } from '@/hooks/useEmailAuth';
import { 
  AuthLoadingScreen, 
  EmailLoginForm, 
  AuthCard, 
  TestimonialCarousel,
  type Testimonial 
} from '@/components/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User,
  Phone,
  Shield, 
  CheckCircle2, 
  Briefcase,
  Zap,
  ArrowRight,
} from 'lucide-react';
import DashboardRouter from '@/components/DashboardRouter';

const testimonials: Testimonial[] = [
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
  const {
    user,
    loading,
    isSubmitting,
    formData,
    signUpData,
    handleInputChange,
    handleSignUpInputChange,
    handleSignIn,
    handleSignUp,
  } = useEmailAuth();

  if (user && !loading) {
    return <DashboardRouter />;
  }

  if (loading) {
    return <AuthLoadingScreen message="Loading..." />;
  }

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
            <TestimonialCarousel testimonials={testimonials} />
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
              <Link to="/login/partner">
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
          
          <AuthCard
            icon={GraduationCap}
            title="Welcome, Future Graduate!"
            description="Start your education loan journey today."
            iconBgGradient="from-[#2563EB] to-[#3B82F6]"
            iconGradient="from-primary to-blue-500"
            glowColor="primary/25"
          >
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
                <EmailLoginForm
                  email={formData.email}
                  password={formData.password}
                  isLoading={isSubmitting}
                  onEmailChange={handleInputChange}
                  onPasswordChange={handleInputChange}
                  onSubmit={handleSignIn}
                  emailPlaceholder="student@university.edu"
                  submitText="Start My Loan Journey"
                  loadingText="Verifying your details..."
                  accentColor="primary"
                />
                
                <p className="text-xs text-center text-muted-foreground">
                  ⚡ Takes under 2 minutes. No credit score impact.
                </p>

                {/* Trust Indicators */}
                <div className="flex items-center justify-center gap-8 pt-5 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground/80">Bank-grade Security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground/80">Instant Decisions</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-5 mt-0 animate-fade-in">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Name
                      </Label>
                      <Input
                        id="signup-name"
                        name="name"
                        type="text"
                        placeholder="Your name"
                        value={signUpData.name}
                        onChange={handleSignUpInputChange}
                        className="h-12 rounded-xl bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone" className="text-sm font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        Phone
                      </Label>
                      <Input
                        id="signup-phone"
                        name="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={signUpData.phone}
                        onChange={handleSignUpInputChange}
                        className="h-12 rounded-xl bg-muted/50"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-semibold flex items-center gap-2">
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
                      className="h-12 rounded-xl bg-muted/50"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-semibold flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        Password
                      </Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={signUpData.password}
                        onChange={handleSignUpInputChange}
                        required
                        className="h-12 rounded-xl bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm" className="text-sm font-semibold flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        Confirm
                      </Label>
                      <Input
                        id="signup-confirm"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={signUpData.confirmPassword}
                        onChange={handleSignUpInputChange}
                        required
                        className="h-12 rounded-xl bg-muted/50"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-3">
                    <LoadingButton 
                      type="submit" 
                      className="w-full h-13 py-3.5 font-semibold text-base gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25" 
                      loading={isSubmitting}
                      loadingText="Creating your account..."
                    >
                      Create My Account
                      <ArrowRight className="w-5 h-5" />
                    </LoadingButton>
                  </div>
                </form>
                
                <p className="text-xs text-center text-muted-foreground">
                  By signing up, you agree to our Terms & Privacy Policy
                </p>
              </TabsContent>
            </Tabs>
          </AuthCard>

          {/* Student OTP Login Link */}
          <div className="mt-6 text-center relative z-10">
            <p className="text-sm text-muted-foreground">
              Prefer OTP login?{' '}
              <Link to="/login/student" className="font-semibold text-primary hover:underline underline-offset-2">
                Sign in with Phone
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2025 EduLoans by Cashkaro. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
