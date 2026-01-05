/**
 * Student Dashboard - Compact Redesign
 * 
 * 3-section layout:
 * 1. CompactStatusHeader - Journey card with status
 * 2. ApplicationDetailsCard - Basic info with edit button
 * 3. CollapsibleDocumentSection - Documents with filter tabs
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const LOADING_TIMEOUT_MS = 15000; // 15 second max loading time (auth can be slow)
import { supabase } from '@/integrations/supabase/client';
import { filterLeadForStudent } from '@/utils/rolePermissions';
import { STUDENT_EDIT_LOCKED_STATUSES } from '@/constants/studentPermissions';
import ChangeLenderModal from '@/components/student/ChangeLenderModal';
import StudentUploadSheet from '@/components/student/StudentUploadSheet';
import { toast } from 'sonner';
import { 
  CompactStatusHeader,
  ApplicationDetailsCard,
  CollapsibleDocumentSection,
  type DocumentItem,
} from '@/components/student/dashboard';
import { 
  LogOut, 
  GraduationCap,
  Sparkles,
  ChevronRight,
  Globe,
  Shield
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

interface DocumentType {
  id: string;
  name: string;
  category: string;
  description: string | null;
  required: boolean;
}

interface UploadedDoc {
  id: string;
  document_type_id: string;
  verification_status: string;
  original_filename: string;
  verification_notes: string | null;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<StudentLead | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [hasLead, setHasLead] = useState(false);
  const [showChangeLender, setShowChangeLender] = useState(false);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Document state
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const isEditLocked = lead ? STUDENT_EDIT_LOCKED_STATUSES.includes(lead.status as any) : true;

  const fetchStudentData = useCallback(async () => {
    if (!user?.email) return;

    try {
      let studentData = null;
      
      // PHONE-FIRST LOOKUP: If synthetic email, extract phone and lookup by phone first
      // This is more reliable since phone is the student's primary identity
      const syntheticMatch = user.email.match(/^(\d{10})@student\.loan\.app$/i);
      
      if (syntheticMatch) {
        // Synthetic OTP email - lookup by phone FIRST
        const phoneDigits = syntheticMatch[1];
        console.log('[StudentDashboard] Synthetic email detected, looking up by phone:', phoneDigits);
        
        const { data: byPhone, error: phoneError } = await supabase
          .from('students')
          .select('id, name, email, phone')
          .eq('phone', phoneDigits)
          .maybeSingle();
        
        if (!phoneError && byPhone) {
          studentData = byPhone;
          console.log('[StudentDashboard] Found student by phone:', studentData.id);
        }
      }
      
      // If not found by phone (or not synthetic), try email lookup
      if (!studentData) {
        const { data: byEmail, error: emailError } = await supabase
          .from('students')
          .select('id, name, email, phone')
          .eq('email', user.email)
          .maybeSingle();

        if (!emailError && byEmail) {
          studentData = byEmail;
          console.log('[StudentDashboard] Found student by email:', studentData.id);
        } else {
          // Final fallback: Extract any 10 digits from email
          const emailMatch = user.email.match(/(\d{10})/);
          if (emailMatch) {
            const phoneDigits = emailMatch[1];
            const { data: byPhone, error: phoneError } = await supabase
              .from('students')
              .select('id, name, email, phone')
              .eq('phone', phoneDigits)
              .maybeSingle();
            
            if (!phoneError && byPhone) {
              studentData = byPhone;
              console.log('[StudentDashboard] Found student by extracted phone:', studentData.id);
            }
          }
        }
      }

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
          console.log('[StudentDashboard] Found lead:', leadData.case_id);

          // Fetch documents for this lead
          await fetchDocuments(leadData.id);
        } else {
          console.log('[StudentDashboard] No lead found for student');
        }
      } else {
        console.log('[StudentDashboard] No student profile found');
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  const fetchDocuments = async (leadId: string) => {
    const [typesRes, docsRes] = await Promise.all([
      supabase
        .from('document_types')
        .select('id, name, category, description, required')
        .order('display_order', { ascending: true }),
      supabase
        .from('lead_documents')
        .select('id, document_type_id, verification_status, original_filename, verification_notes')
        .eq('lead_id', leadId)
    ]);

    setDocumentTypes(typesRes.data || []);
    setUploadedDocs(docsRes.data || []);
  };

  // Wait for auth to finish before fetching student data
  // Key fix: Don't give up too early on slow auth, retry when user becomes available
  useEffect(() => {
    let isMounted = true;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const attemptFetch = async () => {
      // If we have a user email, try to fetch student data
      if (user?.email) {
        console.log('[StudentDashboard] User available, fetching student data:', user.email);
        await fetchStudentData();
        return true;
      }
      return false;
    };

    // If auth is still loading, wait for it - but set a max timeout
    if (authLoading) {
      console.log('[StudentDashboard] Auth still loading, waiting...');
      
      // Set a safety timeout - if auth takes too long, we'll check again
      timeoutRef.current = setTimeout(() => {
        if (isMounted && !user) {
          console.log('[StudentDashboard] Auth timeout, checking one more time...');
          setLoadingTimedOut(true);
          setLoading(false);
        }
      }, LOADING_TIMEOUT_MS);
      
      return () => {
        isMounted = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    // Auth finished - now we can make decisions
    if (!user) {
      // No user after auth complete - stop loading
      console.log('[StudentDashboard] No user after auth complete, stopping load');
      setLoading(false);
      return;
    }

    // We have a user - fetch their data
    attemptFetch();

    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [authLoading, user?.email, fetchStudentData]);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await signOut();
      navigate('/');
    }
  };

  const handleUploadDocuments = () => {
    setShowUploadSheet(true);
  };

  const handleStartApplication = () => {
    navigate('/student/apply');
  };

  const handleEditApplication = () => {
    navigate('/student/apply');
  };

  // Document helpers
  const getDocumentStatus = (typeId: string): 'required' | 'pending' | 'verified' | 'rejected' => {
    const doc = uploadedDocs.find(d => d.document_type_id === typeId);
    if (!doc) return 'required';
    if (doc.verification_status === 'verified') return 'verified';
    if (doc.verification_status === 'rejected') return 'rejected';
    return 'pending';
  };

  const handleFileUpload = async (typeId: string, file: File) => {
    if (!lead || !file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadingId(typeId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${lead.id}/${typeId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: newDoc, error: dbError } = await supabase
        .from('lead_documents')
        .insert({
          lead_id: lead.id,
          document_type_id: typeId,
          file_path: fileName,
          stored_filename: fileName,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          verification_status: 'pending',
          uploaded_by: 'student'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadedDocs(prev => [...prev, newDoc]);
      toast.success('Document uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  // Calculate stats
  const requiredDocs = documentTypes.filter(d => d.required);
  const pendingCount = requiredDocs.filter(d => getDocumentStatus(d.id) === 'required').length;
  const uploadedCount = requiredDocs.filter(d => {
    const status = getDocumentStatus(d.id);
    return status === 'pending';
  }).length;
  const rejectedCount = requiredDocs.filter(d => getDocumentStatus(d.id) === 'rejected').length;
  const verifiedCount = requiredDocs.filter(d => getDocumentStatus(d.id) === 'verified').length;
  const totalDocs = requiredDocs.length;

  // Build document items for table
  const documentItems: DocumentItem[] = requiredDocs.map(doc => {
    const uploaded = uploadedDocs.find(u => u.document_type_id === doc.id);
    return {
      id: doc.id,
      name: doc.name,
      category: doc.category,
      description: doc.description,
      status: getDocumentStatus(doc.id),
      rejectionReason: uploaded?.verification_notes || undefined,
      uploadedFilename: uploaded?.original_filename,
    };
  });

  const rawName = profile?.name?.split(' ')[0] || 'there';
  const studentName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';
  };

  // Handle session recovery
  const handleRefreshSession = async () => {
    setLoading(true);
    setLoadingTimedOut(false);
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('[StudentDashboard] Session refresh failed:', error);
        toast.error('Session expired. Please login again.');
        navigate('/login/student');
        return;
      }
      // Retry fetching data
      await fetchStudentData();
    } catch (err) {
      console.error('[StudentDashboard] Refresh error:', err);
      navigate('/login/student');
    }
  };

  const handleLogoutAndRetry = async () => {
    await signOut();
    navigate('/login/student');
  };

  // Show loading only if auth is still loading or we're fetching data
  if (loading && !loadingTimedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If loading timed out or no user after auth - show recovery UI
  if ((loadingTimedOut && !profile) || (!authLoading && !user)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Session Issue</h2>
          <p className="text-muted-foreground text-center max-w-sm">
            {!user 
              ? "Your session may have expired. Please try refreshing or login again."
              : "Something went wrong loading your data."
            }
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefreshSession}>
            Refresh Session
          </Button>
          <Button onClick={handleLogoutAndRetry}>
            Login Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-lg text-foreground leading-tight">Eduloans</span>
                <span className="text-[10px] text-muted-foreground">by cashakro</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {profile && hasLead && lead && (
                <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-muted/50 border border-border">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-foreground">
                      {getInitials(profile.name)}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{studentName}</span>
                </div>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {!hasLead ? (
          /* ================== NO APPLICATION STATE ================== */
          <motion.div 
            className="max-w-xl mx-auto text-center pt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-8">
              <Globe className="w-12 h-12 text-primary" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Your Dream Abroad<br />
              <span className="text-primary">Starts Here</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-10">
              Get personalized loan offers in just 5 minutes
            </p>

            <Button 
              onClick={handleStartApplication}
              size="lg"
              className="h-14 px-12 text-lg font-semibold shadow-lg shadow-primary/20"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Application
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        ) : (
          /* ================== HAS APPLICATION - COMPACT 3-SECTION DASHBOARD ================== */
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Section 1: Compact Status Header (Journey Card) */}
            <CompactStatusHeader
              caseId={lead.case_id}
              status={lead.status}
            />

            {/* Section 2: Application Details Card */}
            <ApplicationDetailsCard
              loanAmount={lead.loan_amount}
              studyDestination={lead.study_destination}
              intakeMonth={lead.intake_month}
              intakeYear={lead.intake_year}
              targetLender={lead.target_lender}
              createdAt={lead.created_at}
              isEditLocked={isEditLocked}
              onEditClick={handleEditApplication}
            />

            {/* Section 3: Collapsible Document Section */}
            <CollapsibleDocumentSection
              documents={documentItems}
              pendingCount={pendingCount}
              uploadedCount={uploadedCount}
              rejectedCount={rejectedCount}
              verifiedCount={verifiedCount}
              totalCount={totalDocs}
              onUploadClick={handleUploadDocuments}
              onFileUpload={handleFileUpload}
              uploadingId={uploadingId}
            />

            {/* Trust Footer */}
            <div className="flex items-center justify-center gap-2 pt-6 pb-4 text-xs text-muted-foreground/70">
              <Shield className="w-3.5 h-3.5" />
              <span>Your documents are securely shared only with verified lenders</span>
            </div>
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

      {/* Upload Sheet */}
      {lead && (
        <StudentUploadSheet
          open={showUploadSheet}
          onOpenChange={setShowUploadSheet}
          leadId={lead.id}
          studentName={profile?.name}
          onUploadComplete={async () => {
            await fetchDocuments(lead.id);
          }}
          documentTypes={documentTypes}
          uploadedDocs={uploadedDocs}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
