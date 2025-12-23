import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { formatIndianNumber } from '@/utils/currencyFormatter';
import { 
  ArrowRight, 
  CheckCircle2, 
  LogOut, 
  TrendingUp, 
  Shield, 
  Clock,
  Building2,
  Percent,
  IndianRupee,
  FileText,
  Sparkles
} from 'lucide-react';

interface EligibilityData {
  student_name: string;
  student_phone: string;
  country: string;
  country_value: string;
  university_id: string;
  loan_amount: number;
  co_applicant_monthly_salary: number;
  verified: boolean;
  timestamp: string;
  source: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [eligibilityData, setEligibilityData] = useState<EligibilityData | null>(null);

  useEffect(() => {
    // Load eligibility data from session storage
    const stored = sessionStorage.getItem('eligibility_form');
    if (stored) {
      try {
        setEligibilityData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse eligibility data:', e);
      }
    }
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await signOut();
      navigate('/');
    }
  };

  const handleContinueApplication = () => {
    navigate('/student/apply');
  };

  // Calculate estimated values based on eligibility data
  const loanAmountLakhs = eligibilityData ? Math.round(eligibilityData.loan_amount / 100000) : 35;
  const estimatedRate = { min: 10.5, max: 12.5 };
  const matchedLenders = 4;

  const studentName = eligibilityData?.student_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-foreground">EduLoans</span>
            <span className="text-[10px] text-muted-foreground/70 font-medium">by Cashkaro</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground h-8 px-2">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8">
        {/* Success Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-5 ring-1 ring-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1.5">
            You're pre-approved, {studentName}
          </h1>
          <p className="text-muted-foreground text-sm">
            Complete your application to unlock offers
          </p>
        </div>

        {/* Stats Grid - Modern Glass Cards */}
        <div className="grid grid-cols-4 gap-2 mb-10">
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05),0_20px_40px_-20px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/25">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <p className="text-lg font-bold text-foreground">{matchedLenders}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Lenders</p>
          </div>
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05),0_20px_40px_-20px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/25">
              <Percent className="h-4 w-4 text-white" />
            </div>
            <p className="text-lg font-bold text-foreground">{estimatedRate.min}%</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Rate</p>
          </div>
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05),0_20px_40px_-20px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-violet-500/25">
              <IndianRupee className="h-4 w-4 text-white" />
            </div>
            <p className="text-lg font-bold text-foreground">₹{loanAmountLakhs}L</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Amount</p>
          </div>
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05),0_20px_40px_-20px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-500/25">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <p className="text-lg font-bold text-foreground">48h</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Approval</p>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_20px_40px_-20px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5 dark:ring-white/10 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-primary/50" />
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wide">Your Progress</h2>
          </div>
          
          <div className="space-y-1">
            {/* Completed Steps */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Eligibility check</p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Done</span>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Phone verified</p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Done</span>
            </div>

            {/* Current Step - Highlighted */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 ring-1 ring-primary/20">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Complete application</p>
              </div>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">~5 min</span>
            </div>

            {/* Future Step */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl opacity-40">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Get approval</p>
              </div>
              <span className="text-[10px] text-muted-foreground">24-48h</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button 
          size="lg" 
          className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-[0_10px_40px_-10px] shadow-primary/50 transition-all hover:shadow-[0_15px_50px_-10px] hover:shadow-primary/40 hover:-translate-y-0.5"
          onClick={handleContinueApplication}
        >
          Complete Application
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
        <p className="text-center text-[11px] text-muted-foreground mt-3 font-medium">
          Your progress is saved automatically
        </p>

        {/* Trust Footer */}
        <div className="flex items-center justify-center gap-5 mt-10 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
            <Shield className="h-3.5 w-3.5 text-slate-400" />
            <span>Bank-grade security</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
            <span>RBI registered</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
