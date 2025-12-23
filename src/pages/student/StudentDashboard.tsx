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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
            <span className="font-semibold">EduLoans</span>
            <span className="text-xs text-muted-foreground">by Cashkaro</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
            <CheckCircle2 className="h-4 w-4" />
            Phone Verified
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Great news, {studentName}!
          </h1>
          <p className="text-muted-foreground">
            You're pre-approved for education loans
          </p>
        </div>

        {/* Stats Card */}
        <Card className="mb-8 border-0 shadow-sm bg-muted/40">
          <CardContent className="p-0">
            <div className="grid grid-cols-4 divide-x divide-border">
              <div className="p-5 text-center">
                <Building2 className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-foreground">{matchedLenders}</p>
                <p className="text-xs text-muted-foreground">Lenders</p>
              </div>
              <div className="p-5 text-center">
                <Percent className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-foreground">{estimatedRate.min}%</p>
                <p className="text-xs text-muted-foreground">From</p>
              </div>
              <div className="p-5 text-center">
                <IndianRupee className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-foreground">₹{loanAmountLakhs}L</p>
                <p className="text-xs text-muted-foreground">Amount</p>
              </div>
              <div className="p-5 text-center">
                <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-foreground">48h</p>
                <p className="text-xs text-muted-foreground">Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Journey Steps */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Your Progress</h2>
          <div className="space-y-2">
            {/* Completed Step 1 */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="flex-1 text-sm text-foreground">Eligibility check</p>
              <span className="text-xs text-emerald-600 font-medium">Done</span>
            </div>

            {/* Completed Step 2 */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="flex-1 text-sm text-foreground">Phone verified</p>
              <span className="text-xs text-emerald-600 font-medium">Done</span>
            </div>

            {/* Current Step */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <p className="flex-1 text-sm font-medium text-foreground">Complete application</p>
              <span className="text-xs text-primary font-medium">~5 min</span>
            </div>

            {/* Future Step */}
            <div className="flex items-center gap-3 p-3 rounded-lg opacity-50">
              <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <p className="flex-1 text-sm text-muted-foreground">Get approval</p>
              <span className="text-xs text-muted-foreground">24-48h</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button 
          size="lg" 
          className="w-full h-14 text-base font-semibold shadow-lg shadow-primary/20"
          onClick={handleContinueApplication}
        >
          Complete Application
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Progress saved automatically
        </p>

        {/* Trust Footer */}
        <div className="flex items-center justify-center gap-6 mt-12 pt-6 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            <span>Bank-grade security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>RBI registered lenders</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
