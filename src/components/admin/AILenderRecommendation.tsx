/**
 * AI Lender Recommendation Component - 4-Layer Smart Engine
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAuth } from '@/hooks/useAuth';
import { 
  Bot, Check, Clock, Sparkles, Building2, AlertCircle, 
  ChevronDown, ChevronRight, AlertTriangle, XCircle,
  Zap, CheckCircle2, RefreshCw, Star, Lock, TrendingUp,
  GraduationCap, Wallet, History, Target, Brain, Settings,
  Percent, ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HumanizedFactorCard, ScoreInsight, ProTipBanner } from './lender-recommendation';
import { groupAndHumanizeFactors, generateProTip } from '@/constants/breHumanizer';
import { UrgencyZoneBadge } from '@/components/shared/UrgencyZoneBadge';
import { TierBadge } from '@/components/shared/TierBadge';

// 3-Pillar Score Interface
interface PillarScores {
  future_earnings: number;
  financial_security: number;
  past_record: number;
  weighted_academic?: number;
  compensation_bonus?: number;
}

// Lender score from 4-layer engine
interface LenderScore {
  lender_id: string;
  lender_name: string;
  final_score: number;
  pillar_scores: PillarScores;
  strategic_adjustment: number;
  knockout_penalty: number;
  knockout_reasons: string[];
  is_locked: boolean;
  unlock_hint?: string;
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

interface LenderEvaluation {
  lender_id: string;
  lender_name: string;
  // New engine uses "score", old used "fit_score" - support both
  score?: number;
  fit_score?: number;
  probability_band?: 'high' | 'medium' | 'low';
  processing_time_estimate?: string;
  // New engine uses "reason", old used "justification" - support both
  reason?: string;
  justification?: string;
  risk_flags?: string[];
  // New engine uses "fit_factors", old used "bre_rules_matched" - support both
  fit_factors?: string[];
  bre_rules_matched?: string[];
  group?: 'best_fit' | 'also_consider' | 'possible_but_risky' | 'not_suitable';
  // New engine uses "status" for grouping
  status?: 'BEST_FIT' | 'GOOD_FIT' | 'WORTH_EXPLORING' | 'LOCKED';
  student_facing_reason?: StudentFacingReason | string | null;
  trade_offs?: string[];
  trade_off?: string; // New engine uses singular
  pillar_scores?: PillarScores;
  pillar_breakdown?: { future?: { score: number }; financial?: { score: number }; past?: { score: number } };
  strategic_adjustment?: number;
  knockout_penalty?: number;
  is_locked?: boolean;
  unlock_hint?: string;
  // Display fields from new engine
  interest_rate_display?: string;
  loan_range_display?: string;
  badges?: string[];
  rank?: number;
  // University boost scoring details
  university_boost?: UniversityBoost;
}

// Normalize evaluation data from new/old engine format
function normalizeEvaluation(evaluation: LenderEvaluation) {
  const effectiveScore = evaluation.score ?? evaluation.fit_score ?? 0;
  const effectiveReason = evaluation.reason ?? evaluation.justification ?? '';
  const effectiveFactors = evaluation.fit_factors ?? evaluation.bre_rules_matched ?? [];
  const effectiveTradeOffs = evaluation.trade_offs ?? (evaluation.trade_off ? [evaluation.trade_off] : []);
  
  // Normalize group from status if needed
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
  
  // Normalize pillar_scores from pillar_breakdown
  let effectivePillarScores = evaluation.pillar_scores;
  if (!effectivePillarScores && evaluation.pillar_breakdown) {
    effectivePillarScores = {
      future_earnings: evaluation.pillar_breakdown.future?.score ?? 0,
      financial_security: evaluation.pillar_breakdown.financial?.score ?? 0,
      past_record: evaluation.pillar_breakdown.past?.score ?? 0,
    };
  }
  
  // Determine probability band from score if not provided
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
  all_lender_scores: LenderScore[] | null;
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

// Strategy display labels
const strategyLabels: Record<string, { label: string; icon: typeof Target; color: string }> = {
  'speed': { label: 'Prioritizing Speed', icon: Zap, color: 'text-orange-600' },
  'cost': { label: 'Optimizing for Cost', icon: Wallet, color: 'text-emerald-600' },
  'balanced': { label: 'Balanced Approach', icon: Target, color: 'text-blue-600' },
};

// Helper to compute verdict label - uses normalized score
function getVerdict(score: number, riskFlags: string[] = []): { label: string; variant: 'success' | 'warning' | 'caution' | 'danger'; description: string } {
  const hasRisks = riskFlags && riskFlags.length > 0;
  
  if (score >= 80 && !hasRisks) {
    return { label: 'Excellent Match', variant: 'success', description: 'An excellent match for this profile.' };
  } else if (score >= 70) {
    return { label: 'Strong Option', variant: 'warning', description: 'A solid option worth considering.' };
  } else if (score >= 50) {
    return { label: 'Worth Exploring', variant: 'caution', description: 'Some conditions may apply. Review details.' };
  } else {
    return { label: 'Not Recommended', variant: 'danger', description: 'Does not meet key eligibility criteria.' };
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
  const [showHistory, setShowHistory] = useState(false);
  const [historyVersions, setHistoryVersions] = useState<AIRecommendationData[]>([]);
  
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
            all_lender_scores: data.all_lender_scores as unknown as LenderScore[] | null,
            override_reason: (data as any).override_reason || null,
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

  // Fetch history versions
  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_lender_recommendations')
        .select('*')
        .eq('lead_id', leadId)
        .order('version', { ascending: false });

      if (error) throw error;
      setHistoryVersions((data || []).map(d => ({
        ...d,
        all_lenders_output: (d.all_lenders_output as unknown as LenderEvaluation[]) || [],
        inputs_snapshot: d.inputs_snapshot as unknown as InputsSnapshot | null,
        recommendation_context: d.recommendation_context as unknown as RecommendationContext | null,
        pillar_scores: d.pillar_scores as unknown as Record<string, PillarScores> | null,
        all_lender_scores: d.all_lender_scores as unknown as LenderScore[] | null,
        override_reason: (d as any).override_reason || null,
      })));
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

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
          all_lender_scores: data.recommendation.all_lender_scores as unknown as LenderScore[] | null,
          override_reason: data.recommendation.override_reason || null,
        });
        setExpandedGroups(prev => ({ ...prev, best_fit: true }));
        toast({
          title: 'AI Analysis Complete',
          description: `Evaluated ${data.recommendation.all_lenders_output?.length || 0} lenders with 4-layer engine`,
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
      // For non-top picks, show override modal
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
      // Store override feedback - use normalized scores
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

  // Group lenders - handle both old 'group' field and new 'status' field
  const getGroupedLenders = () => {
    const all = recommendation?.all_lenders_output || [];
    
    // Helper to check group membership (supports both old and new format)
    const isInGroup = (e: LenderEvaluation, group: string, status: string) => 
      e.group === group || e.status === status;
    
    return {
      best_fit: all.filter(e => isInGroup(e, 'best_fit', 'BEST_FIT')),
      also_consider: all.filter(e => isInGroup(e, 'also_consider', 'GOOD_FIT')),
      possible_but_risky: all.filter(e => isInGroup(e, 'possible_but_risky', 'WORTH_EXPLORING')),
      not_suitable: all.filter(e => isInGroup(e, 'not_suitable', 'LOCKED') || e.is_locked),
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
        <CardContent className="space-y-3">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Lender assigned via {recommendation.assignment_mode === 'ai' ? 'AI recommendation' : 'AI override'}
            {recommendation.assignment_mode === 'ai_override' && recommendation.override_reason && (
              <span className="block mt-1 text-muted-foreground">
                Reason: {recommendation.override_reason}
              </span>
            )}
          </p>
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={generateRecommendation}
              disabled={generating}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", generating && "animate-spin")} />
              Re-evaluate
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onDefer}
            >
              <Settings className="h-4 w-4 mr-1" />
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
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">AI Lender Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            4-Layer Smart Engine will evaluate all lenders using 3-Pillar scoring
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
                Running 4-Layer Analysis...
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
  const context = recommendation.recommendation_context;
  const needsHumanReview = (recommendation.confidence_score || 0) < 70;
  const strategy = strategyLabels[recommendation.strategy || 'balanced'] || strategyLabels.balanced;

  // Render 3-Pillar visualization
  const renderPillarScores = (pillarScores?: PillarScores) => {
    if (!pillarScores) return null;
    
    const pillars = [
      { key: 'future_earnings', label: 'Future Earnings', icon: GraduationCap, color: 'emerald' },
      { key: 'financial_security', label: 'Financial Security', icon: Wallet, color: 'blue' },
      { key: 'past_record', label: 'Past Record', icon: History, color: 'purple' },
    ];

    return (
      <div className="grid grid-cols-3 gap-2 mt-2">
        {pillars.map(pillar => {
          const score = pillarScores[pillar.key as keyof PillarScores] as number || 0;
          return (
            <div key={pillar.key} className="text-center p-2 rounded-lg bg-muted/50">
              <pillar.icon className={cn("h-3.5 w-3.5 mx-auto mb-1", `text-${pillar.color}-600`)} />
              <div className="text-xs font-semibold">{Math.round(score)}</div>
              <div className="text-[9px] text-muted-foreground">{pillar.label}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render university boost indicator
  const renderUniversityBoost = (boost?: UniversityBoost) => {
    if (!boost || boost.type === 'none') return null;
    
    const isPremium = boost.type === 'premium';
    
    return (
      <div className={cn(
        "mt-2 p-2 rounded-lg border text-xs",
        isPremium 
          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" 
          : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
      )}>
        <div className="flex items-center gap-1.5">
          {isPremium ? (
            <Star className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          ) : (
            <GraduationCap className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          )}
          <span className={cn(
            "font-semibold",
            isPremium ? "text-amber-700 dark:text-amber-400" : "text-blue-700 dark:text-blue-400"
          )}>
            {isPremium ? 'Premium University' : `Ranked Tier ${boost.ranked_tier}`}
          </span>
          <Badge 
            variant="secondary" 
            className={cn(
              "text-[10px] h-4 ml-auto",
              isPremium ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
            )}
          >
            +{boost.amount} pts
          </Badge>
        </div>
        {boost.duplicate_detected && (
          <p className="text-[10px] text-muted-foreground mt-1">
            {boost.details}
          </p>
        )}
      </div>
    );
  };

  // Render a single lender card with 4-layer breakdown
  const renderLenderCard = (evaluation: LenderEvaluation, isTopPick: boolean = false) => {
    // Normalize evaluation data for backwards compatibility
    const normalized = normalizeEvaluation(evaluation);
    const { effectiveScore, effectiveReason, effectiveFactors, effectivePillarScores, effectiveProbabilityBand } = normalized;
    
    const verdict = getVerdict(effectiveScore, evaluation.risk_flags);
    const isExpanded = expandedCards[evaluation.lender_id];
    const { bigWins, eligibilityMet, considerations } = groupAndHumanizeFactors(
      effectiveFactors,
      evaluation.risk_flags || []
    );
    
    const proTip = generateProTip({
      loanAmount: inputs?.loan_amount,
      factors: effectiveFactors,
      processingTimeAdvantage: effectiveFactors.includes('Fast processing time'),
    });

    const isLocked = evaluation.is_locked;
    
    return (
      <div 
        key={evaluation.lender_id}
        className={cn(
          "rounded-lg border transition-all",
          isLocked && "opacity-75 bg-muted/30",
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
                  {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className={cn("font-medium text-sm", isLocked && "text-muted-foreground")}>{evaluation.lender_name}</span>
                </div>
                {isTopPick && !isLocked && (
                  <Badge className="bg-emerald-500 text-white text-[10px] h-4">
                    <Star className="h-2.5 w-2.5 mr-0.5" />
                    Top Pick
                  </Badge>
                )}
                {isLocked && (
                  <Badge variant="outline" className="text-[10px] h-4 border-amber-500 text-amber-600">
                    <Lock className="h-2.5 w-2.5 mr-0.5" />
                    Locked
                  </Badge>
                )}
                {evaluation.processing_time_estimate && !isLocked && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Zap className="h-3 w-3" />
                    {evaluation.processing_time_estimate}
                  </span>
                )}
              </div>

              {/* Unlock Hint for Locked Lenders */}
              {isLocked && evaluation.unlock_hint && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {evaluation.unlock_hint}
                </div>
              )}

              {/* Fit Score Progress - now with labeled score */}
              {!isLocked && (
                <div className="mt-2 flex items-center gap-2">
                  <Progress 
                    value={effectiveScore} 
                    className={cn(
                      "h-2 flex-1",
                      effectiveScore >= 80 ? "[&>div]:bg-emerald-500" :
                      effectiveScore >= 60 ? "[&>div]:bg-amber-500" :
                      "[&>div]:bg-orange-500"
                    )}
                  />
                  <span className={cn(
                    "text-xs font-semibold shrink-0 tabular-nums",
                    effectiveProbabilityBand === 'high' && "text-emerald-700",
                    effectiveProbabilityBand === 'medium' && "text-amber-700",
                    effectiveProbabilityBand === 'low' && "text-orange-700"
                  )}>
                    Score: {effectiveScore}%
                  </span>
                </div>
              )}

              {/* 3-Pillar Mini Visualization */}
              {!isLocked && effectivePillarScores && renderPillarScores(effectivePillarScores)}

              {/* University Boost Indicator */}
              {!isLocked && evaluation.university_boost && renderUniversityBoost(evaluation.university_boost)}

              {/* Strategic Adjustment Indicator */}
              {!isLocked && evaluation.strategic_adjustment !== undefined && evaluation.strategic_adjustment !== 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  <Target className={cn("h-3 w-3", evaluation.strategic_adjustment > 0 ? "text-emerald-600" : "text-amber-600")} />
                  <span className={evaluation.strategic_adjustment > 0 ? "text-emerald-700" : "text-amber-700"}>
                    {evaluation.strategic_adjustment > 0 ? '+' : ''}{evaluation.strategic_adjustment} strategy adjustment
                  </span>
                </div>
              )}

              {/* Humanized Verdict - uses verdict.description for consistency */}
              {!isLocked && (
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
                    — {verdict.description}
                  </span>
                </div>
              )}

              {/* Key Strengths Preview */}
              {!isLocked && bigWins.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {bigWins.slice(0, 2).map((factor, i) => (
                    <HumanizedFactorCard key={i} factor={factor} compact />
                  ))}
                  {bigWins.length > 2 && (
                    <span className="text-[10px] text-muted-foreground self-center">
                      +{bigWins.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Accept Button */}
            {!isLocked && (
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
            )}
          </div>

          {/* Toggle Details */}
          <button 
            onClick={() => toggleCard(evaluation.lender_id)}
            className="mt-2 text-xs text-primary flex items-center gap-1 hover:underline"
          >
            {isExpanded ? 'Hide' : 'Show'} Details
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-0 border-t bg-muted/30 space-y-3">
            {/* Trade-offs for non-top picks */}
            {normalized.effectiveTradeOffs.length > 0 && (
              <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-3 w-3" />
                  Trade-offs vs Top Pick
                </h4>
                <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5">
                  {normalized.effectiveTradeOffs.map((tradeoff, i) => (
                    <li key={i}>• {tradeoff}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Score Insight */}
            <div className="mt-3">
              <ScoreInsight 
                score={effectiveScore}
                lenderName={evaluation.lender_name}
                topLenderName={topLender?.lender_name}
                gapReason={considerations[0]?.description}
              />
            </div>

            {/* Key Strengths */}
            {bigWins.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Key Strengths
                </h4>
                <div className="space-y-1.5">
                  {bigWins.map((factor, i) => (
                    <HumanizedFactorCard key={i} factor={factor} />
                  ))}
                </div>
              </div>
            )}

            {/* Eligibility Met */}
            {eligibilityMet.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs text-muted-foreground font-medium">
                  Eligibility Criteria Met
                </h4>
                <div className="flex flex-wrap gap-1">
                  {eligibilityMet.map((factor, i) => (
                    <HumanizedFactorCard key={i} factor={factor} compact />
                  ))}
                </div>
              </div>
            )}

            {/* Considerations */}
            {considerations.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Considerations
                </h4>
                <div className="space-y-1">
                  {considerations.map((factor, i) => (
                    <HumanizedFactorCard key={i} factor={factor} />
                  ))}
                </div>
              </div>
            )}

            {/* Pro-Tip */}
            {proTip && <ProTipBanner tip={proTip} />}

            {/* Full Justification/Reason */}
            {effectiveReason && (
              <div className="p-2 bg-background rounded text-xs text-muted-foreground italic border">
                <span className="font-medium not-italic">AI Analysis: </span>
                "{effectiveReason}"
              </div>
            )}
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
    <>
      <Card className={cn("", className)}>
        {/* Context Banner - 4-Layer Summary */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-info/5">
          <div className="flex flex-wrap items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">4-Layer Smart Engine</span>
            <div className="flex flex-wrap gap-1.5 ml-auto">
              {recommendation.student_tier && (
                <TierBadge tier={recommendation.student_tier as 'S' | 'A' | 'B' | 'C'} size="sm" />
              )}
              {recommendation.urgency_zone && (
                <UrgencyZoneBadge 
                  zone={recommendation.urgency_zone as 'GREEN' | 'YELLOW' | 'RED'} 
                  daysUntil={context?.days_until_intake}
                  size="sm"
                />
              )}
              <Badge variant="outline" className={cn("text-[10px] h-5", strategy.color)}>
                <strategy.icon className="h-3 w-3 mr-1" />
                {strategy.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Smart Summary Header */}
        <CardHeader className="pb-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">AI Lender Analysis</CardTitle>
              {recommendation.version && recommendation.version > 1 && (
                <Badge variant="secondary" className="text-[10px]">v{recommendation.version}</Badge>
              )}
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                fetchHistory();
                setShowHistory(!showHistory);
              }}
              className="flex-1"
            >
              <History className="mr-1 h-3 w-3" />
              History
            </Button>
          </div>

          {/* Version History */}
          {showHistory && historyVersions.length > 1 && (
            <div className="p-2 bg-muted/50 rounded-lg border space-y-2">
              <h4 className="text-xs font-semibold flex items-center gap-1">
                <History className="h-3 w-3" />
                Previous Versions
              </h4>
              {historyVersions.slice(1).map((v) => (
                <div key={v.id} className="text-xs p-2 bg-background rounded border flex justify-between items-center">
                  <span>v{v.version} — {new Date(v.created_at).toLocaleDateString()}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {v.confidence_score}% conf
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Human-in-the-loop notice */}
          <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg border">
            <AlertCircle className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[10px] text-muted-foreground">
              AI suggestions require human approval. Final lender assignment is always your decision.
            </p>
          </div>
        </CardContent>
      </Card>

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
            <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
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
