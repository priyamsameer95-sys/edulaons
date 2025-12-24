/**
 * AI Lender Recommendation Component
 * 
 * Per Knowledge Base:
 * - AI suggests lender(s) + rationale + confidence score
 * - Admin can accept / override / defer
 * - Store AI output snapshot (inputs + recommendation + confidence + model version)
 * - Never auto-reject or auto-finalize solely by AI
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Bot, Check, X, Clock, Sparkles, Building2, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LenderRecommendation {
  lender_id: string;
  lender_name: string;
  confidence_score: number;
  rationale: string;
  match_factors: string[];
}

interface AIRecommendationData {
  id: string;
  recommended_lender_ids: string[];
  recommended_lenders_data: LenderRecommendation[];
  rationale: string;
  confidence_score: number;
  model_version: string;
  created_at: string;
  assignment_mode: string | null;
  accepted_lender_id: string | null;
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
            recommended_lenders_data: (data.recommended_lenders_data as unknown as LenderRecommendation[]) || [],
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
        body: {
          leadId,
          studyDestination,
          loanAmount,
        },
      });

      if (error) throw error;

      if (data?.recommendation) {
        setRecommendation(data.recommendation);
        toast({
          title: 'AI Recommendation Generated',
          description: `${data.recommendation.recommended_lenders_data?.length || 0} lenders suggested`,
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
      
      // Log the assignment
      await logLenderAssignment({
        leadId,
        oldLenderId: currentLenderId,
        newLenderId: lenderId,
        assignmentMode: mode,
        aiConfidence: recommendation?.confidence_score,
        reason: `Accepted AI ${isTopPick ? 'top recommendation' : 'alternative recommendation'}`,
      });

      // Update recommendation record
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

  // Defer decision
  const handleDefer = () => {
    onDefer?.();
    toast({
      title: 'Decision Deferred',
      description: 'You can revisit the AI recommendation later',
    });
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 85) {
      return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">High Confidence ({score}%)</Badge>;
    } else if (score >= 70) {
      return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">Medium Confidence ({score}%)</Badge>;
    } else {
      return <Badge className="bg-red-500/10 text-red-700 border-red-200">Low Confidence ({score}%)</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="pb-3">
          <div className="h-5 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted rounded" />
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
            <Check className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-sm font-medium text-emerald-700">
              AI Recommendation Applied
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-emerald-600">
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
            <CardTitle className="text-sm font-medium">AI Lender Suggestion</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Let AI analyze the lead and suggest optimal lenders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateRecommendation} 
            disabled={generating}
            variant="outline"
            className="w-full"
          >
            {generating ? (
              <>
                <Bot className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Recommendation
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show recommendations
  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">AI Recommendation</CardTitle>
          </div>
          {getConfidenceBadge(recommendation.confidence_score || 0)}
        </div>
        <CardDescription className="text-xs">
          Model: {recommendation.model_version} • {new Date(recommendation.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall Rationale */}
        {recommendation.rationale && (
          <div className="p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <p className="italic">"{recommendation.rationale}"</p>
          </div>
        )}

        {/* Recommended Lenders */}
        <div className="space-y-2">
          {recommendation.recommended_lenders_data?.map((lender, index) => (
            <div 
              key={lender.lender_id}
              className={cn(
                "p-3 rounded-lg border transition-all",
                index === 0 ? "bg-primary/5 border-primary/30" : "bg-background"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    index === 0 ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Building2 className={cn(
                      "h-4 w-4",
                      index === 0 ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{lender.lender_name}</p>
                      {index === 0 && (
                        <Badge variant="default" className="text-[10px] h-4">
                          Top Pick
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {lender.confidence_score}% match
                      </span>
                    </div>
                    {lender.rationale && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {lender.rationale}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={index === 0 ? "default" : "outline"}
                  onClick={() => acceptLender(lender.lender_id, index === 0)}
                  disabled={accepting !== null}
                  className="shrink-0"
                >
                  {accepting === lender.lender_id ? (
                    <Bot className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  <span className="ml-1 text-xs">Accept</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

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
            <Sparkles className="mr-1 h-3 w-3" />
            Refresh
          </Button>
        </div>

        {/* Human-in-the-loop notice */}
        <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-[10px] text-amber-700 dark:text-amber-400">
            AI suggestions require human approval. Final lender assignment is always your decision.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AILenderRecommendation;
