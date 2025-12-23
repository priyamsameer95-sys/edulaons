import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowRight, 
  Check,
  LogOut, 
  Shield, 
  Clock,
  Building2,
  Percent,
  IndianRupee,
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

  const loanAmountLakhs = eligibilityData ? Math.round(eligibilityData.loan_amount / 100000) : 35;
  const estimatedRate = { min: 10.5, max: 12.5 };
  const matchedLenders = 4;
  const studentName = eligibilityData?.student_name?.split(' ')[0] || 'there';

  const steps = [
    { label: 'Eligibility', done: true },
    { label: 'Verified', done: true },
    { label: 'Application', done: false, current: true },
    { label: 'Approval', done: false },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-2xl border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-zinc-900 font-bold text-xs">E</span>
            </div>
            <span className="font-display font-semibold text-sm text-zinc-900 dark:text-white">EduLoans</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-2 -mr-2"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-24 pb-12">
        {/* Hero Section */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Pre-approved
          </div>
          <h1 className="font-display text-[28px] leading-tight font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
            Hey {studentName}, you're<br />almost there
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-[15px]">
            Complete your application to unlock loan offers
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex gap-3 mb-10">
          <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-zinc-900 dark:text-white">{matchedLenders}</p>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Lenders matched</p>
          </div>
          <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <Percent className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-zinc-900 dark:text-white">{estimatedRate.min}%</p>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Interest rate</p>
          </div>
          <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-zinc-900 dark:text-white">₹{loanAmountLakhs}L</p>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Loan amount</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                    ${step.done 
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' 
                      : step.current 
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 ring-4 ring-zinc-900/10 dark:ring-white/10' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }
                  `}>
                    {step.done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`
                    text-[10px] font-medium mt-2
                    ${step.done || step.current ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}
                  `}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`
                    w-12 sm:w-16 h-[2px] mx-1 mt-[-16px]
                    ${step.done ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Task Card */}
        <div className="bg-zinc-900 dark:bg-white rounded-3xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-zinc-900/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white dark:text-zinc-900" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-white dark:text-zinc-900 text-lg mb-1">
                Complete Application
              </h3>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm">
                Fill in your details to get personalized loan offers
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 text-xs">
              <Clock className="h-3.5 w-3.5" />
              <span>~5 minutes</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-zinc-700 dark:bg-zinc-300" />
            <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 text-xs">
              <Shield className="h-3.5 w-3.5" />
              <span>Secure & encrypted</span>
            </div>
          </div>

          <Button 
            onClick={handleContinueApplication}
            className="w-full h-12 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Trust Strip */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400">
          <span>Bank-grade security</span>
          <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span>RBI registered lenders</span>
          <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span>No spam</span>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
