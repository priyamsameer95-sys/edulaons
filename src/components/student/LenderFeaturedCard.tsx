import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SmartCard } from '@/components/common/smart-card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Shield,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formatProcessingFee = (fee: number | null | undefined): string => {
  if (!fee) return '~1%';
  if (fee >= 9) return `₹${fee.toLocaleString('en-IN')}`;
  return `${fee}%`;
};

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
  loan_amount_max: number | null;
  processing_time_days: number | null;
  compatibility_score: number;
  eligible_loan_max?: number | null;
  student_facing_reason?: StudentFacingReason | string | null;
  lender_description?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eligible_expenses?: any[] | null;
  moratorium_period?: string | null;
  processing_fee?: number | null;
  collateral_preference?: string[] | null;
  pillar_breakdown?: PillarBreakdown | null;
  badges?: string[] | null;
  trade_off?: string | null;
  status?: 'BEST_FIT' | 'GOOD_FIT' | 'BACKUP' | 'LOCKED' | null;
  knockout_reason?: string | null;
  unlock_hint?: string | null;
}

interface LenderFeaturedCardProps {
  lender: LenderData;
  rank: number;
  isSelected: boolean;
  onSelect: (lenderId: string) => void;
  isUpdating: boolean;
  marketRate?: number;
  lowestRate?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recommendationContext?: any;
}

const LenderFeaturedCard = ({
  lender,
  rank,
  isSelected,
  onSelect,
  isUpdating,
  recommendationContext,
  marketRate = 10,
  lowestRate = 10
}: LenderFeaturedCardProps) => {
  // Mobile Optimization: Insights collapsed by default
  const [showInsights, setShowInsights] = useState(false);
  const isTopMatch = rank === 1;

  // DERIVED VARIABLES
  const VISA_BUFFER = 7;
  const intakeGap = (recommendationContext?.days_until_deadline || 60) - (lender.processing_time_days || 30);
  const netAvailableDays = intakeGap - VISA_BUFFER;
  const ratePremium = marketRate - (lender.interest_rate_min || 10);

  // INSIGHTS GENERATION
  const insights: string[] = [];
  if (netAvailableDays < 5 && netAvailableDays > -15 && recommendationContext?.urgency_zone === 'RED') {
    insights.push(`⚡ CRITICAL TIMELINE: Meets deadline with ${VISA_BUFFER}-day visa buffer.`);
  }
  if ((lender.interest_rate_min || 10) === lowestRate && ratePremium > 0) {
    insights.push(`🏆 BEST RATE: Savings of approx ₹${Math.round((recommendationContext?.loan_amount || 0) * (ratePremium / 100) / 1000)}k/year.`);
  }
  if (lender.badges?.includes('Premium Partner')) {
    insights.push("⭐ PREMIUM PARTNER: High approval chance.");
  }
  // Fallback
  if (insights.length < 2) {
    insights.push("✅ Strong profile match.");
  }

  const isTimelineWarning = recommendationContext?.urgency_zone === 'RED' && (lender.processing_time_days || 30) > (recommendationContext?.days_until_deadline || 60);

  return (
    <div className={cn(
      "relative rounded-xl border bg-card transition-all duration-300 overflow-hidden",
      isSelected ? "ring-2 ring-primary border-primary shadow-lg" : "border-border shadow-sm hover:shadow-md",
      isTopMatch && !isSelected && "border-amber-200 bg-amber-50/10" // Subtle highlight for top choice
    )}>
      {/* HEADER STRIP */}
      {isTopMatch && (
        <div className="bg-amber-100/80 text-amber-800 text-[10px] font-bold uppercase tracking-wider text-center py-1 border-b border-amber-200">
          🌟 Top Recommendation
        </div>
      )}

      <div className="p-4">
        {/* TOP ROW: Logo + Name + Score */}
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border bg-white p-1.5 flex items-center justify-center shadow-sm">
              {lender.logo_url ? (
                <img src={lender.logo_url} alt={lender.lender_name} className="w-full h-full object-contain" />
              ) : (
                <span className="font-bold text-primary">{lender.lender_name[0]}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground leading-tight">{lender.lender_name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={cn(
                  "text-[10px] h-5 px-1.5 font-semibold",
                  lender.compatibility_score >= 80 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-primary bg-primary/5"
                )}>
                  {lender.compatibility_score}% Match
                </Badge>
                {isTimelineWarning && (
                  <span className="text-[10px] font-bold text-destructive flex items-center gap-0.5">
                    <Shield className="w-3 h-3" /> Risk
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* KEY METRICS GRID (Compact) */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 rounded-lg bg-muted/40 border border-border/40 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Rate</p>
            <p className="font-bold text-sm text-foreground">{lender.interest_rate_min}%</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 border border-border/40 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Max Loan</p>
            <p className="font-bold text-sm text-foreground">
              {lender.loan_amount_max ? `₹${(lender.loan_amount_max / 100000).toFixed(0)}L` : 'Flexible'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 border border-border/40 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Fee</p>
            <p className="font-bold text-sm text-foreground">{formatProcessingFee(lender.processing_fee)}</p>
          </div>
        </div>

        {/* ANALYST INSIGHT (Accordion style) */}
        <div className="mb-4">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="w-full flex items-center justify-between text-xs font-semibold text-primary/80 hover:text-primary mb-2"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Why we picked this
            </span>
            <ChevronDown className={cn("w-3 h-3 transition-transform", showInsights && "rotate-180")} />
          </button>

          {showInsights && (
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-1">
              <ul className="space-y-1.5">
                {insights.map((insight, i) => (
                  <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ACTION */}
        <Button
          className={cn(
            "w-full font-semibold shadow-sm",
            isSelected ? 'bg-success hover:bg-success/90' : 'bg-primary hover:bg-primary/90'
          )}
          size="sm"
          onClick={() => onSelect(lender.lender_id)}
          disabled={isUpdating}
        >
          {isUpdating && isSelected ? "Saving..." : isSelected ? (
            <><Check className="w-3.5 h-3.5 mr-1.5" /> Selected</>
          ) : (
            <><span className="mr-1">Select Offer</span> <ArrowRight className="w-3.5 h-3.5" /></>
          )}
        </Button>
      </div>
    </div>
  );
};

export default LenderFeaturedCard;
