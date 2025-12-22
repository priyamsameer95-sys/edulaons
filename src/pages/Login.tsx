import { useState } from 'react';
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
  Sparkles,
  Globe,
  Clock,
  Users,
  Star,
  ArrowRight,
  Quote
} from 'lucide-react';
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

  const stats = [
    { icon: Users, value: '10,000+', label: 'Students Funded' },
    { icon: Globe, value: '₹2,500Cr+', label: 'Loans Processed' },
    { icon: Clock, value: '48 Hours', label: 'Avg. Approval' },
    { icon: Star, value: '4.8/5', label: 'Student Rating' },
  ];

  return (
    <div className="h-screen bg-background relative overflow-hidden">
      {/* Partner Login - Top Right */}
      <div className="absolute top-4 right-4 z-50 sm:top-6 sm:right-6">
        <Button 
          variant="outline" 
          size="sm" 
          asChild
          className="gap-2 bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm"
        >
          <Link to="/partner">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Partner Login</span>
            <span className="sm:hidden">Partner</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        {/* LEFT SIDE - STUDENT-FOCUSED HERO */}
        <div className="hidden lg:flex flex-col justify-center p-8 xl:p-12 bg-gradient-to-br from-primary via-primary/90 to-[hsl(262,83%,58%)] relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-lg space-y-6 text-white">
            {/* Hero Headline */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Trusted by 10,000+ students</span>
              </div>
              
              <h1 className="text-3xl xl:text-4xl font-brand font-bold tracking-tight leading-tight">
                Your Dream University<br />
                <span className="text-white/90">is Within Reach</span>
              </h1>
              
              <p className="text-lg text-white/80 leading-relaxed">
                Don't let finances hold you back. Get matched with the best education loans in minutes.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10"
                >
                  <stat.icon className="w-4 h-4 mb-1.5 text-white/70" />
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <Quote className="w-6 h-6 text-white/40 mb-2" />
              <p className="text-white/90 italic text-sm leading-relaxed">
                "EduLoanPro helped me secure my MBA dream at London Business School. The process was seamless!"
              </p>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                  PS
                </div>
                <div>
                  <div className="text-sm font-medium">Priya Sharma</div>
                  <div className="text-xs text-white/60">MBA 2024, LBS</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10 bg-background relative overflow-y-auto">
          {/* Mobile Hero - Shown only on small screens */}
          <div className="lg:hidden text-center mb-6 pt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
              <Sparkles className="w-3 h-3" />
              <span>10,000+ students funded</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-brand font-bold text-foreground mb-1">
              Your Dream University is Within Reach
            </h1>
            <p className="text-muted-foreground text-sm">
              Get matched with the best education loans
            </p>
          </div>
          
          <Card className="w-full max-w-md shadow-xl border relative z-10">
            <CardHeader className="text-center space-y-3 pb-4 pt-6 px-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-[hsl(262,83%,58%)] flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-xl font-brand font-bold text-foreground">
                    Welcome, Future Graduate!
                  </h2>
                  <CardDescription className="text-xs">
                    Start your education loan journey today
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 px-6 pb-6">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-10 mb-4">
                  <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4 mt-0">
                  <form onSubmit={handleSignIn} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
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
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-sm flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
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
                        className="h-10"
                      />
                    </div>
                    <LoadingButton 
                      type="submit" 
                      className="w-full h-10 font-medium gap-2" 
                      loading={isLoading}
                      loadingText="Signing in..."
                    >
                      Continue Your Journey
                      <ArrowRight className="w-4 h-4" />
                    </LoadingButton>
                  </form>
                  <p className="text-xs text-center text-muted-foreground">
                    New here? Switch to <span className="font-medium text-primary">Sign Up</span>
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-3 border-t">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Your data is encrypted and secure</span>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-0">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Track applications</span> • Get updates • Secure docs
                    </p>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-name" className="text-sm">Name</Label>
                        <Input
                          id="signup-name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          value={signUpData.name}
                          onChange={handleSignUpInputChange}
                          required
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-phone" className="text-sm">Phone</Label>
                        <Input
                          id="signup-phone"
                          name="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={signUpData.phone}
                          onChange={handleSignUpInputChange}
                          required
                          className="h-9"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-sm flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
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
                        className="h-9"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-sm flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
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
                        className="h-9"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-confirm-password" className="text-sm">Confirm Password</Label>
                      <Input
                        id="signup-confirm-password"
                        name="confirmPassword"
                        type="password"
                        placeholder="Re-enter password"
                        value={signUpData.confirmPassword}
                        onChange={handleSignUpInputChange}
                        required
                        className="h-9"
                      />
                      {signUpData.confirmPassword && (
                        <p className={`text-xs ${signUpData.password === signUpData.confirmPassword ? "text-green-600" : "text-destructive"}`}>
                          {signUpData.password === signUpData.confirmPassword ? "✓ Passwords match" : "Passwords don't match"}
                        </p>
                      )}
                    </div>
                    
                    <LoadingButton 
                      type="submit" 
                      className="w-full h-10 font-medium gap-2" 
                      loading={isLoading}
                      loadingText="Creating account..."
                    >
                      Begin Your Journey
                      <ArrowRight className="w-4 h-4" />
                    </LoadingButton>
                  </form>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Already have an account? Switch to <span className="font-medium text-primary">Sign In</span>
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-3 border-t">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Your data is encrypted and secure</span>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
