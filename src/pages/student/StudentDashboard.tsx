/**
 * Student Dashboard
 * 
 * Per Knowledge Base:
 * - Student can view/edit only whitelisted fields
 * - Student sees "No application yet" state if no lead exists
 * - Real-time visibility & tracking via lead timeline
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { StatusTimeline } from '@/components/shared/StatusTimeline';
import { filterLeadForStudent, getStudentStatusLabel, getStudentDocumentStatusLabel } from '@/utils/rolePermissions';
import { 
  ArrowRight, 
  LogOut, 
  Clock,
  Building2,
  Percent,
  IndianRupee,
  BadgeCheck,
  Phone,
  GraduationCap,
  FileText,
  Sparkles,
  AlertCircle,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentLead {
  id: string;
  case_id: string;
  status: string;
  loan_amount: number;
  study_destination: string;
  intake_month: number | null;
  intake_year: number | null;
  documents_status: string;
  created_at: string;
  partner?: { name: string } | null;
}

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<StudentLead | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [hasLead, setHasLead] = useState(false);

  useEffect(() => {
    async function fetchStudentData() {
      if (!user?.email) return;

      try {
        // Fetch student profile
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id, name, email, phone')
          .eq('email', user.email)
          .maybeSingle();

        if (studentError) throw studentError;

        if (studentData) {
          setProfile(studentData);

          // Fetch student's lead with KB field filtering
          const { data: leadData, error: leadError } = await supabase
            .from('leads_new')
            .select(`
              id, case_id, status, loan_amount, study_destination,
              intake_month, intake_year, documents_status, created_at,
              partner:partners(name)
            `)
            .eq('student_id', studentData.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!leadError && leadData) {
            // KB: Apply field filtering for student view
            const filteredLead = filterLeadForStudent(leadData);
            setLead({
              ...filteredLead,
              partner: leadData.partner,
            } as StudentLead);
            setHasLead(true);
          }
        }
      } catch (err) {
        console.error('Error fetching student data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudentData();
  }, [user?.email]);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await signOut();
      navigate('/');
    }
  };

  const handleContinueApplication = () => {
    navigate('/student/apply');
  };

  const handleStartApplication = () => {
    navigate('/student/apply');
  };

  const loanAmountLakhs = lead ? Math.round(lead.loan_amount / 100000) : 0;
  const rawName = profile?.name?.split(' ')[0] || 'there';
  const studentName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* KB: "No application yet" state */}
        {!hasLead ? (
          <div className="max-w-xl mx-auto text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Welcome, {studentName}!
            </h1>
            <p className="text-muted-foreground mb-8">
              You haven't started an application yet. Begin your education loan journey now.
            </p>
            <Button 
              onClick={handleStartApplication}
              size="lg"
              className="h-12 px-8 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Start Your Application
            </Button>
            
            <div className="mt-8 p-4 bg-muted/50 rounded-xl border">
              <div className="flex items-start gap-3 text-left">
                <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Quick & Easy Process</p>
                  <p className="text-xs text-muted-foreground">
                    Complete your application in under 10 minutes. Get matched with the best lenders.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
            {/* Left Sidebar */}
            <aside className="hidden lg:flex flex-col gap-4">
              {/* Partner Info - KB: Show if referred by partner */}
              {lead?.partner?.name && (
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Referred By</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{lead.partner.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BadgeCheck className="w-3 h-3 text-emerald-500" />
                          <span>Verified Partner</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loan Details - KB: Only visible fields */}
              <Card>
                <CardHeader className="pb-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Your Loan Details</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <IndianRupee className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm text-muted-foreground">Amount</span>
                    </div>
                    <span className="text-base font-bold text-foreground">₹{loanAmountLakhs}L</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm text-muted-foreground">Destination</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{lead.study_destination}</span>
                  </div>
                  {lead.intake_month && lead.intake_year && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-violet-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">Intake</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {new Date(2024, lead.intake_month - 1).toLocaleString('default', { month: 'short' })} {lead.intake_year}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Help */}
              <Card>
                <CardHeader className="pb-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Need Help?</p>
                </CardHeader>
                <CardContent>
                  <a 
                    href="tel:8238452277" 
                    className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Call your RM</p>
                      <p className="text-sm font-semibold text-foreground">8238452277</p>
                    </div>
                  </a>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col gap-5">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {getStudentStatusLabel(lead.status)}
              </div>

              {/* Hero */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight tracking-tight">
                  Welcome back, <span className="text-primary">{studentName}!</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground">
                  Your application ({lead.case_id}) status: {getStudentStatusLabel(lead.status)}.
                </p>
              </div>

              {/* Timeline - KB: Real-time visibility */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Application Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusTimeline 
                    leadId={lead.id} 
                    currentStatus={lead.status} 
                    isStudentView={true}
                  />
                </CardContent>
              </Card>

              {/* Document Status */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Documents
                    </CardTitle>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      lead.documents_status === 'verified' 
                        ? "bg-emerald-100 text-emerald-700"
                        : lead.documents_status === 'rejected'
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {getStudentDocumentStatusLabel(lead.documents_status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {lead.documents_status === 'pending' || lead.documents_status === 'rejected' ? (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          {lead.documents_status === 'rejected' ? 'Documents need resubmission' : 'Documents pending'}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Please upload your required documents to continue
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your documents are {getStudentDocumentStatusLabel(lead.documents_status).toLowerCase()}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* CTA */}
              {(lead.status === 'new' || lead.documents_status !== 'verified') && (
                <Button 
                  onClick={handleContinueApplication}
                  size="lg"
                  className="w-full h-12 font-semibold"
                >
                  Continue Application
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {/* Mobile Stats */}
              <div className="lg:hidden grid grid-cols-2 gap-3">
                <div className="bg-card rounded-xl p-3 border text-center">
                  <IndianRupee className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">₹{loanAmountLakhs}L</p>
                  <p className="text-[10px] text-muted-foreground">Loan Amount</p>
                </div>
                <div className="bg-card rounded-xl p-3 border text-center">
                  <GraduationCap className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">{lead.study_destination}</p>
                  <p className="text-[10px] text-muted-foreground">Destination</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;