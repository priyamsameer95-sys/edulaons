/**
 * Student Dashboard - Redesigned for Document Upload Focus
 * 
 * Core UX Principle: At any moment, user must understand:
 * 1) Where they are
 * 2) What is blocking them
 * 3) What single action moves them forward
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { filterLeadForStudent } from '@/utils/rolePermissions';
import { STUDENT_EDIT_LOCKED_STATUSES } from '@/constants/studentPermissions';
import StudentDocumentChecklist from '@/components/student/StudentDocumentChecklist';
import ChangeLenderModal from '@/components/student/ChangeLenderModal';
import ActionRequiredBanner from '@/components/student/ActionRequiredBanner';
import ApplicationStepper, { getStepFromStatus } from '@/components/student/ApplicationStepper';
import LenderStatusCard from '@/components/student/LenderStatusCard';
import StickyUploadCTA from '@/components/student/StickyUploadCTA';
import SupportSection from '@/components/student/SupportSection';
import { 
  LogOut, 
  GraduationCap,
  Sparkles,
  ChevronRight,
  Globe,
  Pencil
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  lender_id: string | null;
  partner?: { name: string } | null;
  target_lender?: { id: string; name: string; code?: string } | null;
}

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface DocStats {
  pending: number;
  uploaded: number;
  total: number;
  rejected: number;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<StudentLead | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [hasLead, setHasLead] = useState(false);
  const [showChangeLender, setShowChangeLender] = useState(false);
  const [docStats, setDocStats] = useState<DocStats>({ pending: 0, uploaded: 0, total: 0, rejected: 0 });

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
            target_lender_id, lender_id,
            partner:partners(name),
            target_lender:lenders!leads_new_target_lender_id_fkey(id, name, code)
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
            lender_id: leadData.lender_id,
            partner: leadData.partner,
            target_lender: leadData.target_lender,
          } as StudentLead);
          setHasLead(true);
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

  const handleUploadDocuments = () => {
    navigate('/student/apply');
  };

  const handleStartApplication = () => {
    navigate('/student/apply');
  };

  const rawName = profile?.name?.split(' ')[0] || 'there';
  const studentName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';
  };

  // Determine banner variant based on document status
  const getBannerVariant = () => {
    if (docStats.rejected > 0) return 'action_needed';
    if (lead?.documents_status === 'verified') return 'approved';
    if (docStats.pending === 0 && docStats.uploaded > 0) return 'under_review';
    return 'documents_required';
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-10 pb-32">
        {!hasLead ? (
          /* ================== NO APPLICATION STATE ================== */
          <motion.div 
            className="max-w-xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-6">
              <Globe className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Your Dream Abroad<br />
              <span className="text-primary">Starts Here</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              Get loan offers in 5 minutes
            </p>

            <Button 
              onClick={handleStartApplication}
              size="lg"
              className="h-14 px-10 text-lg font-semibold shadow-lg shadow-primary/20"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Application
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        ) : (
          /* ================== HAS APPLICATION - DOCUMENT FOCUS ================== */
          <motion.div 
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* 1. ACTION REQUIRED BANNER (Primary Message) */}
            <ActionRequiredBanner
              variant={getBannerVariant()}
              uploadedCount={docStats.uploaded}
              totalCount={docStats.total}
              pendingCount={docStats.pending}
              rejectedCount={docStats.rejected}
            />

            {/* 2. APPLICATION STEPPER (Non-clickable) */}
            <Card className="p-4">
              <ApplicationStepper 
                currentStep={getStepFromStatus(lead.status, lead.documents_status)} 
              />
            </Card>

            {/* 3. LENDER STATUS (Secondary, Non-blocking) */}
            <LenderStatusCard
              lenderName={lead.target_lender?.name}
              lenderCode={lead.target_lender?.code}
              onViewLenders={() => setShowChangeLender(true)}
            />

            {/* 4. DOCUMENTS BLOCK (Core Interaction) */}
            <StudentDocumentChecklist 
              leadId={lead.id} 
              onStatsUpdate={setDocStats}
            />

            {/* 5. SECONDARY ACTION - Edit Application (De-emphasized) */}
            {!isEditLocked && (
              <Button
                variant="outline"
                onClick={() => navigate('/student/apply')}
                className="w-full h-11 text-muted-foreground"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Application
              </Button>
            )}

            {/* 6. SUPPORT SECTION */}
            <SupportSection />
          </motion.div>
        )}
      </main>

      {/* 7. STICKY CTA (Only when has lead and docs pending) */}
      {hasLead && lead && (docStats.pending > 0 || docStats.rejected > 0) && (
        <StickyUploadCTA 
          onClick={handleUploadDocuments}
          pendingCount={docStats.pending + docStats.rejected}
        />
      )}

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
