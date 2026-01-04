/**
 * Student Signed-In Landing Page - B2C Optimized
 * 
 * Shows after authentication - single-focus hero with clear CTA
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
  BadgeCheck,
  FileText,
  Users,
  Shield,
  Loader2,
  Globe,
  Sparkles,
  ChevronRight,
  Lock,
  Star,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface ExistingLead {
  id: string;
  case_id: string;
  status: string;
  documents_status: string;
  created_at: string;
  loan_amount?: number;
  study_destination?: string;
}

interface EligibilityData {
  student_name?: string;
  loan_amount?: number;
  country?: string;
  verified?: boolean;
}

// Trust strip items
const TRUST_STRIP = [
  { icon: Lock, text: '256-bit Encrypted' },
  { icon: Building2, text: '10+ RBI Partners' },
  { icon: Star, text: '4.8★ Rating' },
  { icon: Users, text: '10K+ Students' },
];

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
        const savedData = sessionStorage.getItem('eligibility_form');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setEligibilityData(parsed);
          if (parsed.student_name) {
            setStudentName(parsed.student_name.split(' ')[0]);
          }
        }

        let studentData = null;
        
        // PHONE-FIRST LOOKUP: If synthetic email, extract phone and lookup by phone first
        const syntheticMatch = user.email.match(/^(\d{10})@student\.loan\.app$/i);
        
        if (syntheticMatch) {
          const phoneDigits = syntheticMatch[1];
          console.log('[StudentSignedInLanding] Synthetic email, looking up by phone:', phoneDigits);
          
          const { data: byPhone } = await supabase
            .from('students')
            .select('id, name')
            .eq('phone', phoneDigits)
            .maybeSingle();
          
          if (byPhone) {
            studentData = byPhone;
          }
        }
        
        // Fallback to email lookup
        if (!studentData) {
          const { data: byEmail } = await supabase
            .from('students')
            .select('id, name')
            .eq('email', user.email)
            .maybeSingle();
          
          if (byEmail) {
            studentData = byEmail;
          }
        }

        if (studentData) {
          if (studentData.name && !studentName) {
            setStudentName(studentData.name.split(' ')[0]);
          }

          const { data: leadData } = await supabase
            .from('leads_new')
            .select('id, case_id, status, documents_status, created_at, loan_amount, study_destination')
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

  const displayName = studentName.charAt(0).toUpperCase() + studentName.slice(1).toLowerCase() || 'there';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Hero Section */}
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
              {studentName ? (
                <>Welcome back, <span className="text-primary">{displayName}!</span></>
              ) : (
                <>Your Dream Abroad<br /><span className="text-primary">Starts Here</span></>
              )}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              {existingLead 
                ? "Continue where you left off"
                : "Get loan offers in 5 minutes"
              }
            </p>
          </div>

          {/* Existing Application Card */}
          {existingLead && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/10 to-transparent cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => navigate('/dashboard/student')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-foreground">Application in Progress</p>
                        <Badge variant="outline" className="text-[10px]">
                          {existingLead.case_id}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {existingLead.study_destination && `${existingLead.study_destination} • `}
                        {existingLead.loan_amount && `₹${Math.round(existingLead.loan_amount / 100000)}L`}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Pre-approval Card */}
          {eligibilityData?.verified && !existingLead && (
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
                      <p className="font-semibold text-foreground">
                        Pre-approved up to ₹{((eligibilityData.loan_amount || 2500000) / 100000).toFixed(0)}L
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {eligibilityData.country || 'USA'} Intake
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Main CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <Button 
              onClick={handleStartApplication}
              size="lg"
              className="h-14 px-10 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all w-full sm:w-auto"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {existingLead ? 'Start New Application' : 'Get Loan Offers'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <p className="text-sm text-muted-foreground mt-4">
              3 Steps • No Commitment • Compare 10+ Lenders
            </p>
          </motion.div>

          {/* Trust Strip */}
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
      </main>
    </div>
  );
};

export default StudentSignedInLanding;
