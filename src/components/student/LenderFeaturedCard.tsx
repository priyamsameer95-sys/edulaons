import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Star, 
  Check, 
  ChevronDown, 
  CheckCircle2,
  Brain,
  ArrowRight,
  Sparkles
} from 'lucide-react';
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
  
  const getTagline = () => {
    if (lender.lender_description) return lender.lender_description;
    if (lender.interest_rate_min && lender.interest_rate_min < 9) return 'Lowest Interest Rates';
    if (lender.processing_time_days && lender.processing_time_days <= 7) return 'Fast Processing';
    if (lender.compatibility_score >= 95) return 'Perfect Match';
    return 'Education Loan Expert';
  };

  const expensesCovered = lender.eligible_expenses?.length 
    ? lender.eligible_expenses.slice(0, 3)
    : ['100% Tuition Fees', 'Living Expenses', 'Travel & Laptop'];

  const displayAmount = lender.eligible_loan_max || lender.loan_amount_max;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-all duration-200 flex flex-col",
        isTopMatch && "border-warning/40 shadow-lg shadow-warning/10",
        isSelected && "ring-2 ring-success border-success",
        !isTopMatch && !isSelected && "border-border hover:border-border/80",
        isUpdating && "opacity-60 pointer-events-none"
      )}
    >
      {/* Header Section - Logo, Name, Badge */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 border border-border/30">
            {lender.logo_url ? (
              <img 
                src={lender.logo_url} 
                alt={lender.lender_name} 
                className="w-8 h-8 object-contain" 
              />
            ) : (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          
          {/* Name & Tagline */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-foreground text-base leading-tight truncate">
                {lender.lender_name}
              </h4>
              {isTopMatch && <Star className="h-4 w-4 text-warning fill-warning flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{getTagline()}</p>
          </div>
          
          {/* Badge - Right side */}
          <div className="flex-shrink-0">
            {isTopMatch ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10 text-warning text-[10px] font-bold uppercase tracking-wide border border-warning/20">
                <Sparkles className="h-3 w-3" />
                Top Match
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted/50 text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
                #{rank}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* AI Insight Box - Fixed Height */}
      <div className="px-4">
        <div className={cn(
          "rounded-lg p-3 min-h-[72px] flex flex-col",
          lender.student_facing_reason 
            ? "bg-info/5 border border-info/20" 
            : "bg-muted/30 border border-border/30"
        )}>
          {lender.student_facing_reason ? (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <Brain className="h-3.5 w-3.5 text-info" />
                <span className="text-[10px] font-semibold text-info uppercase tracking-wider">AI Insight</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2 flex-1">
                {lender.student_facing_reason}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic my-auto">
              AI analysis pending...
            </p>
          )}
        </div>
      </div>

      {/* Key Metrics - 2x2 Grid with white boxes */}
      <div className="p-4 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background rounded-lg py-3 px-2 text-center border border-border/40">
            <p className={cn(
              "text-xl font-bold leading-none tabular-nums",
              lender.compatibility_score >= 80 ? "text-success" : 
              lender.compatibility_score >= 60 ? "text-foreground" : "text-muted-foreground"
            )}>
              {lender.compatibility_score}%
            </p>
            <p className="text-[9px] uppercase text-muted-foreground tracking-wider mt-1.5 font-semibold">Match</p>
          </div>
          
          <div className="bg-background rounded-lg py-3 px-2 text-center border border-border/40">
            <p className="text-xl font-bold text-foreground leading-none tabular-nums">
              {lender.interest_rate_min ? `${lender.interest_rate_min}%` : '—'}
            </p>
            <p className="text-[9px] uppercase text-muted-foreground tracking-wider mt-1.5 font-semibold">Rate</p>
          </div>
          
          <div className="bg-background rounded-lg py-3 px-2 text-center border border-border/40">
            <p className="text-lg font-bold text-foreground leading-none tabular-nums">
              {displayAmount 
                ? `₹${(displayAmount / 10000000).toFixed(1)}Cr`
                : '—'}
            </p>
            <p className="text-[9px] uppercase text-muted-foreground tracking-wider mt-1.5 font-semibold">Amount</p>
          </div>
          
          <div className="bg-background rounded-lg py-3 px-2 text-center border border-border/40">
            <p className="text-xl font-bold text-foreground leading-none tabular-nums">
              {lender.processing_time_days || '7-10'}
            </p>
            <p className="text-[9px] uppercase text-muted-foreground tracking-wider mt-1.5 font-semibold">Days</p>
          </div>
        </div>
      </div>

      {/* View Detailed Toggle */}
      <div className="px-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          View Details
          <ChevronDown className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            showDetails && "rotate-180"
          )} />
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-4 pb-2 space-y-2 animate-fade-in border-t border-border/50 pt-3 mx-4">
          <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Expenses Covered</p>
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

      {/* Spacer */}
      <div className="flex-1 min-h-2" />

      {/* Select Button */}
      <div className="p-4 pt-2">
        <Button
          onClick={() => onSelect(lender.lender_id)}
          disabled={isUpdating}
          variant={isSelected ? "default" : isTopMatch ? "default" : "outline"}
          className={cn(
            "w-full h-11 font-semibold text-sm",
            isSelected && "bg-success hover:bg-success/90 border-success text-success-foreground",
            isTopMatch && !isSelected && "shadow-sm"
          )}
        >
          {isSelected ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Selected
            </>
          ) : (
            <>
              Select Offer
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default LenderFeaturedCard;
