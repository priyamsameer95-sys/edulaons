import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LenderCard from './LenderCard';

interface SuccessStepProps {
  caseId: string;
  leadId?: string;
  recommendedLenders: Array<{
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
  }>;
}

const SuccessStep = ({ caseId, leadId, recommendedLenders }: SuccessStepProps) => {
  const navigate = useNavigate();
  const [selectedLenderId, setSelectedLenderId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
      {/* Success Icon and Message */}
      <div className="text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-success/20 to-success/10 shadow-success animate-scale-in">
          <CheckCircle2 className="h-16 w-16 text-success animate-scale-in" style={{ animationDelay: '100ms' }} />
        </div>
        <div className="space-y-4">
          <h2 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '200ms' }}>
            Application Submitted!
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '250ms' }}>
            Your education loan application has been successfully submitted. We're now matching you with the best lenders.
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20 shadow-md animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex flex-col items-start gap-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Case ID</p>
              <span className="font-mono font-bold text-2xl text-primary">{caseId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Lenders Section */}
      <div className="space-y-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <div className="space-y-3 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">
            Choose Your Preferred Lender
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We've matched you with the best lenders based on your profile, university choices, and loan requirements. 
            Review their offerings and select your preferred choice to continue.
          </p>
        </div>

        {recommendedLenders && recommendedLenders.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recommendedLenders.map((lender, index) => (
                <div 
                  key={lender.lender_id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${500 + index * 100}ms` }}
                >
                  <LenderCard
                    lender={lender}
                    isSelected={selectedLenderId === lender.lender_id}
                    onSelect={() => handleLenderSelection(lender.lender_id)}
                    isUpdating={isUpdating}
                  />
                </div>
              ))}
            </div>
            {selectedLenderId && (
              <div className="p-5 bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/30 rounded-xl animate-fade-in shadow-success text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
                  <p className="text-sm font-bold text-success uppercase tracking-wide">
                    Lender Selected
                  </p>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your preference has been saved and our team will process your application accordingly
                </p>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Our team will recommend suitable lenders based on your profile and contact you shortly.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Next Steps */}
      <div className="text-center space-y-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
        <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 rounded-xl shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div className="text-left flex-1">
              <h3 className="font-display font-semibold text-lg mb-2">Next Steps</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Head to your dashboard and navigate to the <span className="font-semibold text-foreground">Checklist tab</span> to upload all required documents. 
                Complete document submission will speed up your application processing.
              </p>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/student')} 
          size="lg"
          className="px-10 h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] bg-gradient-to-r from-primary to-primary-dark"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default SuccessStep;
