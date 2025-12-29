import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Share2, 
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LenderComparisonGrid from './LenderComparisonGrid';
import { ConfettiAnimation } from './ConfettiAnimation';

interface LenderData {
  lender_id: string;
  lender_name: string;
  lender_code: string;
  lender_description?: string | null;
  logo_url: string | null;
  interest_rate_min: number | null;
  interest_rate_max?: number | null;
  loan_amount_min?: number | null;
  loan_amount_max: number | null;
  processing_time_days: number | null;
  approval_rate?: number | null;
  eligible_expenses?: any[] | null;
  compatibility_score: number;
  is_preferred?: boolean;
  eligible_loan_max?: number | null;
  student_facing_reason?: string;
}

interface SuccessStepProps {
  caseId: string;
  leadId?: string;
  requestedAmount?: number;
  recommendedLenders: LenderData[];
}

const SuccessStep = ({ caseId, leadId, recommendedLenders }: SuccessStepProps) => {
  const navigate = useNavigate();
  const [selectedLenderId, setSelectedLenderId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Sort lenders by compatibility score
  const sortedLenders = useMemo(() => {
    return [...recommendedLenders].sort((a, b) => b.compatibility_score - a.compatibility_score);
  }, [recommendedLenders]);

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
        <div className="rounded-xl border bg-card p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
            <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Our team will recommend suitable lenders and contact you shortly.
          </p>
        </div>
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

export default SuccessStep;
