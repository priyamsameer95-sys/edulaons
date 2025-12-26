/**
 * AI Lender Recommendation Component - Smart Design
 * 
 * Per Knowledge Base:
 * - AI suggests lender(s) + rationale + confidence score
 * - Shows BRE factors matched, risk flags, processing time
 * - Grouped sections: Best Fit, Also Consider, Possible but Risky
 * - Admin can accept / override / defer
 * - Never auto-reject or auto-finalize solely by AI
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { 
  Bot, Check, Clock, Sparkles, Building2, AlertCircle, 
  ChevronDown, ChevronRight, AlertTriangle, XCircle,
  Zap, CheckCircle2, RefreshCw, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LenderEvaluation {
  lender_id: string;
  lender_name: string;
  fit_score: number;
  probability_band: 'high' | 'medium' | 'low';
  processing_time_estimate: string;
  justification: string;
  risk_flags: string[];
  bre_rules_matched: string[];
  group: 'best_fit' | 'also_consider' | 'possible_but_risky' | 'not_suitable';
  student_facing_reason?: string;
}

interface InputsSnapshot {
  loan_amount?: number;
  study_destination?: string;
  loan_type?: string;
  loan_classification?: string;
  co_applicant_salary?: number;
  co_applicant_employment?: string;
}

interface AIRecommendationData {
  id: string;
  recommended_lender_ids: string[];
  all_lenders_output: LenderEvaluation[];
  rationale: string;
  confidence_score: number;
  model_version: string;
  created_at: string;
  assignment_mode: string | null;
  accepted_lender_id: string | null;
  inputs_snapshot: InputsSnapshot | null;
  ai_unavailable: boolean | null;
}

interface AILenderRecommendationProps {
  leadId: string;
  currentLenderId: string;
  studyDestination?: string;
  loanAmount?: number;
  onAccept?: (lenderId: string, mode: 'ai' | 'ai_override') => void;
  onDefer?: () => void;
  className?: string;
}

// Helper to compute verdict label
function getVerdict(evaluation: LenderEvaluation): { label: string; variant: 'success' | 'warning' | 'caution' | 'danger' } {
  const { fit_score, risk_flags = [] } = evaluation;
  const hasRisks = risk_flags && risk_flags.length > 0;
  
  if (fit_score >= 80 && !hasRisks) {
    return { label: 'Doable', variant: 'success' };
  } else if (fit_score >= 70) {
    return { label: 'Doable with conditions', variant: 'warning' };
  } else if (fit_score >= 50) {
    return { label: 'Possible but risky', variant: 'caution' };
  } else {
    return { label: 'Not suitable', variant: 'danger' };
  }
}

// Format currency
function formatCurrency(amount: number | undefined): string {
  if (!amount) return 'N/A';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString()}`;
}

export function AILenderRecommendation({
  leadId,
  currentLenderId,
  studyDestination,
  loanAmount,
  onAccept,
  onDefer,
  className,
}: AILenderRecommendationProps) {
  const [recommendation, setRecommendation] = useState<AIRecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    best_fit: true,
    also_consider: false,
    possible_but_risky: false,
    not_suitable: false,
  });
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();
  const { logLenderAssignment } = useAuditLog();

  // Fetch existing recommendation
  useEffect(() => {
    async function fetchRecommendation() {
      try {
        const { data, error } = await supabase
          .from('ai_lender_recommendations')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setRecommendation({
            ...data,
            all_lenders_output: (data.all_lenders_output as unknown as LenderEvaluation[]) || [],
            inputs_snapshot: data.inputs_snapshot as InputsSnapshot | null,
          });
        }
      } catch (err) {
        console.error('Error fetching AI recommendation:', err);
      } finally {
        setLoading(false);
      }
    }

    if (leadId) {
      fetchRecommendation();
    }
  }, [leadId]);

  // Generate new AI recommendation
  const generateRecommendation = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-lender', {
        body: { leadId, studyDestination, loanAmount },
      });

      if (error) throw error;

      if (data?.recommendation) {
        setRecommendation({
          ...data.recommendation,
          all_lenders_output: data.recommendation.all_lenders_output || [],
          inputs_snapshot: data.recommendation.inputs_snapshot || null,
        });
        // Expand best_fit by default
        setExpandedGroups(prev => ({ ...prev, best_fit: true }));
        toast({
          title: 'AI Analysis Complete',
          description: `Evaluated ${data.recommendation.all_lenders_output?.length || 0} lenders`,
        });
      }
    } catch (err) {
      console.error('Error generating recommendation:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate AI recommendation',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  // Accept a specific lender recommendation
  const acceptLender = async (lenderId: string, isTopPick: boolean) => {
    setAccepting(lenderId);
    try {
      const mode = isTopPick ? 'ai' : 'ai_override';
      
      await logLenderAssignment({
        leadId,
        oldLenderId: currentLenderId,
        newLenderId: lenderId,
        assignmentMode: mode,
        aiConfidence: recommendation?.confidence_score,
        reason: `Accepted AI ${isTopPick ? 'top recommendation' : 'alternative recommendation'}`,
      });

      if (recommendation?.id) {
        await supabase
          .from('ai_lender_recommendations')
          .update({
            accepted_lender_id: lenderId,
            assignment_mode: mode,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', recommendation.id);
      }

      onAccept?.(lenderId, mode);

      toast({
        title: 'Lender Assigned',
        description: `AI ${isTopPick ? 'recommendation' : 'alternative'} accepted`,
      });
    } catch (err) {
      console.error('Error accepting lender:', err);
      toast({
        title: 'Error',
        description: 'Failed to assign lender',
        variant: 'destructive',
      });
    } finally {
      setAccepting(null);
    }
  };

  const handleDefer = () => {
    onDefer?.();
    toast({
      title: 'Decision Deferred',
      description: 'You can revisit the AI recommendation later',
    });
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleCard = (lenderId: string) => {
    setExpandedCards(prev => ({ ...prev, [lenderId]: !prev[lenderId] }));
  };

  // Group lenders
  const getGroupedLenders = () => {
    const all = recommendation?.all_lenders_output || [];
    return {
      best_fit: all.filter(e => e.group === 'best_fit'),
      also_consider: all.filter(e => e.group === 'also_consider'),
      possible_but_risky: all.filter(e => e.group === 'possible_but_risky'),
      not_suitable: all.filter(e => e.group === 'not_suitable'),
    };
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="pb-3">
          <div className="h-5 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // If already assigned via AI
  if (recommendation?.assignment_mode) {
    return (
      <Card className={cn("border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              AI Recommendation Applied
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Lender assigned via {recommendation.assignment_mode === 'ai' ? 'AI recommendation' : 'AI alternative'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // No recommendation yet
  if (!recommendation) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">AI Lender Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            AI will analyze all lenders against BRE rules and applicant profile
          </p>
          <Button 
            onClick={generateRecommendation} 
            disabled={generating}
            variant="default"
            className="w-full"
          >
            {generating ? (
              <>
                <Bot className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Lenders...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const grouped = getGroupedLenders();
  const topLender = grouped.best_fit[0] || grouped.also_consider[0];
  const inputs = recommendation.inputs_snapshot;
  const needsHumanReview = (recommendation.confidence_score || 0) < 70;

  // Render a single lender card
  const renderLenderCard = (evaluation: LenderEvaluation, isTopPick: boolean = false) => {
    const verdict = getVerdict(evaluation);
    const isExpanded = expandedCards[evaluation.lender_id];
    
    return (
      <div 
        key={evaluation.lender_id}
        className={cn(
          "rounded-lg border transition-all",
          isTopPick 
            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" 
            : "bg-card"
        )}
      >
        {/* Main Row */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Lender Name + Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-sm">{evaluation.lender_name}</span>
                </div>
                {isTopPick && (
                  <Badge className="bg-emerald-500 text-white text-[10px] h-4">
                    Top Pick
                  </Badge>
                )}
                {evaluation.processing_time_estimate && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Zap className="h-3 w-3" />
                    {evaluation.processing_time_estimate}
                  </span>
                )}
              </div>

              {/* Fit Score Progress */}
              <div className="mt-2 flex items-center gap-2">
                <Progress 
                  value={evaluation.fit_score} 
                  className={cn(
                    "h-2 flex-1",
                    evaluation.fit_score >= 80 ? "[&>div]:bg-emerald-500" :
                    evaluation.fit_score >= 60 ? "[&>div]:bg-amber-500" :
                    "[&>div]:bg-orange-500"
                  )}
                />
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] h-5 font-semibold shrink-0",
                    evaluation.probability_band === 'high' && "border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50",
                    evaluation.probability_band === 'medium' && "border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/50",
                    evaluation.probability_band === 'low' && "border-orange-500 text-orange-700 bg-orange-50 dark:bg-orange-950/50"
                  )}
                >
                  {evaluation.fit_score}%
                </Badge>
              </div>

              {/* One-Line Verdict */}
              <div className="mt-2 flex items-center gap-1.5">
                {verdict.variant === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                {verdict.variant === 'warning' && <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                {verdict.variant === 'caution' && <AlertTriangle className="h-3.5 w-3.5 text-orange-600 shrink-0" />}
                {verdict.variant === 'danger' && <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />}
                <span className={cn(
                  "text-xs font-medium",
                  verdict.variant === 'success' && "text-emerald-700 dark:text-emerald-400",
                  verdict.variant === 'warning' && "text-amber-700 dark:text-amber-400",
                  verdict.variant === 'caution' && "text-orange-700 dark:text-orange-400",
                  verdict.variant === 'danger' && "text-red-700 dark:text-red-400"
                )}>
                  {verdict.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  — {evaluation.student_facing_reason || evaluation.justification.slice(0, 60)}
                </span>
              </div>
            </div>

            {/* Accept Button */}
            <Button
              size="sm"
              variant={isTopPick ? "default" : "outline"}
              onClick={() => acceptLender(evaluation.lender_id, isTopPick)}
              disabled={accepting !== null}
              className="shrink-0"
            >
              {accepting === evaluation.lender_id ? (
                <Bot className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              <span className="ml-1 text-xs">Accept</span>
            </Button>
          </div>

          {/* Toggle BRE Details */}
          <button 
            onClick={() => toggleCard(evaluation.lender_id)}
            className="mt-2 text-xs text-primary flex items-center gap-1 hover:underline"
          >
            <Eye className="h-3 w-3" />
            {isExpanded ? 'Hide' : 'Show'} BRE Factors
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        </div>

        {/* Expanded BRE Details */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-0 border-t bg-muted/30">
            <div className="mt-2 space-y-1.5">
              {/* Matched Rules */}
              {evaluation.bre_rules_matched?.map((rule, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{rule}</span>
                </div>
              ))}
              
              {/* Risk Flags */}
              {evaluation.risk_flags?.map((flag, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-amber-700 dark:text-amber-400">{flag}</span>
                </div>
              ))}

              {/* Full Justification */}
              {evaluation.justification && (
                <div className="mt-2 p-2 bg-background rounded text-xs text-muted-foreground italic">
                  "{evaluation.justification}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render group section
  const renderGroupSection = (
    groupKey: string,
    title: string,
    icon: React.ReactNode,
    lenders: LenderEvaluation[],
    accentClass: string
  ) => {
    if (lenders.length === 0) return null;
    
    const isExpanded = expandedGroups[groupKey];
    const isTopPickGroup = groupKey === 'best_fit';

    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(groupKey)}>
        <CollapsibleTrigger className={cn(
          "w-full flex items-center justify-between p-2 rounded-lg transition-colors",
          accentClass
        )}>
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
            <Badge variant="secondary" className="text-[10px] h-4">
              {lenders.length}
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {lenders.map((lender, idx) => 
            renderLenderCard(lender, isTopPickGroup && idx === 0)
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card className={cn("", className)}>
      {/* Smart Summary Header */}
      <CardHeader className="pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">AI Lender Analysis</CardTitle>
          </div>
          <Badge 
            variant="outline"
            className={cn(
              "text-xs",
              (recommendation.confidence_score || 0) >= 80 
                ? "border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50"
                : (recommendation.confidence_score || 0) >= 60 
                  ? "border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/50"
                  : "border-orange-500 text-orange-700 bg-orange-50 dark:bg-orange-950/50"
            )}
          >
            {recommendation.confidence_score || 0}% Confidence
          </Badge>
        </div>

        {/* Key Inputs Used */}
        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          {inputs?.loan_amount && (
            <Badge variant="secondary" className="text-[10px] h-5 font-normal">
              {formatCurrency(inputs.loan_amount)} {inputs.loan_classification || 'Loan'}
            </Badge>
          )}
          {inputs?.study_destination && (
            <Badge variant="secondary" className="text-[10px] h-5 font-normal">
              {inputs.study_destination}
            </Badge>
          )}
          {inputs?.co_applicant_employment && (
            <Badge variant="secondary" className="text-[10px] h-5 font-normal">
              {inputs.co_applicant_employment} Co-applicant
            </Badge>
          )}
          {inputs?.co_applicant_salary && (
            <Badge variant="secondary" className="text-[10px] h-5 font-normal">
              {formatCurrency(inputs.co_applicant_salary)}/mo
            </Badge>
          )}
        </div>

        {/* Human Review Flag */}
        {needsHumanReview && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded">
            <AlertTriangle className="h-3 w-3" />
            Needs Human Review — confidence below 70%
          </div>
        )}

        {/* Model Info */}
        <p className="text-[10px] text-muted-foreground">
          Model: {recommendation.model_version} • {new Date(recommendation.created_at).toLocaleDateString()}
          {recommendation.ai_unavailable && " • Rule-based fallback"}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Grouped Sections */}
        {renderGroupSection(
          'best_fit',
          'Best Fit',
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
          grouped.best_fit,
          'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'
        )}

        {renderGroupSection(
          'also_consider',
          'Also Consider',
          <AlertCircle className="h-4 w-4 text-blue-600" />,
          grouped.also_consider,
          'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50'
        )}

        {renderGroupSection(
          'possible_but_risky',
          'Possible but Risky',
          <AlertTriangle className="h-4 w-4 text-amber-600" />,
          grouped.possible_but_risky,
          'bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50'
        )}

        {renderGroupSection(
          'not_suitable',
          'Not Suitable',
          <XCircle className="h-4 w-4 text-red-500" />,
          grouped.not_suitable,
          'bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50'
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDefer}
            className="flex-1"
          >
            <Clock className="mr-1 h-3 w-3" />
            Defer
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateRecommendation}
            disabled={generating}
            className="flex-1"
          >
            <RefreshCw className={cn("mr-1 h-3 w-3", generating && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Human-in-the-loop notice */}
        <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg border">
          <AlertCircle className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            AI suggestions require human approval. Final lender assignment is always your decision.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AILenderRecommendation;
