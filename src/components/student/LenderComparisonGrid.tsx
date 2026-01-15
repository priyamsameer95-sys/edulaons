import { useState, useMemo } from 'react';
import { ChevronDown, Lock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import LenderFeaturedCard from './LenderFeaturedCard';
import LenderRowCard from './LenderRowCard';
import { UrgencyZoneBadge } from '@/components/shared/UrgencyZoneBadge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface StudentFacingReason {
  greeting: string;
  confidence: string;
  cta: string;
}

interface PillarBreakdown {
  future: number;
  financial: number;
  past: number;
}

interface LenderData {
  lender_id: string;
  lender_name: string;
  lender_code: string;
  logo_url: string | null;
  interest_rate_min: number | null;
  interest_rate_max?: number | null;
  loan_amount_min?: number | null;
  loan_amount_max: number | null;
  processing_time_days: number | null;
  approval_rate?: number | null;
  compatibility_score: number;
  is_preferred?: boolean;
  eligible_loan_max?: number | null;
  student_facing_reason?: StudentFacingReason | string | null;
  lender_description?: string | null;
  eligible_expenses?: any[] | null;
  // New fields from AI recommendation
  pillar_breakdown?: PillarBreakdown | null;
  badges?: string[] | null;
  trade_off?: string | null;
  status?: 'BEST_FIT' | 'GOOD_FIT' | 'BACKUP' | 'LOCKED' | null;
  knockout_reason?: string | null;
  unlock_hint?: string | null;
}

interface LenderComparisonGridProps {
  lenders: LenderData[];
  selectedLenderId: string | null;
  onSelect: (lenderId: string) => void;
  isUpdating: boolean;
  urgencyZone?: 'GREEN' | 'YELLOW' | 'RED' | null;
  recommendationContext?: any;
}

const LenderComparisonGrid = ({
  lenders,
  selectedLenderId,
  onSelect,
  isUpdating,
  urgencyZone,
  recommendationContext
}: LenderComparisonGridProps) => {
  const [showAllOthers, setShowAllOthers] = useState(false);
  const [showLockedLenders, setShowLockedLenders] = useState(false);

  if (lenders.length === 0) return null;

  // Group lenders by status
  const qualifiedLenders = lenders.filter(l => l.status !== 'LOCKED');
  const lockedLenders = lenders.filter(l => l.status === 'LOCKED');

  // Split qualified lenders: top 3 featured, rest as "other qualified"
  const featuredLenders = qualifiedLenders.slice(0, 3);
  const otherLenders = qualifiedLenders.slice(3);
  const visibleOtherLenders = showAllOthers ? otherLenders : otherLenders.slice(0, 3);

  // Calculate Market Rate (Average of top lenders) & Lowest Rate
  const { marketRate, lowestRate } = useMemo(() => {
    if (lenders.length === 0) return { marketRate: 10, lowestRate: 10 };
    const rates = lenders.map(l => l.interest_rate_min || 10);
    const sum = rates.reduce((a, b) => a + b, 0);
    return {
      marketRate: sum / rates.length,
      lowestRate: Math.min(...rates)
    };
  }, [lenders]);

  return (
    <div className="space-y-8">
      {/* Section Header with Urgency Zone Badge */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <h3 className="text-xl font-bold text-foreground">Top Lender Recommendations</h3>
          {urgencyZone && <UrgencyZoneBadge zone={urgencyZone} />}
        </div>
        <p className="text-sm text-muted-foreground">
          Personalized based on your financial profile and AI-driven insights.
        </p>
      </div>

      {/* Featured Lenders - Top 3 with equal height */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {featuredLenders.map((lender, index) => (
          <LenderFeaturedCard
            key={lender.lender_id}
            lender={lender}
            rank={index + 1}
            isSelected={selectedLenderId === lender.lender_id}
            onSelect={onSelect}
            isUpdating={isUpdating}
            recommendationContext={recommendationContext}
            marketRate={marketRate}
            lowestRate={lowestRate}
          />
        ))}
      </div>

      {/* Other Qualified Lenders Section */}
      {otherLenders.length > 0 && (
        <div className="space-y-4">
          {/* Section Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground px-3 uppercase tracking-wider">
              Other Qualified Lenders
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Other Lenders List */}
          <div className="space-y-3">
            {visibleOtherLenders.map((lender) => (
              <LenderRowCard
                key={lender.lender_id}
                lender={lender}
                isSelected={selectedLenderId === lender.lender_id}
                onSelect={onSelect}
                isUpdating={isUpdating}
                recommendationContext={recommendationContext}
                marketRate={marketRate}
                lowestRate={lowestRate}
              />
            ))}
          </div>

          {/* Show More/Less Toggle */}
          {otherLenders.length > 3 && (
            <button
              onClick={() => setShowAllOthers(!showAllOthers)}
              className="flex items-center gap-1.5 mx-auto text-sm font-medium text-primary hover:text-primary/80 transition-colors py-2"
            >
              {showAllOthers ? 'Show fewer' : `View all ${otherLenders.length} lenders`}
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                showAllOthers && "rotate-180"
              )} />
            </button>
          )}
        </div>
      )}

      {/* Locked Lenders Section (Collapsible) */}
      {lockedLenders.length > 0 && (
        <Collapsible open={showLockedLenders} onOpenChange={setShowLockedLenders}>
          <div className="space-y-3">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 mx-auto text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                <Lock className="h-4 w-4" />
                {lockedLenders.length} lender{lockedLenders.length > 1 ? 's' : ''} not currently available
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  showLockedLenders && "rotate-180"
                )} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground text-center mb-3">
                  These lenders don't match your current profile. See what's needed to unlock them.
                </p>
                {lockedLenders.map((lender) => (
                  <div
                    key={lender.lender_id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/40 mb-2 last:mb-0"
                  >
                    <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground/70 text-sm">{lender.lender_name}</p>
                      {lender.unlock_hint && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                          {lender.unlock_hint}
                        </p>
                      )}
                      {lender.knockout_reason && !lender.unlock_hint && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {lender.knockout_reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  );
};

export default LenderComparisonGrid;
