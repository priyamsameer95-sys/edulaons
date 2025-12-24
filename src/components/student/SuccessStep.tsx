import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, XCircle, Share2, Download, ChevronDown, ChevronUp, Star, AlertTriangle, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LenderCard from './LenderCard';
import { ConfettiAnimation } from './ConfettiAnimation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

const FIT_GROUP_CONFIG = {
  best_fit: {
    label: 'Best Fit',
    description: 'These lenders are excellent matches based on your profile',
    icon: Star,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
  },
  also_consider: {
    label: 'Also Consider',
    description: 'Good options that may have minor trade-offs',
    icon: ThumbsUp,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
  possible_but_risky: {
    label: 'Other Options',
    description: 'May require additional documentation or have stricter criteria',
    icon: AlertCircle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
  },
  not_suitable: {
    label: 'Not Recommended',
    description: 'These lenders may not be the best fit for your profile',
    icon: AlertTriangle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
  },
};

const SuccessStep = ({ caseId, leadId, requestedAmount, recommendedLenders }: SuccessStepProps) => {
  const navigate = useNavigate();
  const [selectedLenderId, setSelectedLenderId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    best_fit: true,
    also_consider: true,
    possible_but_risky: false,
    not_suitable: false,
  });
  
  // Group lenders by fit category
  const groupedLenders = useMemo(() => {
    const groups: Record<string, LenderData[]> = {
      best_fit: [],
      also_consider: [],
      possible_but_risky: [],
      not_suitable: [],
    };
    
    recommendedLenders.forEach(lender => {
      const group = lender.fit_group || (lender.is_preferred ? 'best_fit' : 'also_consider');
      if (groups[group]) {
        groups[group].push(lender);
      } else {
        groups.also_consider.push(lender);
      }
    });
    
    // Sort each group by compatibility score
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => b.compatibility_score - a.compatibility_score);
    });
    
    return groups;
  }, [recommendedLenders]);
  
  const assignedLender = recommendedLenders[0]; // First lender is the assigned one
  const totalLenders = recommendedLenders.length;
  
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const renderLenderSection = (groupKey: string, lenders: LenderData[]) => {
    if (lenders.length === 0) return null;
    
    const config = FIT_GROUP_CONFIG[groupKey as keyof typeof FIT_GROUP_CONFIG];
    const IconComponent = config.icon;
    const isExpanded = expandedSections[groupKey];
    
    return (
      <div key={groupKey} className="space-y-3">
        <Collapsible open={isExpanded} onOpenChange={() => toggleSection(groupKey)}>
          <CollapsibleTrigger asChild>
            <button className={`w-full flex items-center justify-between p-4 rounded-lg border ${config.borderColor} ${config.bgColor} hover:opacity-90 transition-opacity`}>
              <div className="flex items-center gap-3">
                <IconComponent className={`h-5 w-5 ${config.color}`} />
                <div className="text-left">
                  <h3 className="font-semibold flex items-center gap-2">
                    {config.label}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({lenders.length} lender{lenders.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {lenders.map((lender, index) => (
                <div 
                  key={lender.lender_id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 75}ms` }}
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
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Confetti Animation */}
      {showConfetti && <ConfettiAnimation />}

      {/* Success Icon and Message */}
      <div className="text-center space-y-6 animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 animate-scale-in animate-glow">
          <CheckCircle2 className="h-14 w-14 text-success animate-scale-in" style={{ animationDelay: '100ms' }} />
        </div>
        <div className="space-y-3">
          <div className="text-6xl mb-4 animate-scale-in" style={{ animationDelay: '150ms' }}>🎉</div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '200ms' }}>
            Congratulations! Application Submitted
          </h2>
          <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '250ms' }}>
            Your loan application has been successfully submitted
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground">Your Case ID:</p>
            <span className="font-mono font-bold text-xl text-primary animate-shimmer">{caseId}</span>
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
          <h2 className="text-2xl font-bold">Compare All Lenders</h2>
          <p className="text-muted-foreground">
            We've evaluated {totalLenders} lenders based on your profile. 
            Compare their terms and select your preferred lender.
          </p>
          {totalLenders > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {groupedLenders.best_fit.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                  <Star className="h-3 w-3" />
                  {groupedLenders.best_fit.length} Best Fit
                </span>
              )}
              {groupedLenders.also_consider.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <ThumbsUp className="h-3 w-3" />
                  {groupedLenders.also_consider.length} Also Consider
                </span>
              )}
              {groupedLenders.possible_but_risky.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
                  <AlertCircle className="h-3 w-3" />
                  {groupedLenders.possible_but_risky.length} Other Options
                </span>
              )}
            </div>
          )}
        </div>

        {recommendedLenders && recommendedLenders.length > 0 ? (
          <div className="space-y-6">
            {renderLenderSection('best_fit', groupedLenders.best_fit)}
            {renderLenderSection('also_consider', groupedLenders.also_consider)}
            {renderLenderSection('possible_but_risky', groupedLenders.possible_but_risky)}
            {renderLenderSection('not_suitable', groupedLenders.not_suitable)}
            
            {selectedLenderId && (
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg animate-fade-in text-center">
                <p className="text-sm text-success font-medium">
                  ✓ Your lender preference has been saved successfully
                </p>
              </div>
            )}
          </div>
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

      {/* What Happens Next Timeline */}
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
        <h3 className="text-xl font-bold text-center">What Happens Next?</h3>
        <div className="space-y-3">
          <div className="flex gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10 stagger-fade-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
            <div>
              <p className="font-semibold">Within 24 hours: Lender Review</p>
              <p className="text-sm text-muted-foreground">Our partner lenders will review your application</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10 stagger-fade-5">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
            <div>
              <p className="font-semibold">Upload Documents</p>
              <p className="text-sm text-muted-foreground">Complete your application by uploading required documents</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10 stagger-fade-6">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
            <div>
              <p className="font-semibold">Get Approved</p>
              <p className="text-sm text-muted-foreground">Receive your loan approval and fund your education!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center space-y-4 animate-fade-in" style={{ animationDelay: '700ms' }}>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button 
            variant="outline"
            size="lg"
            className="gap-2 hover-lift"
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
            Share Achievement
          </Button>
          <Button 
            variant="outline"
            size="lg"
            className="gap-2 hover-lift"
            onClick={() => toast.info('PDF download feature coming soon!')}
          >
            <Download className="h-4 w-4" />
            Download Summary
          </Button>
        </div>
        <Button 
          onClick={() => navigate('/student')} 
          size="lg"
          className="px-12 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover-lift"
        >
          Go to Dashboard →
        </Button>
      </div>
    </div>
  );
};

export default SuccessStep;