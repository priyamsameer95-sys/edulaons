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
  Sparkles,
  Users,
  Lock,
  BadgeCheck,
  Star,
  MessageCircle,
  Phone,
  HelpCircle,
  Quote,
  TrendingUp,
  GraduationCap,
  FileText
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
    { label: 'Documents', done: false },
    { label: 'Approval', done: false },
  ];

  const testimonials = [
    { name: "Priya S.", university: "MIT", text: "Got approved in just 3 days! The process was seamless." },
    { name: "Rahul M.", university: "Stanford", text: "Best rates I found. Highly recommend!" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/80 dark:bg-zinc-950/80 border-b border-slate-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-semibold text-lg text-foreground">EduFinance</span>
            </div>
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
      </header>

      {/* Main Content - 3 Column Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6 lg:gap-8">
          
          {/* Left Sidebar */}
          <aside className="hidden lg:flex flex-col gap-6">
            {/* Referred By Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/60 dark:border-zinc-800 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Referred By</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Skyline Education</p>
                  <p className="text-sm text-muted-foreground">Verified Partner</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BadgeCheck className="w-4 h-4 text-green-500" />
                <span>Your counselor is tracking your application</span>
              </div>
            </div>

            {/* Why Trust Us */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/60 dark:border-zinc-800 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Why Trust Us</p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">RBI Regulated</p>
                    <p className="text-xs text-muted-foreground">All partner lenders are RBI registered</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">50,000+ Students</p>
                    <p className="text-xs text-muted-foreground">Successfully funded their education</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Bank-grade Security</p>
                    <p className="text-xs text-muted-foreground">256-bit SSL encryption</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Banks */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/60 dark:border-zinc-800 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Partner Banks</p>
              <div className="flex flex-wrap gap-2">
                {['SBI', 'HDFC', 'ICICI', 'Axis', 'PNB'].map((bank) => (
                  <div 
                    key={bank}
                    className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-xs font-medium text-foreground"
                  >
                    {bank}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Center Content */}
          <div className="flex flex-col gap-6">
            {/* Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-primary/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur rounded-full text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  Pre-approved
                </div>
                
                <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                  Welcome back, {studentName}!
                </h1>
                <p className="text-white/80 text-base sm:text-lg">
                  You're 60% complete. Finish your application to get your funds.
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/60 dark:border-zinc-800 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                  <IndianRupee className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">₹{loanAmountLakhs}L</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Loan Amount</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/60 dark:border-zinc-800 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                  <Percent className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{estimatedRate.min}%</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Interest Rate</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/60 dark:border-zinc-800 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5 text-violet-600" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{matchedLenders}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Matched Lenders</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-slate-200/60 dark:border-zinc-800 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">Application Progress</p>
              <div className="flex items-center justify-between">
                {steps.map((step, i) => (
                  <div key={step.label} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                          step.done 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                            : step.current 
                              ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/20' 
                              : 'bg-slate-100 dark:bg-zinc-800 text-muted-foreground'
                        }`}
                      >
                        {step.done ? <Check className="w-5 h-5" /> : i + 1}
                      </div>
                      <span className={`mt-2 text-xs font-medium ${
                        step.current ? 'text-primary' : step.done ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-8 sm:w-12 lg:w-16 h-0.5 mx-1 sm:mx-2 ${
                        step.done ? 'bg-green-500' : 'bg-slate-200 dark:bg-zinc-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-slate-900 to-zinc-900 dark:from-white dark:to-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-white dark:text-zinc-900" />
                    <span className="text-white/60 dark:text-zinc-600 text-sm font-medium">Current Task</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white dark:text-zinc-900">
                    Complete Your Application
                  </h3>
                  <p className="text-white/70 dark:text-zinc-600 mt-1">
                    Fill in your personal and academic details
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-zinc-200 rounded-full">
                  <Clock className="w-4 h-4 text-white/80 dark:text-zinc-600" />
                  <span className="text-sm text-white/80 dark:text-zinc-600">~8 mins</span>
                </div>
              </div>
              
              <Button 
                onClick={handleContinueApplication}
                size="lg"
                className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-white/90 dark:hover:bg-zinc-800 font-semibold h-14 text-base rounded-xl shadow-lg"
              >
                Continue Application
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <div className="flex items-center justify-center gap-4 mt-5 text-white/50 dark:text-zinc-500 text-xs">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Secure & encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Auto-save enabled
                </span>
              </div>
            </div>

            {/* Mobile: Trust Signals (shown on mobile only) */}
            <div className="lg:hidden grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-slate-200/60 dark:border-zinc-800">
                <Shield className="w-5 h-5 text-green-600 mb-2" />
                <p className="text-sm font-medium text-foreground">RBI Regulated</p>
                <p className="text-xs text-muted-foreground">Licensed lenders</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-slate-200/60 dark:border-zinc-800">
                <Users className="w-5 h-5 text-blue-600 mb-2" />
                <p className="text-sm font-medium text-foreground">50K+ Students</p>
                <p className="text-xs text-muted-foreground">Funded dreams</p>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden lg:flex flex-col gap-6">
            {/* Testimonials */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/60 dark:border-zinc-800 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">What Students Say</p>
              <div className="space-y-4">
                {testimonials.map((t, i) => (
                  <div key={i} className="relative">
                    <Quote className="w-6 h-6 text-primary/20 absolute -top-1 -left-1" />
                    <p className="text-sm text-foreground pl-4 italic">"{t.text}"</p>
                    <div className="flex items-center gap-2 mt-2 pl-4">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-indigo-500" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.university}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-primary/5 to-indigo-500/5 rounded-2xl p-5 border border-primary/10">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Platform Stats</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Disbursed</span>
                  <span className="text-sm font-bold text-primary">₹2,400 Cr+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Approval Rate</span>
                  <span className="text-sm font-bold text-green-600">98%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Processing</span>
                  <span className="text-sm font-bold text-foreground">48 hrs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User Rating</span>
                  <span className="text-sm font-bold text-amber-500 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current" />
                    4.8/5
                  </span>
                </div>
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/60 dark:border-zinc-800 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Need Help?</p>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Live Chat</p>
                    <p className="text-xs text-muted-foreground">Usually replies in 2 mins</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Call Us</p>
                    <p className="text-xs text-muted-foreground">Mon-Sat, 9am-7pm</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">FAQs</p>
                    <p className="text-xs text-muted-foreground">Common questions</p>
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
