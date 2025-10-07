import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GraduationCap, Mail, Lock, User, Phone, Shield, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import DashboardRouter from '@/components/DashboardRouter';

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
    <div className="flex min-h-screen overflow-hidden">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-primary via-accent to-primary-hover p-12 flex-col justify-between">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-green-400 to-cyan-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-display">EduLoan</h1>
              <p className="text-sm text-white/80">Smart Education Financing</p>
            </div>
          </div>

          {/* Main Tagline */}
          <div className="space-y-4 mb-12">
            <h2 className="text-4xl font-bold text-white font-display leading-tight">
              Empowering Education Through Smart Financing
            </h2>
            <p className="text-lg text-white/90">
              Join thousands of students achieving their dreams with transparent, hassle-free education loans
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center gap-2 mb-8">
            <Shield className="h-5 w-5 text-white/80" />
            <p className="text-sm text-white/80">Secure & Trusted by 10,000+ Students</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="relative z-10 grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="bg-gradient-to-br from-emerald-500/90 to-teal-600/90 backdrop-blur-md border border-white/30 rounded-xl p-4 hover:scale-105 transition-all shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-white">10K+</div>
            <div className="text-xs text-white/90">Students Helped</div>
          </div>
          <div className="bg-gradient-to-br from-amber-500/90 to-orange-600/90 backdrop-blur-md border border-white/30 rounded-xl p-4 hover:scale-105 transition-all shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-white">₹500Cr+</div>
            <div className="text-xs text-white/90">Loans Processed</div>
          </div>
          <div className="bg-gradient-to-br from-fuchsia-500/90 to-pink-600/90 backdrop-blur-md border border-white/30 rounded-xl p-4 hover:scale-105 transition-all shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-white">50+</div>
            <div className="text-xs text-white/90">Partner Universities</div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">EduLoan</h1>
              <p className="text-xs text-muted-foreground">Smart Education Financing</p>
            </div>
          </div>

          <Card className="border-card-border shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold font-display bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary data-[state=active]:text-white">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="mt-0">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="Enter your password"
                          className="pl-10"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full shadow-primary hover:shadow-lg transition-all bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent" 
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          name="name"
                          type="text"
                          placeholder="Enter your full name"
                          className="pl-10"
                          value={signUpData.name}
                          onChange={handleSignUpInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          name="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          className="pl-10"
                          value={signUpData.phone}
                          onChange={handleSignUpInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          value={signUpData.email}
                          onChange={handleSignUpInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          name="password"
                          type="password"
                          placeholder="Create a password (min 6 characters)"
                          className="pl-10"
                          value={signUpData.password}
                          onChange={handleSignUpInputChange}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          name="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          className="pl-10"
                          value={signUpData.confirmPassword}
                          onChange={handleSignUpInputChange}
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full shadow-primary hover:shadow-lg transition-all bg-gradient-to-r from-accent to-primary hover:from-accent hover:to-primary-hover" 
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>
                        By signing up, you'll receive an email verification link. Your data is secured and encrypted.
                      </p>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Trust Badge */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" />
              Your information is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;