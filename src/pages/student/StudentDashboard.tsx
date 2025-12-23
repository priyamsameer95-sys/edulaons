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
  BadgeCheck,
  Phone,
  GraduationCap,
  FileText,
  FileCheck,
  Zap,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Steps with time anchors - matching landing page style
const STEPS = [
  { icon: FileCheck, label: 'Eligibility', time: 'Done', done: true },
  { icon: Shield, label: 'Verified', time: 'Done', done: true },
  { icon: Zap, label: 'Application', time: '~8 mins', done: false, current: true },
  { icon: FileText, label: 'Documents', time: 'Upload', done: false },
  { icon: Trophy, label: 'Approval', time: '24-48 hrs', done: false },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [eligibilityData, setEligibilityData] = useState<EligibilityData | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Clean like landing */}
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
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
          
          {/* Left Sidebar */}
          <aside className="hidden lg:flex flex-col gap-4">
            {/* Referred By Card */}
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Referred By</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Skyline Education</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BadgeCheck className="w-3 h-3 text-emerald-500" />
                    <span>Verified Partner</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Loan Stats */}
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Your Loan Details</p>
              <div className="space-y-3">
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
                      <Percent className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-muted-foreground">Est. Rate</span>
                  </div>
                  <span className="text-base font-bold text-foreground">{estimatedRate.min}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-sm text-muted-foreground">Lenders</span>
                  </div>
                  <span className="text-base font-bold text-foreground">{matchedLenders}</span>
                </div>
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Need Help?</p>
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
            </div>
          </aside>

          {/* Right Content - Main Area */}
          <div className="flex flex-col gap-5">
            {/* Trust Badge - Like landing */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Pre-approved for ₹{loanAmountLakhs}L with {matchedLenders} lenders
            </div>

            {/* Hero Section - Typography focused like landing */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight tracking-tight">
                Welcome back, <span className="text-primary">{studentName}!</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                You're 60% complete. Complete your application to get your loan approved.
              </p>
            </div>

            {/* Progress Steps - Landing page style with hover */}
            <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-4">How it works</p>
              <div className="grid grid-cols-5 gap-2">
                {STEPS.map((step, i) => (
                  <div 
                    key={step.label} 
                    className="text-center group cursor-default"
                    onMouseEnter={() => setHoveredStep(i)}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    <div className={cn(
                      "w-11 h-11 mx-auto rounded-xl flex items-center justify-center mb-1.5 transition-all duration-300 border",
                      step.done 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : step.current 
                          ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20" 
                          : "bg-muted border-transparent text-muted-foreground",
                      hoveredStep === i && !step.done && !step.current && "bg-primary/10 border-primary/20 scale-110 shadow-lg shadow-primary/10"
                    )}>
                      {step.done ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <step.icon className={cn(
                          "h-5 w-5 transition-colors duration-300",
                          hoveredStep === i && !step.current ? "text-primary" : ""
                        )} />
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground leading-tight">{step.label}</p>
                    <p className={cn(
                      "text-[10px] font-semibold transition-colors mt-0.5",
                      step.done ? "text-emerald-600" : step.current ? "text-primary" : "text-muted-foreground"
                    )}>{step.time}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Card - Clean and prominent */}
            <div className="bg-card rounded-xl p-5 sm:p-6 border border-border shadow-xl shadow-primary/5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Task</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                    Complete Your Application
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fill in your personal and academic details to proceed
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-full">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">~8 mins</span>
                </div>
              </div>
              
              <Button 
                onClick={handleContinueApplication}
                size="lg"
                className="w-full h-12 font-semibold text-base transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20"
              >
                Continue Application
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  No credit score impact
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Auto-save enabled
                </span>
              </div>
            </div>

            {/* Mobile: Loan Stats (shown on mobile only) */}
            <div className="lg:hidden grid grid-cols-3 gap-3">
              <div className="bg-card rounded-xl p-3 border border-border text-center">
                <IndianRupee className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">₹{loanAmountLakhs}L</p>
                <p className="text-[10px] text-muted-foreground">Loan Amount</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border text-center">
                <Percent className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{estimatedRate.min}%</p>
                <p className="text-[10px] text-muted-foreground">Interest Rate</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border text-center">
                <Building2 className="w-5 h-5 text-violet-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{matchedLenders}</p>
                <p className="text-[10px] text-muted-foreground">Lenders</p>
              </div>
            </div>

            {/* Mobile: Need Help */}
            <div className="lg:hidden">
              <a 
                href="tel:8238452277" 
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-foreground">Call RM: 8238452277</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;