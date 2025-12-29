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
        "relative rounded-xl border bg-card overflow-hidden transition-all flex flex-col",
        isTopMatch && "border-l-4 border-l-warning shadow-md",
        isSelected && "ring-2 ring-success border-success",
        !isTopMatch && !isSelected && "border-border",
        isUpdating && "opacity-60 pointer-events-none"
      )}
    >
      {/* Top Match Badge */}
      {isTopMatch && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/15 text-warning text-xs font-bold uppercase tracking-wide">
            <Building2 className="h-3.5 w-3.5" />
            Top Match
          </span>
        </div>
      )}

      <div className="p-6 space-y-5 flex-1 flex flex-col">
        {/* Header: Logo + Name + Tagline */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-muted/80 flex items-center justify-center flex-shrink-0 border border-border/50">
            {lender.logo_url ? (
              <img 
                src={lender.logo_url} 
                alt={lender.lender_name} 
                className="w-9 h-9 object-contain" 
              />
            ) : (
              <Building2 className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-foreground text-base leading-tight">{lender.lender_name}</h4>
              {isTopMatch && <Star className="h-4 w-4 text-warning fill-warning flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground leading-snug">{getTagline()}</p>
          </div>
        </div>

        {/* AI Insight Box */}
        {lender.student_facing_reason && (
          <div className="rounded-lg bg-info/5 border border-info/15 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-info/20 flex items-center justify-center">
                <Brain className="h-3 w-3 text-info" />
              </div>
              <span className="text-xs font-semibold text-info uppercase tracking-wide">AI Insight</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {lender.student_facing_reason}
            </p>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 py-4 border-y border-border/50">
          <div className="text-center px-1">
            <p className={cn(
              "text-2xl font-bold leading-none",
              lender.compatibility_score >= 80 ? "text-success" : "text-foreground"
            )}>
              {lender.compatibility_score}%
            </p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider mt-1.5 font-medium">Match</p>
          </div>
          <div className="text-center px-1 border-l border-border/50">
            <p className="text-2xl font-bold text-foreground leading-none">
              {lender.interest_rate_min ? `${lender.interest_rate_min}%` : '—'}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider mt-1.5 font-medium">Rate</p>
          </div>
          <div className="text-center px-1 border-l border-border/50">
            <p className="text-lg font-bold text-foreground leading-none">
              {displayAmount 
                ? `₹${(displayAmount / 10000000).toFixed(2)} Cr`
                : '—'}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider mt-1.5 font-medium">Amount</p>
          </div>
          <div className="text-center px-1 border-l border-border/50">
            <p className="text-2xl font-bold text-foreground leading-none">
              {lender.processing_time_days || '7-10'}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider mt-1.5 font-medium">Days</p>
          </div>
        </div>

        {/* View Detailed Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View Detailed
          <ChevronDown className={cn(
            "h-3.5 w-3.5 transition-transform",
            showDetails && "rotate-180"
          )} />
        </button>

        {/* Expanded Details */}
        {showDetails && (
          <div className="pt-3 space-y-3 animate-fade-in">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Expenses Covered</p>
            <div className="space-y-2">
              {expensesCovered.map((expense, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span className="text-sm text-foreground/80">
                    {typeof expense === 'string' ? expense : expense.name || 'Covered'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Select Button */}
        <Button
          onClick={() => onSelect(lender.lender_id)}
          disabled={isUpdating}
          variant={isTopMatch ? "default" : "outline"}
          size="lg"
          className={cn(
            "w-full font-semibold",
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
