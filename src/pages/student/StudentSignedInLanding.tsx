/**
 * Student Signed-In Landing Page
 * 
 * Shows after authentication - provides clear CTAs to start/resume application
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  GraduationCap, 
  ArrowRight, 
  LogOut, 
  Clock, 
  CheckCircle2,
  Sparkles,
  FileText,
  Users,
  Shield,
  Zap,
  Gift,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExistingLead {
  id: string;
  case_id: string;
  status: string;
  documents_status: string;
  created_at: string;
}

interface EligibilityData {
  student_name?: string;
  loan_amount?: number;
  country?: string;
  verified?: boolean;
}

const StudentSignedInLanding = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [existingLead, setExistingLead] = useState<ExistingLead | null>(null);
  const [eligibilityData, setEligibilityData] = useState<EligibilityData | null>(null);
  const [studentName, setStudentName] = useState<string>('');

  useEffect(() => {
    async function checkExistingApplication() {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        // Check for eligibility data from landing page
        const savedData = sessionStorage.getItem('eligibility_form');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setEligibilityData(parsed);
          if (parsed.student_name) {
            setStudentName(parsed.student_name.split(' ')[0]);
          }
        }

        // Fetch student profile and existing lead
        const { data: studentData } = await supabase
          .from('students')
          .select('id, name')
          .eq('email', user.email)
          .maybeSingle();

        if (studentData) {
          if (studentData.name && !studentName) {
            setStudentName(studentData.name.split(' ')[0]);
          }

          // Check for existing lead
          const { data: leadData } = await supabase
            .from('leads_new')
            .select('id, case_id, status, documents_status, created_at')
            .eq('student_id', studentData.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (leadData) {
            setExistingLead(leadData);
          }
        }
      } catch (err) {
        console.error('Error checking application:', err);
      } finally {
        setLoading(false);
      }
    }

    checkExistingApplication();
  }, [user?.email]);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await signOut();
      navigate('/');
    }
  };

  const handleStartApplication = () => {
    navigate('/student/apply');
  };

  const handleResume = () => {
    if (existingLead) {
      navigate('/dashboard/student');
    } else {
      navigate('/student/apply');
    }
  };

  const displayName = studentName.charAt(0).toUpperCase() + studentName.slice(1).toLowerCase() || 'there';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-emerald-500/5">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Eduloans by Cashkaro</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground h-8 text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        {/* Welcome Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Welcome, <span className="text-primary">{displayName}!</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {existingLead 
              ? "Continue your education loan application or start a new one."
              : "You're just a few steps away from your education loan. Let's get started!"}
          </p>
        </div>

        {/* Eligibility Summary (if from landing page) */}
        {eligibilityData?.verified && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Your Eligibility Check</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {eligibilityData.country && (
                  <div>
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="font-medium text-foreground">{eligibilityData.country}</p>
                  </div>
                )}
                {eligibilityData.loan_amount && (
                  <div>
                    <p className="text-xs text-muted-foreground">Loan Amount</p>
                    <p className="font-medium text-foreground">₹{(eligibilityData.loan_amount / 100000).toFixed(1)}L</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Application Card */}
        {existingLead && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Existing Application</p>
                    <p className="text-sm text-muted-foreground">Case ID: {existingLead.case_id}</p>
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-full",
                  existingLead.status === 'new' 
                    ? "bg-blue-100 text-blue-700"
                    : "bg-emerald-100 text-emerald-700"
                )}>
                  {existingLead.status === 'new' ? 'In Progress' : existingLead.status}
                </span>
              </div>
              <Button 
                onClick={() => navigate('/dashboard/student')}
                variant="outline"
                className="w-full mt-4"
              >
                View Application
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main CTA */}
        <div className="text-center mb-10">
          <Button 
            onClick={handleStartApplication}
            size="lg"
            className="h-14 px-10 text-lg font-semibold shadow-lg shadow-primary/25"
          >
            {existingLead ? 'Start New Application' : 'Start Your Application'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Takes less than 10 minutes
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Card className="border-border/50">
            <CardContent className="p-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Quick Process</h3>
              <p className="text-sm text-muted-foreground">Complete in under 10 minutes</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Secure</h3>
              <p className="text-sm text-muted-foreground">Bank-grade encryption</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Multiple Lenders</h3>
              <p className="text-sm text-muted-foreground">Compare the best rates</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Teaser */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-0.5">Refer a Friend</h3>
              <p className="text-sm text-muted-foreground">Earn rewards when your friends apply for education loans</p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentSignedInLanding;
