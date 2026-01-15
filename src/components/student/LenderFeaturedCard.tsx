import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SmartCard } from '@/components/common/smart-card';
import { ReasoningBox } from '@/components/common/reasoning-box';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Star,
  Check,
  ChevronDown,
  CheckCircle2,
  Zap,
  ArrowRight,
  Sparkles,
  Clock,
  Percent,
  Wallet,
  TrendingUp,
  Shield,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Format processing fee: >= 9 means flat rupees, < 9 means percentage
const formatProcessingFee = (fee: number | null | undefined): string => {
  if (!fee) return '~1%';
  if (fee >= 9) {
    return `₹${fee.toLocaleString('en-IN')}`;
  }
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
  eligible_expenses?: any[] | null;
  moratorium_period?: string | null;
  processing_fee?: number | null;
  collateral_preference?: string[] | null;
  // New fields from AI recommendation
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
  const [showDetails, setShowDetails] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isTopMatch = rank === 1;

  // DERIVED VARIABLES (The "Think" Step)
  const VISA_BUFFER = 7;
  const intakeGap = (recommendationContext?.days_until_deadline || 60) - (lender.processing_time_days || 30);
  const netAvailableDays = intakeGap - VISA_BUFFER;
  const ratePremium = marketRate - (lender.interest_rate_min || 10);
  const coverageRatio = (recommendationContext?.loan_amount && lender.loan_amount_max)
    ? (lender.loan_amount_max / recommendationContext.loan_amount)
    : 1;

  // PRIORITY-BASED REASONING (Insights)
  const insights: string[] = [];

  // Priority 1: The Speed Specialist (Timeline Risk)
  // Trigger if we have less than 5 days "spare" after accounting for visa buffer
  if (netAvailableDays < 5 && netAvailableDays > -15 && recommendationContext?.urgency_zone === 'RED') {
    insights.push(`⚡ CRITICAL TIMELINE: Selected because they meet your deadline while leaving a safe ${VISA_BUFFER}-day visa buffer.`);
  }

  // Priority 2: The Cost Leader (If lowest rate)
  if ((lender.interest_rate_min || 10) === lowestRate && ratePremium > 0) {
    const loanAmount = recommendationContext?.loan_amount || 0;
    const annualSavings = Math.round((loanAmount * (ratePremium / 100)));
    const savingsFormatted = annualSavings > 0
      ? `₹${(annualSavings / 1000).toFixed(1)}k`
      : 'significant amount';

    insights.push(`🏆 BEST IN MARKET: This rate is ${ratePremium.toFixed(2)}% lower than your other matches, saving you approx ${savingsFormatted} in interest.`);
  }

  // Priority 3: The High Coverage (Full Funding)
  if (coverageRatio >= 1 && recommendationContext?.loan_amount > 2000000) {
    insights.push(`✅ FULL FUNDING: This lender fully covers your requested ₹${(recommendationContext.loan_amount / 100000).toFixed(1)}L without a gap.`);
  }

  // Fallback Pointers if list is short
  if (insights.length === 0) {
    if (lender.processing_time_days && lender.processing_time_days <= 7) insights.push("⚡ Fast 7-day approval process.");
    if (lender.interest_rate_min && lender.interest_rate_min < 10) insights.push(`💰 Competitive interest rate starting at ${lender.interest_rate_min}%.`);
    insights.push("🛡️ Reliable option matching your university tier.");
  }

  // Ensure we have something
  if (insights.length < 2) {
    insights.push("⭐ Strong match based on your overall profile.");
  }

  const displayedInsights = isExpanded ? insights : insights.slice(0, 2);

  // Determine Background Style
  const isTimelineWarning = recommendationContext?.urgency_zone === 'RED' && (lender.processing_time_days || 30) > (recommendationContext?.days_until_deadline || 60);

  const cardAction = (
    <div className="flex items-center gap-1.5">
      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-primary/20">
        {lender.compatibility_score}% Match
      </Badge>
    </div>
  );

  return (
    <SmartCard
      className={cn(
        "h-full flex flex-col transition-all duration-300 relative",
        isSelected ? 'ring-2 ring-primary shadow-lg scale-[1.01] z-10' : 'hover:-translate-y-1 hover:shadow-xl'
      )}
      noPadding
      title={
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg border bg-white p-2 shadow-sm flex items-center justify-center">
            {lender.logo_url ? (
              <img src={lender.logo_url} alt={lender.lender_name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-xl font-bold text-primary">{lender.lender_name[0]}</span>
            )}
          </div>
          <span className="font-bold text-lg text-foreground leading-tight">{lender.lender_name}</span>
        </div>
      }
      action={cardAction}
      footer={
        <Button
          className={cn(
            "w-full gap-2 font-semibold shadow-md transition-all duration-300",
            isSelected && !isUpdating
              ? 'bg-success hover:bg-success/90 text-white shadow-success/20'
              : 'bg-primary hover:bg-primary/90 shadow-primary/20'
          )}
          size="lg"
          onClick={() => onSelect(lender.lender_id)}
          disabled={isUpdating}
        >
          {isUpdating && isSelected ? (
            <>Saving...</>
          ) : (
            <>
              {isSelected ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Selected
                </>
              ) : (
                <>
                  Select Lender <ArrowRight className="h-4 w-4" />
                </>
              )}
            </>
          )}
        </Button>
      }
    >
      {/* Top Badge Overlay */}
      <div className={cn(
        "absolute top-0 inset-x-0 py-1.5 px-3 text-center text-[10px] font-bold uppercase tracking-wider rounded-t-xl z-20",
        isTopMatch ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
      )}>
        {isTopMatch ? '🌟 Your Top Choice' : `Option #${rank}`}
      </div>

      <div className="p-5 pt-12 flex flex-col h-full gap-4">
        {/* Why This Lender - Deep Insights */}
        <div className="flex-1">
          {/* TIMELINE VISUALIZATION */}
          <div className="bg-white/50 rounded-lg p-2.5 mb-3 border border-border/40">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Timeline Check</span>
              <span className={cn(
                "text-[10px] font-bold",
                netAvailableDays < 0 ? 'text-destructive' : netAvailableDays < 7 ? 'text-amber-600' : 'text-success'
              )}>
                {netAvailableDays < 0 ? 'RISK: Too Late' : `${netAvailableDays} Days Buffer`}
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex">
              <div
                className="bg-primary h-full"
                style={{ width: `${Math.min(100, ((lender.processing_time_days || 20) / (recommendationContext?.days_until_deadline || 60)) * 100)}%` }}
              />
              <div
                className={cn("h-full border-l border-white/50", netAvailableDays < 5 ? 'bg-red-400' : 'bg-emerald-400')}
                style={{ width: `${Math.min(100, (VISA_BUFFER / (recommendationContext?.days_until_deadline || 60)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
              <span>Today</span>
              <span>Deadline</span>
            </div>
          </div>

          {/* COST BADGE */}
          {(lender.interest_rate_min || 10) === lowestRate && ratePremium > 0 && (
            <div className="mb-3 bg-emerald-50 border border-emerald-100 rounded-lg p-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="bg-emerald-100 p-1 rounded-full text-emerald-700">
                  <Wallet className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase leading-none">Smart Savings</p>
                  <p className="text-[10px] text-emerald-600 leading-tight">vs Market Average</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-700 leading-none tabular-nums">
                  ₹{Math.round((recommendationContext?.loan_amount || 0) * (ratePremium / 100) / 1000)}k
                </p>
                <p className="text-[9px] text-emerald-600">per year</p>
              </div>
            </div>
          )}

          <ReasoningBox
            points={displayedInsights}
            variant={isTimelineWarning ? "insight" : "feature"} // Reuse insight style for emphasis if warning
            className={cn(isTimelineWarning ? "bg-amber-50 border-amber-200" : "")}
          />

          {/* Expand Logic */}
          {insights.length > 2 && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="mt-2 w-full text-[10px] font-semibold text-primary/80 hover:text-primary flex items-center justify-center gap-1 transition-colors"
            >
              {isExpanded ? 'Show less' : `Read more (${insights.length - 2} insights)`}
              <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && 'rotate-180')} />
            </button>
          )}
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
            <Percent className="h-3.5 w-3.5 text-success mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground tabular-nums">
              {lender.interest_rate_min}%
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Interest</p>
          </div>

          <div className="text-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
            <Wallet className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground tabular-nums">
              ₹{(lender.loan_amount_max ? lender.loan_amount_max / 100000 : 0)}L
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Max Loan</p>
          </div>

          <div className="text-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
            <Clock className="h-3.5 w-3.5 text-amber-600 mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground tabular-nums">
              {lender.processing_time_days}d
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Process</p>
          </div>
        </div>
      </div>
    </SmartCard>
  );
};

export default LenderFeaturedCard;
