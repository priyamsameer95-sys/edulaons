/**
 * AI Lender Recommendation Component - Redesigned Clean UI
 * 
 * Per Knowledge Base:
 * - AI suggests lender(s) + rationale + confidence score
 * - 4-Layer System: Translator → Bouncer → Strategist → Scorer
 * - 3-Pillar Evaluation: Future Earnings + Financial Security + Past Record
 * - Shows context banner with tier, zone, strategy
 * - Admin can accept / override / defer
 * - Override requires mandatory reason stored in ai_override_feedback
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAuth } from '@/hooks/useAuth';
import { 
  Bot, Check, Clock, Sparkles, Building2, AlertCircle, 
  ChevronDown, ChevronRight, AlertTriangle, XCircle,
  Zap, CheckCircle2, RefreshCw, Star, Lock, TrendingUp,
  GraduationCap, Wallet, History, Target, Brain, 
  Percent, ArrowRight, Columns, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 3-Pillar Score Interface
interface PillarScores {
  future_earnings: number;
  financial_security: number;
  past_record: number;
  weighted_academic?: number;
  compensation_bonus?: number;
}

interface StudentFacingReason {
  greeting: string;
  confidence: string;
  cta: string;
}

interface UniversityBoost {
  type: 'premium' | 'ranked' | 'none';
  amount: number;
  details: string;
  duplicate_detected: boolean;
  ranked_tier: number | null;
}

interface TieBreakerInfo {
  applied: boolean;
  criteria: string;
  value: number | string;
}

interface LenderEvaluation {
  lender_id: string;
  lender_name: string;
  score?: number;
  fit_score?: number;
  probability_band?: 'high' | 'medium' | 'low';
  processing_time_estimate?: string;
  reason?: string;
  justification?: string;
  risk_flags?: string[];
  fit_factors?: string[];
  bre_rules_matched?: string[];
  group?: 'best_fit' | 'also_consider' | 'possible_but_risky' | 'not_suitable';
  status?: 'BEST_FIT' | 'GOOD_FIT' | 'WORTH_EXPLORING' | 'LOCKED';
  student_facing_reason?: StudentFacingReason | string | null;
  trade_offs?: string[];
  trade_off?: string;
  pillar_scores?: PillarScores;
  pillar_breakdown?: { future?: { score: number }; financial?: { score: number }; past?: { score: number } };
  strategic_adjustment?: number;
  knockout_penalty?: number;
  is_locked?: boolean;
  unlock_hint?: string;
  interest_rate_display?: string;
  loan_range_display?: string;
  badges?: string[];
  rank?: number;
  university_boost?: UniversityBoost;
  tie_breaker?: TieBreakerInfo;
}

// Normalize evaluation data from new/old engine format
function normalizeEvaluation(evaluation: LenderEvaluation) {
  const effectiveScore = evaluation.score ?? evaluation.fit_score ?? 0;
  const effectiveReason = evaluation.reason ?? evaluation.justification ?? '';
  const effectiveFactors = evaluation.fit_factors ?? evaluation.bre_rules_matched ?? [];
  const effectiveTradeOffs = evaluation.trade_offs ?? (evaluation.trade_off ? [evaluation.trade_off] : []);
  
  let effectiveGroup = evaluation.group;
  if (!effectiveGroup && evaluation.status) {
    const statusToGroup: Record<string, 'best_fit' | 'also_consider' | 'possible_but_risky' | 'not_suitable'> = {
      'BEST_FIT': 'best_fit',
      'GOOD_FIT': 'also_consider',
      'WORTH_EXPLORING': 'possible_but_risky',
      'LOCKED': 'not_suitable',
    };
    effectiveGroup = statusToGroup[evaluation.status] ?? 'not_suitable';
  }
  
  let effectivePillarScores = evaluation.pillar_scores;
  if (!effectivePillarScores && evaluation.pillar_breakdown) {
    effectivePillarScores = {
      future_earnings: evaluation.pillar_breakdown.future?.score ?? 0,
      financial_security: evaluation.pillar_breakdown.financial?.score ?? 0,
      past_record: evaluation.pillar_breakdown.past?.score ?? 0,
    };
  }
  
  let effectiveProbabilityBand = evaluation.probability_band;
  if (!effectiveProbabilityBand) {
    if (effectiveScore >= 80) effectiveProbabilityBand = 'high';
    else if (effectiveScore >= 50) effectiveProbabilityBand = 'medium';
    else effectiveProbabilityBand = 'low';
  }
  
  return {
    ...evaluation,
    effectiveScore,
    effectiveReason,
    effectiveFactors,
    effectiveTradeOffs,
    effectiveGroup,
    effectivePillarScores,
    effectiveProbabilityBand,
  };
}

interface InputsSnapshot {
  loan_amount?: number;
  study_destination?: string;
  loan_type?: string;
  loan_classification?: string;
  co_applicant_salary?: number;
  co_applicant_employment?: string;
}

interface RecommendationContext {
  university_tier?: string;
  urgency_zone?: string;
  days_until_intake?: number;
  strategy?: string;
  weighted_academic_score?: number;
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
  recommendation_context: RecommendationContext | null;
  version: number | null;
  urgency_zone: string | null;
  student_tier: string | null;
  strategy: string | null;
  override_reason: string | null;
  pillar_scores: Record<string, PillarScores> | null;
  all_lender_scores: unknown[] | null;
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

// Generate personalized AI insight for a lender
function generateAIInsight(
  evaluation: LenderEvaluation,
  isTopPick: boolean,
  context?: { universityName?: string; testScore?: string }
): string {
  const factors = evaluation.fit_factors ?? evaluation.bre_rules_matched ?? [];
  const score = evaluation.score ?? evaluation.fit_score ?? 0;
  const boost = evaluation.university_boost;
  
  // Top pick gets more detailed insight
  if (isTopPick) {
    if (boost?.type === 'premium') {
      return 'Your university is on their premium partner list — priority processing and better rates.';
    }
    if (factors.some(f => f.toLowerCase().includes('collateral'))) {
      return 'Strong fit with secured loan option. Your collateral profile unlocks better terms.';
    }
    if (factors.some(f => f.toLowerCase().includes('income') || f.toLowerCase().includes('salary'))) {
      return 'Income profile aligns well. High approval probability based on co-applicant strength.';
    }
    return 'Best overall match based on your profile, destination, and loan requirements.';
  }
  
  // Secondary lenders get shorter insights
  if (boost?.type === 'ranked') {
    return 'University ranks well with this lender. Worth exploring as backup.';
  }
  if (factors.some(f => f.toLowerCase().includes('fast') || f.toLowerCase().includes('processing'))) {
    return 'Faster processing times if you need quick disbursement.';
  }
  if (factors.some(f => f.toLowerCase().includes('collateral'))) {
    return 'Good alternative if you have a co-signer with 750+ CIBIL score.';
  }
  if (score >= 70) {
    return 'Solid option with competitive rates. Review specific terms.';
  }
  return 'Consider if primary options don\'t work out. May need additional documentation.';
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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showAllLenders, setShowAllLenders] = useState(false);
  
  // Override modal state
  const [overrideModal, setOverrideModal] = useState<{ open: boolean; lenderId: string | null; lenderName: string }>({
    open: false,
    lenderId: null,
    lenderName: ''
  });
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { logLenderAssignment } = useAuditLog();
  const { user, appUser } = useAuth();
  const userRole = appUser?.role;

  // Fetch existing recommendation
  useEffect(() => {
    async function fetchRecommendation() {
      try {
        const { data, error } = await supabase
          .from('ai_lender_recommendations')
          .select('*')
          .eq('lead_id', leadId)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setRecommendation({
            ...data,
            all_lenders_output: (data.all_lenders_output as unknown as LenderEvaluation[]) || [],
            inputs_snapshot: data.inputs_snapshot as unknown as InputsSnapshot | null,
            recommendation_context: data.recommendation_context as unknown as RecommendationContext | null,
            pillar_scores: data.pillar_scores as unknown as Record<string, PillarScores> | null,
            all_lender_scores: data.all_lender_scores as unknown[] | null,
            override_reason: (data as Record<string, unknown>).override_reason as string | null,
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
          inputs_snapshot: data.recommendation.inputs_snapshot as unknown as InputsSnapshot | null,
          recommendation_context: data.recommendation.recommendation_context as unknown as RecommendationContext | null,
          pillar_scores: data.recommendation.pillar_scores as unknown as Record<string, PillarScores> | null,
          all_lender_scores: data.recommendation.all_lender_scores as unknown[] | null,
          override_reason: data.recommendation.override_reason || null,
        });
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

  // Accept a specific lender recommendation (top pick)
  const acceptLender = async (lenderId: string, isTopPick: boolean) => {
    if (!isTopPick) {
      const lender = recommendation?.all_lenders_output.find(l => l.lender_id === lenderId);
      setOverrideModal({
        open: true,
        lenderId,
        lenderName: lender?.lender_name || 'Selected Lender'
      });
      return;
    }

    setAccepting(lenderId);
    try {
      await logLenderAssignment({
        leadId,
        oldLenderId: currentLenderId,
        newLenderId: lenderId,
        assignmentMode: 'ai',
        aiConfidence: recommendation?.confidence_score,
        reason: 'Accepted AI top recommendation',
      });

      if (recommendation?.id) {
        await supabase
          .from('ai_lender_recommendations')
          .update({
            accepted_lender_id: lenderId,
            assignment_mode: 'ai',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id,
            reviewed_by_role: userRole,
            decision: 'accepted',
          })
          .eq('id', recommendation.id);
      }

      onAccept?.(lenderId, 'ai');

      toast({
        title: 'Lender Assigned',
        description: 'AI recommendation accepted',
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

  // Handle override with reason
  const handleOverrideSubmit = async () => {
    if (!overrideModal.lenderId || !overrideReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for overriding the AI recommendation',
        variant: 'destructive',
      });
      return;
    }

    setOverrideSubmitting(true);
    try {
      const topLender = recommendation?.all_lenders_output.find(l => 
        l.group === 'best_fit' || l.status === 'BEST_FIT'
      );
      const chosenLender = recommendation?.all_lenders_output.find(l => l.lender_id === overrideModal.lenderId);
      
      const getScore = (lender: LenderEvaluation | undefined) => lender?.score ?? lender?.fit_score ?? 0;
      
      await supabase.from('ai_override_feedback').insert({
        lead_id: leadId,
        recommendation_id: recommendation?.id,
        original_lender_id: topLender?.lender_id,
        overridden_to_lender_id: overrideModal.lenderId,
        override_reason: overrideReason,
        overridden_by: user?.id,
        overridden_by_role: userRole,
        context_snapshot: {
          confidence_score: recommendation?.confidence_score,
          top_lender_score: getScore(topLender),
          chosen_lender_score: getScore(chosenLender),
        },
      });

      await logLenderAssignment({
        leadId,
        oldLenderId: currentLenderId,
        newLenderId: overrideModal.lenderId,
        assignmentMode: 'ai_override',
        aiConfidence: recommendation?.confidence_score,
        reason: overrideReason,
      });

      if (recommendation?.id) {
        await supabase
          .from('ai_lender_recommendations')
          .update({
            accepted_lender_id: overrideModal.lenderId,
            assignment_mode: 'ai_override',
            override_reason: overrideReason,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id,
            reviewed_by_role: userRole,
            decision: 'overridden',
          })
          .eq('id', recommendation.id);
      }

      onAccept?.(overrideModal.lenderId, 'ai_override');

      toast({
        title: 'Lender Assigned',
        description: 'AI will learn from this choice to improve future recommendations',
      });

      setOverrideModal({ open: false, lenderId: null, lenderName: '' });
      setOverrideReason('');
    } catch (err) {
      console.error('Error overriding:', err);
      toast({
        title: 'Error',
        description: 'Failed to save override',
        variant: 'destructive',
      });
    } finally {
      setOverrideSubmitting(false);
    }
  };

  // Get sorted lenders for display
  const getSortedLenders = () => {
    const all = recommendation?.all_lenders_output || [];
    
    const isInGroup = (e: LenderEvaluation, group: string, status: string) => 
      e.group === group || e.status === status;
    
    const bestFit = all.filter(e => isInGroup(e, 'best_fit', 'BEST_FIT'));
    const alsoConsider = all.filter(e => isInGroup(e, 'also_consider', 'GOOD_FIT'));
    const others = all.filter(e => 
      !isInGroup(e, 'best_fit', 'BEST_FIT') && 
      !isInGroup(e, 'also_consider', 'GOOD_FIT') &&
      !e.is_locked
    );
    
    return [...bestFit, ...alsoConsider, ...others].filter(e => !e.is_locked);
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-6">
          <div className="h-5 bg-muted rounded w-48 mb-4" />
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // If already assigned via AI
  if (recommendation?.assignment_mode) {
    return (
      <Card className={cn("border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              AI Recommendation Applied
            </span>
          </div>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-4">
            Lender assigned via {recommendation.assignment_mode === 'ai' ? 'AI recommendation' : 'AI override'}
            {recommendation.assignment_mode === 'ai_override' && recommendation.override_reason && (
              <span className="block mt-1 text-muted-foreground">
                Reason: {recommendation.override_reason}
              </span>
            )}
          </p>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateRecommendation}
              disabled={generating}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", generating && "animate-spin")} />
              Re-evaluate
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDefer}
            >
              Change Manually
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No recommendation yet
  if (!recommendation) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="p-6 text-center">
          <Bot className="h-10 w-10 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">AI Lender Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get smart recommendations based on profile, university, and loan requirements
          </p>
          <Button 
            onClick={generateRecommendation} 
            disabled={generating}
          >
            {generating ? (
              <>
                <Bot className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
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

  const sortedLenders = getSortedLenders();
  const topLender = sortedLenders[0];
  const alternatives = sortedLenders.slice(1, showAllLenders ? undefined : 3);
  const hasMoreLenders = sortedLenders.length > 3;
  const inputs = recommendation.inputs_snapshot;
  const confidenceScore = recommendation.confidence_score || 0;

  // Top Pick Card Component
  const TopPickCard = ({ lender }: { lender: LenderEvaluation }) => {
    const normalized = normalizeEvaluation(lender);
    const insight = generateAIInsight(lender, true);
    const isExpanded = expandedCard === lender.lender_id;
    
    return (
      <div className="rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 overflow-hidden">
        {/* Top Banner */}
        <div className="bg-emerald-500 dark:bg-emerald-600 text-white px-4 py-2 flex items-center gap-2">
          <Star className="h-4 w-4 fill-current" />
          <span className="text-sm font-semibold">AI RECOMMENDED • BEST FIT</span>
        </div>
        
        <div className="p-4">
          {/* Lender Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-white dark:bg-gray-800 border flex items-center justify-center shadow-sm">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{lender.lender_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {lender.processing_time_estimate || 'Standard Processing'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-600">{normalized.effectiveScore}%</div>
              <div className="text-xs text-muted-foreground">Match Score</div>
            </div>
          </div>

          {/* Why this is your top pick */}
          <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 mb-4 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-start gap-2">
              <Brain className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Why this is your top pick</p>
                <p className="text-sm text-muted-foreground">{insight}</p>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Percent className="h-3.5 w-3.5" />
                <span className="text-xs">Interest Rate</span>
              </div>
              <div className="font-bold text-lg">{lender.interest_rate_display || '8-12%'}</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Wallet className="h-3.5 w-3.5" />
                <span className="text-xs">Max Amount</span>
              </div>
              <div className="font-bold text-lg">{lender.loan_range_display || '₹1.5 Cr'}</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">Tenure</span>
              </div>
              <div className="font-bold text-lg">Up to 15 yrs</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-xs">Approval Chance</span>
              </div>
              <div className={cn(
                "font-bold text-lg",
                normalized.effectiveProbabilityBand === 'high' && "text-emerald-600",
                normalized.effectiveProbabilityBand === 'medium' && "text-amber-600",
                normalized.effectiveProbabilityBand === 'low' && "text-orange-600"
              )}>
                {normalized.effectiveProbabilityBand === 'high' ? 'High' : normalized.effectiveProbabilityBand === 'medium' ? 'Medium' : 'Low'}
              </div>
            </div>
          </div>

          {/* University Boost Badge */}
          {lender.university_boost && lender.university_boost.type !== 'none' && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm",
              lender.university_boost.type === 'premium' 
                ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                : "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
            )}>
              {lender.university_boost.type === 'premium' ? (
                <Star className="h-4 w-4 text-amber-600 fill-amber-500" />
              ) : (
                <GraduationCap className="h-4 w-4 text-blue-600" />
              )}
              <span className={cn(
                "font-medium",
                lender.university_boost.type === 'premium' ? "text-amber-700" : "text-blue-700"
              )}>
                {lender.university_boost.type === 'premium' ? 'Premium University Partner' : `Ranked Tier ${lender.university_boost.ranked_tier}`}
              </span>
              <Badge variant="secondary" className="ml-auto text-xs">
                +{lender.university_boost.amount} pts
              </Badge>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => acceptLender(lender.lender_id, true)}
              disabled={accepting !== null}
            >
              {accepting === lender.lender_id ? (
                <Bot className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Start Application
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* View Details Link */}
          <button 
            onClick={() => setExpandedCard(isExpanded ? null : lender.lender_id)}
            className="w-full mt-3 text-sm text-primary hover:underline flex items-center justify-center gap-1"
          >
            {isExpanded ? 'Hide Details' : 'View Full Details'}
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Costs Covered
              </h4>
              <div className="flex flex-wrap gap-2">
                {['Tuition Fees', 'Living Expenses', 'Travel Costs', 'Books & Equipment', 'Health Insurance'].map((expense, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal">
                    {expense}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Alternative Lender Card Component
  const LenderCard = ({ lender, index }: { lender: LenderEvaluation; index: number }) => {
    const normalized = normalizeEvaluation(lender);
    const insight = generateAIInsight(lender, false);
    
    return (
      <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="p-4 flex flex-col flex-1">
          {/* Lender Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted border flex items-center justify-center">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{lender.lender_name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Option {index + 2}
                  </Badge>
                  {lender.tie_breaker?.applied && (
                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      ↑ {lender.tie_breaker.criteria.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{normalized.effectiveScore}%</div>
              <div className="text-xs text-muted-foreground">Match</div>
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-muted/50 rounded-lg p-2.5 mb-3 flex items-start gap-2">
            <Brain className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">{insight}</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-muted/50 rounded px-2.5 py-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Interest</div>
              <div className="text-sm font-semibold">{lender.interest_rate_display || '8-12%'}</div>
            </div>
            <div className="bg-muted/50 rounded px-2.5 py-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Max Amount</div>
              <div className="text-sm font-semibold">{lender.loan_range_display || '₹1.5 Cr'}</div>
            </div>
            <div className="bg-muted/50 rounded px-2.5 py-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Tenure</div>
              <div className="text-sm font-semibold">Up to 15 yrs</div>
            </div>
            <div className="bg-muted/50 rounded px-2.5 py-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Approval</div>
              <div className={cn(
                "text-sm font-semibold",
                normalized.effectiveProbabilityBand === 'high' && "text-emerald-600",
                normalized.effectiveProbabilityBand === 'medium' && "text-amber-600",
                normalized.effectiveProbabilityBand === 'low' && "text-orange-600"
              )}>
                {normalized.effectiveProbabilityBand === 'high' ? 'High' : normalized.effectiveProbabilityBand === 'medium' ? 'Medium' : 'Low'}
              </div>
            </div>
          </div>

          {/* View Details Toggle */}
          <button 
            onClick={() => setExpandedCard(expandedCard === lender.lender_id ? null : lender.lender_id)}
            className="w-full text-sm text-primary hover:underline flex items-center justify-center gap-1 py-2"
          >
            {expandedCard === lender.lender_id ? 'Hide Details' : 'View Details'}
            {expandedCard === lender.lender_id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {/* Expanded Details */}
          {expandedCard === lender.lender_id && (
            <div className="pt-3 border-t space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Costs Covered
              </h4>
              <div className="flex flex-wrap gap-2">
                {['Tuition Fees', 'Living Expenses', 'Travel Costs', 'Books & Equipment', 'Health Insurance'].map((expense, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal bg-emerald-50 text-emerald-700">
                    {expense}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Select Button - pushed to bottom */}
          <div className="mt-auto pt-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => acceptLender(lender.lender_id, false)}
              disabled={accepting !== null}
            >
              {accepting === lender.lender_id ? (
                <Bot className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Select Lender
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary text-primary-foreground text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI ANALYSIS COMPLETE
              </Badge>
              <Badge variant="outline" className="text-xs">
                v{recommendation.model_version}
              </Badge>
            </div>
            <h2 className="text-xl font-bold">
              We found {sortedLenders.length} lender{sortedLenders.length !== 1 ? 's' : ''} matching your profile
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {inputs?.study_destination && `${inputs.study_destination} • `}
              {inputs?.loan_amount && `${formatCurrency(inputs.loan_amount)} loan`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center px-4 py-2 bg-muted rounded-lg">
              <div className={cn(
                "text-2xl font-bold",
                confidenceScore >= 80 ? "text-emerald-600" :
                confidenceScore >= 60 ? "text-amber-600" : "text-orange-600"
              )}>
                {confidenceScore}%
              </div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={generateRecommendation}
              disabled={generating}
            >
              <RefreshCw className={cn("h-4 w-4", generating && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Low Confidence Warning */}
        {confidenceScore < 70 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <span className="font-medium">Needs Human Review</span> — AI confidence is below 70%. Please verify recommendations carefully.
            </p>
          </div>
        )}

        {/* Lender Cards Grid */}
        {topLender && (
          <div className="space-y-4">
            {/* Top Pick */}
            <TopPickCard lender={topLender} />

            {/* Alternative Options */}
            {alternatives.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  OTHER OPTIONS TO CONSIDER
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alternatives.map((lender, index) => (
                    <LenderCard key={lender.lender_id} lender={lender} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Show More Button */}
            {hasMoreLenders && !showAllLenders && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowAllLenders(true)}
              >
                Show {sortedLenders.length - 3} more lender{sortedLenders.length - 3 !== 1 ? 's' : ''}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}

        {/* Compare Bar */}
        {sortedLenders.length > 1 && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm">
              <Columns className="h-4 w-4 text-muted-foreground" />
              <span>Compare {sortedLenders.length} offers side-by-side</span>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Compare Now
            </Button>
          </div>
        )}

        {/* Human-in-the-loop notice */}
        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            AI suggestions require human approval. Final lender assignment is always your decision.
          </p>
        </div>
      </div>

      {/* Override Reason Modal */}
      <Dialog open={overrideModal.open} onOpenChange={(open) => !open && setOverrideModal({ open: false, lenderId: null, lenderName: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Override AI Recommendation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              You're choosing <span className="font-semibold text-foreground">{overrideModal.lenderName}</span> instead of the AI's top recommendation.
            </p>
            <div>
              <label className="text-sm font-medium">Why are you overriding? (Required)</label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Student has existing relationship with this lender, specific loan features needed..."
                className="mt-2"
                rows={3}
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                AI will learn from this choice to improve future recommendations for similar cases.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideModal({ open: false, lenderId: null, lenderName: '' })}>
              Cancel
            </Button>
            <Button onClick={handleOverrideSubmit} disabled={overrideSubmitting || !overrideReason.trim()}>
              {overrideSubmitting ? (
                <Bot className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirm Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AILenderRecommendation;
