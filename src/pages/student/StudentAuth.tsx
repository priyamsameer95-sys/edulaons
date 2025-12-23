import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { LoadingButton } from "@/components/ui/loading-button";
import DashboardRouter from "@/components/DashboardRouter";
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  Phone,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const StudentAuth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
  });

  if (user && !loading) {
    return <DashboardRouter />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(signInData.email);
      passwordSchema.parse(signInData.password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Validation Error", description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(signInData.email, signInData.password);
    if (error) {
      toast({ title: "Sign in failed", description: error.message || "Invalid email or password", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(signUpData.email);
      passwordSchema.parse(signUpData.password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Validation Error", description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure your passwords match", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signUpData.email, signUpData.password);
    if (error) {
      if (error.message?.includes("already registered")) {
        toast({ title: "Email already registered", description: "Please sign in instead or use a different email", variant: "destructive" });
      } else {
        toast({ title: "Sign up failed", description: error.message || "Could not create account", variant: "destructive" });
      }
    } else {
      toast({ title: "Check your email", description: "We've sent you a confirmation link to verify your account" });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-blue-500/5 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/student/landing" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
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
            <p className="text-muted-foreground mt-1">Manage your education loan application</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="pb-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12">
                  <TabsTrigger value="signin" className="text-sm font-semibold">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm font-semibold">Create Account</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent>
              {activeTab === "signin" ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData(p => ({ ...p, email: e.target.value }))}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={signInData.password}
                      onChange={(e) => setSignInData(p => ({ ...p, password: e.target.value }))}
                      required
                      className="h-12"
                    />
                  </div>

                  <LoadingButton
                    type="submit"
                    className="w-full h-12 text-base font-semibold gap-2"
                    loading={isLoading}
                    loadingText="Signing in..."
                  >
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </LoadingButton>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Full Name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your full name"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData(p => ({ ...p, name: e.target.value }))}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(p => ({ ...p, email: e.target.value }))}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Phone (Optional)
                    </Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={signUpData.phone}
                      onChange={(e) => setSignUpData(p => ({ ...p, phone: e.target.value }))}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(p => ({ ...p, password: e.target.value }))}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm" className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Confirm Password
                    </Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData(p => ({ ...p, confirmPassword: e.target.value }))}
                      required
                      className="h-12"
                    />
                  </div>

                  <LoadingButton
                    type="submit"
                    className="w-full h-12 text-base font-semibold gap-2"
                    loading={isLoading}
                    loadingText="Creating account..."
                  >
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </LoadingButton>
                </form>
              )}

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
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>After signing up, you'll be able to:</p>
            <ul className="mt-2 space-y-1">
              <li>✓ Track your application status</li>
              <li>✓ Upload documents securely</li>
              <li>✓ Get updates in real-time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAuth;
