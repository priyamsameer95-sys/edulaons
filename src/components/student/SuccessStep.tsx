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
      <div className="text-center space-y-6 animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 animate-scale-in">
          <CheckCircle2 className="h-14 w-14 text-success animate-scale-in" style={{ animationDelay: '100ms' }} />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '200ms' }}>
            Application Submitted Successfully!
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border border-border/50 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <p className="text-sm text-muted-foreground">Your Case ID:</p>
            <span className="font-mono font-semibold text-lg text-foreground">{caseId}</span>
          </div>
        </div>
      </div>

      {/* Recommended Lenders Section */}
      <div className="space-y-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Select Your Preferred Lender</h2>
          <p className="text-muted-foreground">
            We've matched you with the best lenders based on your profile. Review their offerings and select your preferred choice.
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
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg animate-fade-in text-center">
                <p className="text-sm text-success font-medium">
                  ✓ Your lender preference has been saved successfully
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
      <div className="text-center space-y-5 animate-fade-in" style={{ animationDelay: '600ms' }}>
        <div className="max-w-md mx-auto p-4 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground leading-relaxed">
            📋 Next, upload your documents in the <span className="font-semibold text-foreground">Checklist tab</span> to complete your application
          </p>
        </div>
        <Button 
          onClick={() => navigate('/student')} 
          size="lg"
          className="px-8 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default SuccessStep;
