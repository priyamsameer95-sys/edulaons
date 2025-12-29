import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Star, 
  Check, 
  ChevronDown, 
  CheckCircle2,
  Brain,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

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
  lender_description?: string | null;
  eligible_expenses?: any[] | null;
}

interface LenderFeaturedCardProps {
  lender: LenderData;
  rank: number;
  isSelected: boolean;
  onSelect: (lenderId: string) => void;
  isUpdating: boolean;
}

const LenderFeaturedCard = ({
  lender,
  rank,
  isSelected,
  onSelect,
  isUpdating
}: LenderFeaturedCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const isTopMatch = rank === 1;
  
  // Generate a tagline based on lender characteristics
  const getTagline = () => {
    if (lender.lender_description) return lender.lender_description;
    if (lender.interest_rate_min && lender.interest_rate_min < 9) return 'Lowest Interest Rates';
    if (lender.processing_time_days && lender.processing_time_days <= 7) return 'Fast Processing';
    if (lender.compatibility_score >= 95) return 'Perfect Match';
    return 'Education Loan Expert';
  };

  // Default expenses covered if not provided
  const expensesCovered = lender.eligible_expenses?.length 
    ? lender.eligible_expenses.slice(0, 3)
    : ['100% Tuition Fees', 'Living Expenses', 'Travel & Laptop'];

  const displayAmount = lender.eligible_loan_max || lender.loan_amount_max;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-all flex flex-col",
        isTopMatch && "border-l-4 border-l-warning shadow-md",
        isSelected && "ring-2 ring-success border-success",
        !isTopMatch && !isSelected && "border-border",
        isUpdating && "opacity-60 pointer-events-none"
      )}
    >
      {/* Top Match Badge - Now inline, not absolute */}
      {isTopMatch && (
        <div className="px-4 pt-4 pb-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/15 text-warning text-[10px] font-bold uppercase tracking-wide">
            <Building2 className="h-3 w-3" />
            Top Match
          </span>
        </div>
      )}

      <div className={cn(
        "p-4 space-y-4 flex-1 flex flex-col",
        isTopMatch && "pt-3"
      )}>
        {/* Header: Logo + Name + Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-muted/80 flex items-center justify-center flex-shrink-0 border border-border/50">
            {lender.logo_url ? (
              <img 
                src={lender.logo_url} 
                alt={lender.lender_name} 
                className="w-7 h-7 object-contain" 
              />
            ) : (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-foreground text-sm leading-tight truncate">{lender.lender_name}</h4>
              {isTopMatch && <Star className="h-3.5 w-3.5 text-warning fill-warning flex-shrink-0" />}
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug truncate">{getTagline()}</p>
          </div>
        </div>

        {/* AI Insight Box */}
        {lender.student_facing_reason && (
          <div className="rounded-lg bg-info/5 border border-info/15 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Brain className="h-3.5 w-3.5 text-info" />
              <span className="text-[10px] font-semibold text-info uppercase tracking-wide">AI Insight</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">
              {lender.student_facing_reason}
            </p>
          </div>
        )}

        {/* Key Metrics - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className={cn(
              "text-xl font-bold leading-none",
              lender.compatibility_score >= 80 ? "text-success" : "text-foreground"
            )}>
              {lender.compatibility_score}%
            </p>
            <p className="text-[9px] uppercase text-muted-foreground tracking-wider mt-1 font-medium">Match</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className="text-xl font-bold text-foreground leading-none">
              {lender.interest_rate_min ? `${lender.interest_rate_min}%` : '—'}
            </p>
            <p className="text-[9px] uppercase text-muted-foreground tracking-wider mt-1 font-medium">Rate</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className="text-base font-bold text-foreground leading-none">
              {displayAmount 
                ? `₹${(displayAmount / 10000000).toFixed(1)} Cr`
                : '—'}
            </p>
            <p className="text-[9px] uppercase text-muted-foreground tracking-wider mt-1 font-medium">Amount</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className="text-xl font-bold text-foreground leading-none">
              {lender.processing_time_days || '7-10'}
            </p>
            <p className="text-[9px] uppercase text-muted-foreground tracking-wider mt-1 font-medium">Days</p>
          </div>
        </div>

        {/* View Detailed Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View Detailed
          <ChevronDown className={cn(
            "h-3 w-3 transition-transform",
            showDetails && "rotate-180"
          )} />
        </button>

        {/* Expanded Details */}
        {showDetails && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Expenses Covered</p>
            <div className="space-y-1.5">
              {expensesCovered.map((expense, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
                  <span className="text-xs text-foreground/80">
                    {typeof expense === 'string' ? expense : expense.name || 'Covered'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-1 min-h-2" />

        {/* Select Button */}
        <Button
          onClick={() => onSelect(lender.lender_id)}
          disabled={isUpdating}
          variant={isTopMatch ? "default" : "outline"}
          className={cn(
            "w-full h-10 font-semibold text-sm",
            isSelected && "bg-success hover:bg-success/90 border-success text-success-foreground",
            isTopMatch && !isSelected && "shadow-sm"
          )}
        >
          {isSelected ? (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              Selected
            </>
          ) : (
            <>
              Select Offer
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default LenderFeaturedCard;
