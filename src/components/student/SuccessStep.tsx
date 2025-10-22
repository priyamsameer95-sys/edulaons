import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LenderCard from './LenderCard';

interface SuccessStepProps {
  caseId: string;
  leadId?: string;
  requestedAmount?: number;
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
  }>;
}

const SuccessStep = ({ caseId, leadId, requestedAmount, recommendedLenders }: SuccessStepProps) => {
  const navigate = useNavigate();
  const [selectedLenderId, setSelectedLenderId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  const assignedLender = recommendedLenders[0]; // First lender is the assigned one
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

      {/* Eligibility Card */}
      {assignedLender?.eligibility_score !== undefined && requestedAmount && (
        <Card className="border-primary/20 bg-primary/5 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {assignedLender.approval_status === 'approved' ? '✅' : '⚠️'} 
              Your Loan Eligibility with {assignedLender.lender_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">You Requested</p>
                <p className="text-2xl font-bold">{formatCurrency(requestedAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Eligibility Score</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(assignedLender.eligibility_score)}/100
                </p>
              </div>
            </div>
            
            {assignedLender.approval_status === 'approved' ? (
              <>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong className="text-green-700">Congratulations! You're Approved</strong>
                    <p className="text-lg font-bold text-green-700 mt-2">
                      Eligible Loan: {formatCurrency(assignedLender.eligible_loan_min || 0)} - {formatCurrency(assignedLender.eligible_loan_max || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This is {assignedLender.loan_band_percentage} of your requested amount, based on your profile strength
                    </p>
                    {assignedLender.interest_rate_min && assignedLender.interest_rate_max && (
                      <p className="text-sm text-green-700 mt-2">
                        💰 Expected Interest Rate: {assignedLender.interest_rate_min}% - {assignedLender.interest_rate_max}% p.a.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
                
                {assignedLender.eligible_loan_max && assignedLender.eligible_loan_max < requestedAmount && (
                  <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-sm text-yellow-800">
                      💡 <strong>Note:</strong> Your eligible amount is ₹{((requestedAmount - assignedLender.eligible_loan_max) / 100000).toFixed(1)}L lower than requested.
                      You may need to arrange the difference from other sources (family contribution, scholarships, etc.)
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Not eligible with this lender</strong>
                  <p className="mt-1">{assignedLender.rejection_reason || 'Does not meet minimum eligibility criteria'}</p>
                  <p className="mt-2 text-sm">💬 Don't worry! Our team will review your application and suggest alternative lenders.</p>
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full"
            >
              {showBreakdown ? 'Hide' : 'Show'} Score Breakdown
            </Button>
            
            {showBreakdown && (
              <div className="space-y-3 pt-3 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">University Score:</span>
                    <span className="font-semibold text-lg">{Math.round(assignedLender.university_score || 0)}/100</span>
                  </div>
                  <Progress value={assignedLender.university_score || 0} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Academic Score:</span>
                    <span className="font-semibold text-lg">{Math.round(assignedLender.student_score || 0)}/100</span>
                  </div>
                  <Progress value={assignedLender.student_score || 0} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Co-Applicant Score:</span>
                    <span className="font-semibold text-lg">{Math.round(assignedLender.co_applicant_score || 0)}/100</span>
                  </div>
                  <Progress value={assignedLender.co_applicant_score || 0} className="h-2" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommended Lenders Section */}
      <div className="space-y-4 animate-fade-in" style={{ animationDelay: '500ms' }}>
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
