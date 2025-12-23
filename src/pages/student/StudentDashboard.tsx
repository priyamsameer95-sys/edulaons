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
    <div className="min-h-screen bg-muted/30">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
            <span className="font-semibold">EduLoanPro</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Phone Verified
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Great news, {studentName}!
          </h1>
          <p className="text-muted-foreground text-lg">
            You're pre-approved for education loans
          </p>
        </div>

        {/* Eligibility Summary Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mx-auto mb-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{matchedLenders}</p>
                <p className="text-xs text-muted-foreground">Matched Lenders</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mx-auto mb-2">
                  <Percent className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{estimatedRate.min}%</p>
                <p className="text-xs text-muted-foreground">Starting Rate</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mx-auto mb-2">
                  <IndianRupee className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">₹{loanAmountLakhs}L</p>
                <p className="text-xs text-muted-foreground">Loan Amount</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mx-auto mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">24-48h</p>
                <p className="text-xs text-muted-foreground">Approval Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Your Journey</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-background rounded-lg border">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Quick eligibility check</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Done</Badge>
            </div>

            <div className="flex items-center gap-4 p-4 bg-background rounded-lg border">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Phone verified</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Done</Badge>
            </div>

            <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border-2 border-primary/30">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Complete application</p>
                <p className="text-sm text-muted-foreground">~5 minutes</p>
              </div>
              <Badge className="bg-primary text-primary-foreground">
                <Sparkles className="h-3 w-3 mr-1" />
                Next
              </Badge>
            </div>

            <div className="flex items-center gap-4 p-4 bg-background rounded-lg border opacity-60">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-muted-foreground">Get approval</p>
                <p className="text-sm text-muted-foreground">24-48 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4">
          <Button 
            size="lg" 
            className="w-full h-14 text-lg font-semibold"
            onClick={handleContinueApplication}
          >
            Complete Application
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-3">
            Your progress will be saved automatically
          </p>
        </div>

        {/* Trust Footer */}
        <div className="flex items-center justify-center gap-6 pt-8 pb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            <span>Bank-grade security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>RBI registered lenders</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
