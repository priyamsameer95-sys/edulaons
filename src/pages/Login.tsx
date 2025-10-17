import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GraduationCap, Mail, Lock, Shield, Info, CheckCircle2 } from 'lucide-react';
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Branded background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <Card className="w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border relative z-10">
        <CardHeader className="text-center space-y-6 pb-8 pt-8">
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
        <CardContent className="space-y-6">
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
  );
};

export default Login;