import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Share2, 
  Download,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LenderCard from './LenderCard';
import LenderHeroCard from './LenderHeroCard';
import LenderComparisonTable from './LenderComparisonTable';
import LenderViewToggle from './LenderViewToggle';
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showAllLenders, setShowAllLenders] = useState(false);
  
  // Sort lenders by compatibility score and identify top lender
  const sortedLenders = useMemo(() => {
    return [...recommendedLenders].sort((a, b) => b.compatibility_score - a.compatibility_score);
  }, [recommendedLenders]);
  
  const topLender = sortedLenders[0];
  const otherLenders = sortedLenders.slice(1);
  const totalLenders = recommendedLenders.length;

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
    <div className="space-y-10 pb-8">
      {/* Confetti Animation */}
      {showConfetti && <ConfettiAnimation />}

      {/* Success Header */}
      <div className="text-center space-y-5">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Application Submitted! 🎉
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Your loan application has been successfully submitted
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-muted/50 rounded-lg border">
            <span className="text-sm text-muted-foreground">Case ID:</span>
            <span className="font-mono font-bold text-lg text-primary">{caseId}</span>
          </div>
        </div>
      </div>

      {/* Eligibility Summary Card */}
      {topLender?.eligibility_score !== undefined && requestedAmount && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {topLender.approval_status === 'approved' ? '✅' : '⚠️'} 
              Your Eligibility Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-background border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Requested</p>
                <p className="text-xl font-bold">{formatCurrency(requestedAmount)}</p>
              </div>
              <div className="p-4 rounded-xl bg-background border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Eligible</p>
                <p className="text-xl font-bold text-success">
                  {topLender.eligible_loan_max ? formatCurrency(topLender.eligible_loan_max) : '—'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-background border col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Score</p>
                <p className="text-xl font-bold text-primary">
                  {Math.round(topLender.eligibility_score)}/100
                </p>
              </div>
            </div>
            
            {topLender.approval_status === 'approved' ? (
              <Alert className="bg-success/10 border-success/30">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  <strong>Great news!</strong> You're pre-approved for a loan up to {formatCurrency(topLender.eligible_loan_max || 0)}.
                  {topLender.loan_band_percentage && (
                    <span className="text-sm opacity-80 block mt-1">
                      This is {topLender.loan_band_percentage} of your requested amount.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Review needed</strong>
                  <p className="mt-1 text-sm">{topLender.rejection_reason || 'Our team will contact you with options.'}</p>
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full justify-center text-muted-foreground"
            >
              {showBreakdown ? 'Hide' : 'View'} Score Breakdown
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
            </Button>
            
            {showBreakdown && (
              <div className="space-y-3 pt-3 border-t">
                <ScoreBar label="University Score" value={topLender.university_score} />
                <ScoreBar label="Academic Score" value={topLender.student_score} />
                <ScoreBar label="Co-Applicant Score" value={topLender.co_applicant_score} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lender Selection Section */}
      {recommendedLenders.length > 0 && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Choose Your Lender</h2>
              <p className="text-muted-foreground mt-1">
                {totalLenders} lender{totalLenders !== 1 ? 's' : ''} matched to your profile
              </p>
            </div>
            {totalLenders > 1 && (
              <LenderViewToggle view={viewMode} onViewChange={setViewMode} />
            )}
          </div>

          {/* Top Recommendation Hero */}
          {topLender && viewMode === 'cards' && (
            <LenderHeroCard
              lender={topLender}
              isSelected={selectedLenderId === topLender.lender_id}
              onSelect={() => handleLenderSelection(topLender.lender_id)}
              isUpdating={isUpdating}
            />
          )}

          {/* Other Lenders */}
          {otherLenders.length > 0 && (
            <>
              {viewMode === 'cards' ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowAllLenders(!showAllLenders)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-foreground">
                      Compare {otherLenders.length} other lender{otherLenders.length !== 1 ? 's' : ''}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showAllLenders ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showAllLenders && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
                      {otherLenders.map((lender) => (
                        <LenderCard
                          key={lender.lender_id}
                          lender={lender}
                          isSelected={selectedLenderId === lender.lender_id}
                          onSelect={() => handleLenderSelection(lender.lender_id)}
                          isUpdating={isUpdating}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <LenderComparisonTable
                  lenders={sortedLenders}
                  selectedLenderId={selectedLenderId}
                  onSelect={handleLenderSelection}
                  isUpdating={isUpdating}
                />
              )}
            </>
          )}

          {/* Selection Confirmation */}
          {selectedLenderId && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-center animate-fade-in">
              <p className="text-sm text-success font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Lender preference saved successfully
              </p>
            </div>
          )}
        </div>
      )}

      {/* No Lenders Fallback */}
      {recommendedLenders.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Our team will recommend suitable lenders and contact you shortly.
            </p>
          </CardContent>
        </Card>
      )}

      {/* What Happens Next */}
      <div className="max-w-2xl mx-auto space-y-4">
        <h3 className="text-xl font-bold text-center">What Happens Next?</h3>
        <div className="space-y-3">
          {[
            { num: 1, title: 'Lender Review', desc: 'Our partner lenders will review your application within 24 hours' },
            { num: 2, title: 'Upload Documents', desc: 'Complete your application by uploading required documents' },
            { num: 3, title: 'Get Approved', desc: 'Receive your loan approval and fund your education!' },
          ].map(({ num, title, desc }) => (
            <div key={num} className="flex gap-4 p-4 rounded-xl bg-muted/30 border">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {num}
              </div>
              <div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center space-y-4">
        <div className="flex flex-wrap gap-3 justify-center">
          <Button 
            variant="outline"
            size="lg"
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
            size="lg"
            className="gap-2"
            onClick={() => toast.info('PDF download feature coming soon!')}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
        <Button 
          onClick={() => navigate('/student')} 
          size="lg"
          className="px-10 h-12 text-base font-semibold"
        >
          Go to Dashboard →
        </Button>
      </div>
    </div>
  );
};

// Helper component for score bars
const ScoreBar = ({ label, value }: { label: string; value?: number }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{Math.round(value || 0)}/100</span>
    </div>
    <Progress value={value || 0} className="h-2" />
  </div>
);

export default SuccessStep;
