import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Building2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SuccessStepProps {
  caseId: string;
  leadId?: string;
  recommendedLenders: Array<{
    lender_id: string;
    lender_name: string;
    lender_code: string;
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

      {/* Recommended Lenders Card */}
      <Card className="border-2 transition-shadow hover:shadow-lg animate-fade-in" style={{ animationDelay: '400ms' }}>
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5 text-primary" />
            Select Your Preferred Lender
          </CardTitle>
          <CardDescription className="text-base">
            Choose the lender you'd like to work with for your education loan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendedLenders && recommendedLenders.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Click on a lender to select them as your preferred choice
              </p>
              {recommendedLenders.map((lender, index) => {
                const isSelected = selectedLenderId === lender.lender_id;
                return (
                  <button
                    key={lender.lender_id}
                    onClick={() => handleLenderSelection(lender.lender_id)}
                    disabled={isUpdating}
                    className={`w-full flex items-center justify-between p-4 rounded-lg transition-all hover:scale-[1.02] animate-fade-in ${
                      isSelected
                        ? 'bg-primary/10 border-2 border-primary shadow-md'
                        : 'bg-muted/30 hover:bg-muted/50 border-2 border-transparent hover:border-primary/30'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{ animationDelay: `${500 + index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                        isSelected ? 'bg-primary/20' : 'bg-primary/10'
                      }`}>
                        <Building2 className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-primary/70'}`} />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-base">{lender.lender_name}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <p className="text-sm text-muted-foreground">
                            Match Score: <span className="font-semibold text-foreground">{lender.compatibility_score}%</span>
                          </p>
                          {lender.is_preferred && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full border border-success/20">
                              ⭐ Recommended
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="ml-4 flex items-center justify-center w-8 h-8 rounded-full bg-primary animate-scale-in">
                        <Check className="h-5 w-5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
              {selectedLenderId && (
                <div className="mt-4 p-4 bg-success/10 border border-success/20 rounded-lg animate-fade-in">
                  <p className="text-sm text-success font-medium text-center">
                    ✓ Your lender preference has been saved
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 px-4 bg-muted/20 rounded-lg border border-dashed border-border">
              <Building2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Our team will recommend suitable lenders based on your profile
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
