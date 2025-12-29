/**
 * Student Dashboard - B2C Optimized
 * 
 * Per Knowledge Base:
 * - Student can view/edit only whitelisted fields
 * - Student sees "No application yet" state if no lead exists
 * - Real-time visibility & tracking via lead timeline
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { filterLeadForStudent, getStudentStatusLabel } from '@/utils/rolePermissions';
import { STUDENT_EDIT_LOCKED_STATUSES } from '@/constants/studentPermissions';
import StudentDocumentChecklist from '@/components/student/StudentDocumentChecklist';
import ChangeLenderModal from '@/components/student/ChangeLenderModal';
import ReferralSection from '@/components/student/ReferralSection';
import StatusProgressBar from '@/components/student/StatusProgressBar';
import { 
  ArrowRight, 
  LogOut, 
  Clock,
  Building2,
  IndianRupee,
  BadgeCheck,
  Phone,
  GraduationCap,
  Sparkles,
  Pencil,
  RefreshCw,
  Shield,
  Users,
  Star,
  ChevronRight,
  Lock,
  Globe,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

// Minimal 3-step journey for B2C clarity
const SIMPLE_STEPS = [
  { id: 1, title: 'Tell us about you', time: '2 min', icon: Users },
  { id: 2, title: 'Compare offers', time: '1 min', icon: Building2 },
  { id: 3, title: 'Upload & verify', time: '5 min', icon: FileCheck },
];

// Trust strip items (horizontal layout)
const TRUST_STRIP = [
  { icon: Lock, text: '256-bit Encrypted' },
  { icon: Building2, text: '10+ RBI Partners' },
  { icon: Star, text: '4.8★ Rating' },
  { icon: Users, text: '10K+ Students' },
];

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
  target_lender_id: string | null;
  partner?: { name: string } | null;
  target_lender?: { id: string; name: string } | null;
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
  const [showChangeLender, setShowChangeLender] = useState(false);
  const [pendingDocsCount, setPendingDocsCount] = useState(0);

  const isEditLocked = lead ? STUDENT_EDIT_LOCKED_STATUSES.includes(lead.status as any) : true;

  const fetchStudentData = useCallback(async () => {
    if (!user?.email) return;

    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, name, email, phone')
        .eq('email', user.email)
        .maybeSingle();

      if (studentError) throw studentError;

      if (studentData) {
        setProfile(studentData);

        const { data: leadData, error: leadError } = await supabase
          .from('leads_new')
          .select(`
            id, case_id, status, loan_amount, study_destination,
            intake_month, intake_year, documents_status, created_at,
            target_lender_id,
            partner:partners(name),
            target_lender:lenders!leads_new_target_lender_id_fkey(id, name)
          `)
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!leadError && leadData) {
          const filteredLead = filterLeadForStudent(leadData);
          setLead({
            ...filteredLead,
            target_lender_id: leadData.target_lender_id,
            partner: leadData.partner,
            target_lender: leadData.target_lender,
          } as StudentLead);
          setHasLead(true);

          // Get pending documents count
          const { count } = await supabase
            .from('lead_documents')
            .select('*', { count: 'exact', head: true })
            .eq('lead_id', leadData.id)
            .in('verification_status', ['pending', 'rejected']);
          
          setPendingDocsCount(count || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

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

  const eligibilityData = typeof window !== 'undefined' 
    ? JSON.parse(sessionStorage.getItem('eligibilityData') || 'null') 
    : null;

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Eduloans</span>
            </div>
            
            <div className="flex items-center gap-3">
              {profile && hasLead && lead && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[9px] font-bold text-primary-foreground">
                      {getInitials(profile.name)}
                    </span>
                  </div>
                  <span className="text-xs font-medium">{studentName}</span>
                  <span className="text-muted-foreground text-xs">•</span>
                  <span className="text-xs text-muted-foreground">{lead.case_id}</span>
                </div>
              )}
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
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
        {!hasLead ? (
          /* ================== NO APPLICATION STATE - B2C HERO ================== */
          <motion.div 
            className="max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Hero Section - Single Focus */}
            <div className="text-center mb-8">
              <motion.div 
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <Globe className="w-10 h-10 text-primary" />
              </motion.div>
              
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
                Your Dream Abroad<br />
                <span className="text-primary">Starts Here</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8">
                Get loan offers in 5 minutes
              </p>

              <Button 
                onClick={handleStartApplication}
                size="lg"
                className="h-14 px-10 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Application
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>

              <p className="text-sm text-muted-foreground mt-4">
                3 Steps • No Commitment • Compare 10+ Lenders
              </p>
            </div>

            {/* Pre-approval Summary (if eligibility exists) */}
            {eligibilityData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="mb-6 border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <BadgeCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">Pre-approved up to ₹{Math.round((eligibilityData.loanAmount || 2500000) / 100000)}L</p>
                        <p className="text-sm text-muted-foreground">
                          {eligibilityData.destination || 'USA'} • {eligibilityData.intake || 'Sep 2025'} Intake
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 3 Simple Steps */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="mb-6">
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-muted-foreground mb-4 text-center">3 Simple Steps</p>
                  <div className="flex items-center justify-between">
                    {SIMPLE_STEPS.map((step, index) => (
                      <div key={step.id} className="flex flex-col items-center text-center flex-1">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <step.icon className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xs font-medium text-foreground">{step.title}</p>
                        <p className="text-[10px] text-muted-foreground">{step.time}</p>
                        {index < SIMPLE_STEPS.length - 1 && (
                          <div className="absolute hidden" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Trust Strip - Horizontal */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4 flex-wrap text-xs text-muted-foreground"
            >
              {TRUST_STRIP.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          /* ================== HAS APPLICATION STATE ================== */
          <motion.div 
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Primary Status Card */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 border-b border-border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
                        {lead.case_id}
                      </Badge>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                      {getStudentStatusLabel(lead.status)}
                    </h1>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">₹{loanAmountLakhs}L</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Globe className="w-3 h-3" />
                      {lead.study_destination}
                    </p>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <StatusProgressBar currentStatus={lead.status} />
              </div>

              {/* Lender Info */}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {lead.target_lender?.name || 'Lender not selected'}
                      </p>
                      <p className="text-xs text-muted-foreground">Selected Lender</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowChangeLender(true)}
                    className="h-8 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1.5" />
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pending Documents - Primary Action */}
            {(lead.documents_status !== 'verified' || pendingDocsCount > 0) && (
              <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Documents Pending</p>
                        <p className="text-sm text-muted-foreground">
                          {pendingDocsCount > 0 ? `${pendingDocsCount} documents need attention` : 'Upload required documents'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleContinueApplication}
                      size="sm"
                      className="h-9"
                    >
                      Upload Now
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document Checklist */}
            <StudentDocumentChecklist leadId={lead.id} />

            {/* Quick Stats - Mobile */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 text-center">
                <IndianRupee className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">₹{loanAmountLakhs}L</p>
                <p className="text-[10px] text-muted-foreground">Amount</p>
              </Card>
              <Card className="p-3 text-center">
                <Globe className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{lead.study_destination}</p>
                <p className="text-[10px] text-muted-foreground">Destination</p>
              </Card>
              <Card className="p-3 text-center">
                <Clock className="w-5 h-5 text-violet-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">
                  {lead.intake_month && lead.intake_year 
                    ? `${new Date(2024, lead.intake_month - 1).toLocaleString('default', { month: 'short' })} '${String(lead.intake_year).slice(-2)}`
                    : 'TBD'
                  }
                </p>
                <p className="text-[10px] text-muted-foreground">Intake</p>
              </Card>
            </div>

            {/* Partner Reference */}
            {lead.partner?.name && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Referred by</p>
                      <p className="font-medium text-foreground flex items-center gap-1.5">
                        {lead.partner.name}
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isEditLocked && (
                <Button 
                  variant="outline"
                  onClick={handleContinueApplication}
                  className="flex-1 h-11"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Application
                </Button>
              )}
              {(lead.status === 'new' || lead.documents_status !== 'verified') && (
                <Button 
                  onClick={handleContinueApplication}
                  className="flex-1 h-11 font-semibold"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Help Contact */}
            <Card>
              <CardContent className="p-4">
                <a 
                  href="tel:8238452277" 
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Need help? Call us</p>
                    <p className="font-semibold text-foreground">8238452277</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </a>
              </CardContent>
            </Card>

            {/* Referral */}
            <ReferralSection studentId={profile?.id} studentPhone={profile?.phone} />
          </motion.div>
        )}
      </main>

      {/* Change Lender Modal */}
      {lead && (
        <ChangeLenderModal
          open={showChangeLender}
          onOpenChange={setShowChangeLender}
          leadId={lead.id}
          currentLenderId={lead.target_lender_id}
          onLenderChanged={fetchStudentData}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
