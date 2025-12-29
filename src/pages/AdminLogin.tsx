import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmailAuth } from '@/hooks/useEmailAuth';
import { AuthLoadingScreen, EmailLoginForm, AuthCard } from '@/components/auth';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    user,
    appUser,
    loading,
    isSubmitting,
    formData,
    handleInputChange,
    handleSignIn,
  } = useEmailAuth();

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
    return <AuthLoadingScreen message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <AuthCard
        icon={Shield}
        title="Admin Portal"
        description="Authorized personnel only"
        iconBgGradient="from-slate-800 to-slate-900"
        iconGradient="from-destructive/50 to-orange-500/50"
        glowColor="destructive/25"
      >
        {/* Security Notice */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            This is a restricted area. Unauthorized access attempts are logged and monitored.
          </p>
        </div>

        <EmailLoginForm
          email={formData.email}
          password={formData.password}
          isLoading={isSubmitting}
          onEmailChange={handleInputChange}
          onPasswordChange={handleInputChange}
          onSubmit={handleSignIn}
          emailLabel="Admin Email"
          emailPlaceholder="admin@eduloans.com"
          submitText="Access Admin Panel"
          loadingText="Authenticating..."
          accentColor="slate-900"
          SubmitIcon={Shield}
        />

        <p className="text-xs text-center text-muted-foreground pt-4 border-t border-border">
          Not an admin?{' '}
          <a href="/" className="font-medium text-primary hover:underline">
            Return to home
          </a>
        </p>
      </AuthCard>
    </div>
  );
};

export default AdminLogin;
