/**
 * Partner-facing Read-Only Lender Recommendation Card
 * 
 * Shows AI recommendation status without edit capabilities
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Building2, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UrgencyZoneBadge } from '@/components/shared/UrgencyZoneBadge';

interface LenderRecommendationCardProps {
  leadId: string;
  className?: string;
}

interface RecommendationData {
  id: string;
  recommended_lender_ids: string[];
  confidence_score: number;
  assignment_mode: string | null;
  urgency_zone: string | null;
  student_facing_reason: string | null;
  lender_name?: string;
}

export function LenderRecommendationCard({ leadId, className }: LenderRecommendationCardProps) {
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [topLenderName, setTopLenderName] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendation() {
      try {
        const { data, error } = await supabase
          .from('ai_lender_recommendations')
          .select('id, recommended_lender_ids, confidence_score, assignment_mode, urgency_zone, student_facing_reason')
          .eq('lead_id', leadId)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setRecommendation(data);
          
          // Fetch top lender name
          if (data.recommended_lender_ids && data.recommended_lender_ids.length > 0) {
            const { data: lenderData } = await supabase
              .from('lenders')
              .select('name')
              .eq('id', data.recommended_lender_ids[0])
              .single();
            
            if (lenderData) {
              setTopLenderName(lenderData.name);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching recommendation:', err);
      } finally {
        setLoading(false);
      }
    }

    if (leadId) {
      fetchRecommendation();
    }
  }, [leadId]);

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lender Recommendation
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>AI analysis pending</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isAssigned = !!recommendation.assignment_mode;

  return (
    <Card className={cn(
      isAssigned 
        ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20" 
        : "border-primary/20 bg-primary/5",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">
              Lender Recommendation
            </CardTitle>
          </div>
          {recommendation.urgency_zone && (
            <UrgencyZoneBadge 
              zone={recommendation.urgency_zone as 'GREEN' | 'YELLOW' | 'RED'} 
              size="sm"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Top Lender */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {topLenderName || 'Recommended Lender'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] h-4",
                  recommendation.confidence_score >= 80 
                    ? "border-emerald-500 text-emerald-700" 
                    : "border-amber-500 text-amber-700"
                )}
              >
                {recommendation.confidence_score}% match
              </Badge>
              {isAssigned ? (
                <Badge className="bg-emerald-500 text-white text-[10px] h-4">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                  Assigned
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] h-4">
                  <Clock className="h-2.5 w-2.5 mr-0.5" />
                  Pending Review
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* AI Reason */}
        {recommendation.student_facing_reason && (
          <div className="p-2 bg-background rounded-lg border">
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {typeof recommendation.student_facing_reason === 'string' 
                  ? recommendation.student_facing_reason 
                  : 'AI-matched based on profile analysis'}
              </p>
            </div>
          </div>
        )}

        {/* Status Note */}
        <p className="text-[10px] text-muted-foreground text-center">
          {isAssigned 
            ? 'Lender has been assigned to this application' 
            : 'Awaiting admin review and assignment'}
        </p>
      </CardContent>
    </Card>
  );
}

export default LenderRecommendationCard;
