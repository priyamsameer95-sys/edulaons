import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Check, 
  ChevronDown,
  CheckCircle2,
  Zap,
  Percent,
  Clock,
  Wallet,
  Shield
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
  student_facing_reason?: string;
  eligible_expenses?: any[] | null;
  moratorium_period?: string | null;
  processing_fee?: number | null;
  collateral_preference?: string[] | null;
}

// Generate comparison-focused badges from lender data
const getComparisonBadges = (lender: LenderData): string[] => {
  const badges: string[] = [];
  
  // Rate comparison (market avg ~9-10%)
  if (lender.interest_rate_min && lender.interest_rate_min < 9) {
    badges.push(`${lender.interest_rate_min}% - Below avg rate`);
  }
  
  // Speed comparison
  if (lender.processing_time_days && lender.processing_time_days <= 10) {
    badges.push(`~${lender.processing_time_days} days - Fast approval`);
  } else if (lender.processing_time_days && lender.processing_time_days <= 15) {
    badges.push(`~${lender.processing_time_days} days processing`);
  }
  
  // High loan capacity
  const displayAmount = lender.eligible_loan_max || lender.loan_amount_max;
  if (displayAmount && displayAmount >= 15000000) {
    badges.push(`Up to ₹${(displayAmount / 10000000).toFixed(1)}Cr available`);
  }
  
  // Moratorium benefit
  if (lender.moratorium_period) {
    badges.push(`${lender.moratorium_period} moratorium`);
  }
  
  return badges.slice(0, 3);
};

interface LenderRowCardProps {
  lender: LenderData;
  isSelected: boolean;
  onSelect: (lenderId: string) => void;
  isUpdating: boolean;
}

const LenderRowCard = ({
  lender,
  isSelected,
  onSelect,
  isUpdating
}: LenderRowCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const displayAmount = lender.eligible_loan_max || lender.loan_amount_max;
  
  const expensesCovered = lender.eligible_expenses?.length 
    ? lender.eligible_expenses.slice(0, 4)
    : ['Tuition Fees', 'Living Expenses', 'Travel Costs', 'Books & Equipment'];

  return (
    <div
      className={cn(
        "rounded-xl border-2 bg-card transition-all overflow-hidden",
        isSelected && "ring-2 ring-success border-success shadow-md shadow-success/10",
        !isSelected && "border-border/60 hover:border-primary/30 hover:shadow-md",
        isUpdating && "opacity-60 pointer-events-none"
      )}
    >
      {/* Main Row */}
      <div className="flex items-center gap-4 p-4">
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center flex-shrink-0 border border-border/40">
          {lender.logo_url ? (
            <img 
              src={lender.logo_url} 
              alt={lender.lender_name} 
              className="w-7 h-7 object-contain" 
            />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        {/* Name + Match Score + Secured Badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-foreground text-base truncate">{lender.lender_name}</p>
            
            {/* Secured Loan Indicator */}
            {lender.collateral_preference?.includes('required') && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
                <Shield className="h-3 w-3" />
                Secured Loan
              </div>
            )}
            {lender.collateral_preference?.includes('preferred') && 
             !lender.collateral_preference?.includes('required') && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-500 dark:border-amber-800">
                <Shield className="h-3 w-3" />
                Collateral Preferred
              </div>
            )}
          </div>
          <div className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mt-1",
            lender.compatibility_score >= 70 ? "bg-success/10 text-success" : 
            lender.compatibility_score >= 50 ? "bg-primary/10 text-primary" : 
            "bg-muted text-muted-foreground"
          )}>
            {lender.compatibility_score}% Match
          </div>
        </div>

        {/* Metrics - Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <div className="text-center min-w-[60px]">
            <p className="font-bold text-foreground text-base tabular-nums">
              {lender.interest_rate_min ? `${lender.interest_rate_min}%` : '—'}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wide">Rate</p>
          </div>
          <div className="text-center min-w-[70px]">
            <p className="font-bold text-foreground text-base tabular-nums">
              {displayAmount ? `₹${(displayAmount / 10000000).toFixed(1)}Cr` : '—'}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wide">Amount</p>
          </div>
          <div className="text-center min-w-[50px]">
            <p className="font-bold text-foreground text-base tabular-nums">
              {lender.processing_time_days ? `${lender.processing_time_days}d` : '7-10d'}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wide">Time</p>
          </div>
        </div>

        {/* View Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm font-medium",
            "bg-muted/50 hover:bg-muted text-foreground/80 hover:text-foreground",
            showDetails && "bg-muted"
          )}
        >
          <span className="hidden sm:inline">Details</span>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-300",
            showDetails && "rotate-180"
          )} />
        </button>

        {/* Select Button */}
        <Button
          size="sm"
          variant={isSelected ? "default" : "outline"}
          onClick={() => onSelect(lender.lender_id)}
          disabled={isUpdating}
          className={cn(
            "h-10 px-5 text-sm font-bold rounded-lg",
            isSelected && "bg-success hover:bg-success/90 border-success shadow-md"
          )}
        >
          {isSelected ? (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              Selected
            </>
          ) : (
            'Select'
          )}
        </Button>
      </div>

      {/* Mobile Metrics */}
      <div className="md:hidden px-4 pb-3">
        <div className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{lender.interest_rate_min || '—'}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">
              {displayAmount ? `₹${(displayAmount / 10000000).toFixed(1)}Cr` : '—'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{lender.processing_time_days || '7-10'}d</span>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-4 pb-4 pt-2 border-t border-border/50 animate-fade-in">
          {/* AI Insight - Enhanced with comparison badges */}
          <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-info/5 border border-primary/15">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Why This Lender?</p>
                <p className="text-sm text-foreground leading-relaxed mb-2">
                  {lender.student_facing_reason || 'Matched based on your loan requirements and financial profile.'}
                </p>
                
                {/* Comparison Badges */}
                {getComparisonBadges(lender).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {getComparisonBadges(lender).map((badge, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expenses Covered */}
          <div className="mb-3">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">What's Covered</p>
            <div className="grid grid-cols-2 gap-2">
              {expensesCovered.map((expense, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-success/5 border border-success/10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
                  <span className="text-xs text-foreground/80">
                    {typeof expense === 'string' ? expense : expense.name || 'Covered'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex gap-3">
            <div className="flex-1 p-3 rounded-lg bg-muted/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Moratorium</p>
              <p className="text-sm font-semibold text-foreground">{lender.moratorium_period || 'Course + 6 months'}</p>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-muted/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Processing Fee</p>
              <p className="text-sm font-semibold text-foreground">{formatProcessingFee(lender.processing_fee)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LenderRowCard;
