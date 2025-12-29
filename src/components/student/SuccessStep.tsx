import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  Share2, 
  Download,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LenderComparisonGrid from './LenderComparisonGrid';
import { ConfettiAnimation } from './ConfettiAnimation';
import { formatCurrency } from '@/utils/formatters';

interface LenderData {
  lender_id: string;
  lender_name: string;
  lender_code: string;
  lender_description: string | null;
  logo_url: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  interest_rate_min: number | null;
  interest_rate_max: number | null;
  loan_amount_min: number | null;
  loan_amount_max: number | null;
  processing_fee: number | null;
  foreclosure_charges: number | null;
  moratorium_period: string | null;
  processing_time_days: number | null;
  disbursement_time_days: number | null;
  approval_rate: number | null;
  key_features: string[] | null;
  eligible_expenses: any[] | null;
  required_documents: string[] | null;
  compatibility_score: number;
  is_preferred: boolean;
  eligibility_score?: number;
  university_score?: number;
  student_score?: number;
  co_applicant_score?: number;
  approval_status?: 'approved' | 'rejected' | 'pending';
  rejection_reason?: string | null;
  eligible_loan_min?: number | null;
  eligible_loan_max?: number | null;
  rate_tier?: string | null;
  loan_band_percentage?: string | null;
  university_breakdown?: any;
  student_breakdown?: any;
  co_applicant_breakdown?: any;
  fit_group?: 'best_fit' | 'also_consider' | 'possible_but_risky' | 'not_suitable';
  student_facing_reason?: string;
  justification?: string;
  risk_flags?: string[];
  bre_rules_matched?: string[];
  probability_band?: 'high' | 'medium' | 'low';
  processing_time_estimate?: string;
}

interface SuccessStepProps {
  caseId: string;
  leadId?: string;
  requestedAmount?: number;
  recommendedLenders: LenderData[];
}

const SuccessStep = ({ caseId, leadId, requestedAmount, recommendedLenders }: SuccessStepProps) => {
  const navigate = useNavigate();
  const [selectedLenderId, setSelectedLenderId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  // Sort lenders by compatibility score
  const sortedLenders = useMemo(() => {
    return [...recommendedLenders].sort((a, b) => b.compatibility_score - a.compatibility_score);
  }, [recommendedLenders]);
  
  const topLender = sortedLenders[0];

  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleLenderSelection = async (lenderId: string) => {
    if (!leadId) {
      toast.error('Unable to update lender preference');
      return;
    }

    setSelectedLenderId(lenderId);
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('leads_new')
        .update({ lender_id: lenderId })
        .eq('case_id', caseId);

      if (error) throw error;

      toast.success('Lender preference updated successfully!');
    } catch (error) {
      console.error('Error updating lender:', error);
      toast.error('Failed to update lender preference');
      setSelectedLenderId(null);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Confetti Animation */}
      {showConfetti && <ConfettiAnimation />}

      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Application Submitted!
          </h2>
          <p className="text-muted-foreground">
            Your loan application has been successfully submitted
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border">
            <span className="text-sm text-muted-foreground">Case ID:</span>
            <span className="font-mono font-bold text-primary">{caseId}</span>
          </div>
        </div>
      </div>

      {/* Eligibility Summary */}
      {topLender?.eligibility_score !== undefined && requestedAmount && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {topLender.approval_status === 'approved' ? '✅' : '⚠️'} 
              Eligibility Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Requested</p>
                <p className="text-lg font-bold">{formatCurrency(requestedAmount)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Eligible</p>
                <p className="text-lg font-bold text-success">
                  {topLender.eligible_loan_max ? formatCurrency(topLender.eligible_loan_max) : '—'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Score</p>
                <p className="text-lg font-bold text-primary">
                  {Math.round(topLender.eligibility_score)}/100
                </p>
              </div>
            </div>
            
            {topLender.approval_status === 'approved' ? (
              <Alert className="bg-success/5 border-success/20">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-success text-sm">
                  Pre-approved for up to {formatCurrency(topLender.eligible_loan_max || 0)}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {topLender.rejection_reason || 'Our team will contact you with options.'}
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full justify-center text-muted-foreground text-xs"
            >
              {showBreakdown ? 'Hide' : 'View'} Score Breakdown
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
            </Button>
            
            {showBreakdown && (
              <div className="space-y-2 pt-2 border-t">
                <ScoreBar label="University" value={topLender.university_score} />
                <ScoreBar label="Academic" value={topLender.student_score} />
                <ScoreBar label="Co-Applicant" value={topLender.co_applicant_score} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lender Selection - All visible at once */}
      {recommendedLenders.length > 0 && (
        <LenderComparisonGrid
          lenders={sortedLenders}
          selectedLenderId={selectedLenderId}
          onSelect={handleLenderSelection}
          isUpdating={isUpdating}
        />
      )}

      {/* Selection Confirmation */}
      {selectedLenderId && (
        <div className="p-3 bg-success/10 border border-success/20 rounded-lg text-center">
          <p className="text-sm text-success font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Lender preference saved
          </p>
        </div>
      )}

      {/* No Lenders Fallback */}
      {recommendedLenders.length === 0 && (
        <Card>
          <CardContent className="text-center py-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
              <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Our team will recommend suitable lenders and contact you shortly.
            </p>
          </CardContent>
        </Card>
      )}

      {/* What Happens Next */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-center">What's Next?</h3>
        <div className="space-y-2">
          {[
            { num: 1, title: 'Lender Review', desc: 'Review within 24 hours' },
            { num: 2, title: 'Upload Documents', desc: 'Complete your application' },
            { num: 3, title: 'Get Approved', desc: 'Fund your education!' },
          ].map(({ num, title, desc }) => (
            <div key={num} className="flex gap-3 p-3 rounded-lg bg-muted/30 border">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                {num}
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center space-y-3">
        <div className="flex gap-3 justify-center">
          <Button 
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const text = `Just applied for my education loan! Case ID: ${caseId}`;
              if (navigator.share) {
                navigator.share({ text });
              } else {
                navigator.clipboard.writeText(text);
                toast.success('Copied to clipboard!');
              }
            }}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => toast.info('PDF download coming soon!')}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
        <Button 
          onClick={() => navigate('/student')} 
          className="px-8"
        >
          Go to Dashboard →
        </Button>
      </div>
    </div>
  );
};

// Helper component for score bars
const ScoreBar = ({ label, value }: { label: string; value?: number }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{Math.round(value || 0)}/100</span>
    </div>
    <Progress value={value || 0} className="h-1.5" />
  </div>
);

export default SuccessStep;
