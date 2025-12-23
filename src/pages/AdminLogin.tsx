import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Mail, Lock, AlertTriangle } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, appUser, loading, signIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && appUser && !loading) {
      if (appUser.role === 'admin' || appUser.role === 'super_admin') {
        navigate('/dashboard/admin', { replace: true });
      } else {
        // Non-admin user trying to access admin login
        toast({
          title: "Access Denied",
          description: "This login is for administrators only.",
          variant: "destructive",
        });
        navigate('/', { replace: true });
      }
    }
  }, [user, appUser, loading, navigate, toast]);

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
      setIsLoading(false);
      return;
    }
    
    // Role validation will happen in useEffect after auth state updates
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 rounded-3xl relative z-10 bg-background ring-1 ring-border/50">
        <CardHeader className="text-center space-y-4 pb-2 pt-8 px-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/50 to-orange-500/50 rounded-2xl blur-xl opacity-40" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-bold text-foreground">
                Admin Portal
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Authorized personnel only
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-8 pb-8">
          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This is a restricted area. Unauthorized access attempts are logged and monitored.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Admin Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@eduloans.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
                className="h-12 rounded-xl bg-muted/50 border-border focus:bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2 text-foreground">
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
                autoComplete="current-password"
                className="h-12 rounded-xl bg-muted/50 border-border focus:bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            <div className="pt-3">
              <LoadingButton
                type="submit"
                className="w-full h-12 font-semibold text-base rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 transition-all"
                loading={isLoading}
                loadingText="Authenticating..."
              >
                <Shield className="w-4 h-4 mr-2" />
                Access Admin Panel
              </LoadingButton>
            </div>
          </form>

          <p className="text-xs text-center text-muted-foreground pt-4 border-t border-border">
            Not an admin?{' '}
            <a href="/" className="font-medium text-primary hover:underline">
              Return to home
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
