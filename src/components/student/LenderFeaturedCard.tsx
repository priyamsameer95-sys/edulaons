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
        "relative rounded-xl border bg-card overflow-hidden transition-all",
        isTopMatch && "border-l-4 border-l-warning",
        isSelected && "ring-2 ring-success border-success",
        !isTopMatch && !isSelected && "border-border",
        isUpdating && "opacity-60 pointer-events-none"
      )}
    >
      {/* Top Match Badge */}
      {isTopMatch && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-xs font-semibold">
            <Building2 className="h-3 w-3" />
            Top Match
          </span>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Header: Logo + Name + Tagline */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
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
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground text-lg">{lender.lender_name}</h4>
              {isTopMatch && <Star className="h-4 w-4 text-warning fill-warning flex-shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground">{getTagline()}</p>
          </div>
        </div>

        {/* AI Insight Box */}
        {lender.student_facing_reason && (
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">AI Insight</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lender.student_facing_reason}
            </p>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className={cn(
              "text-xl font-bold",
              lender.compatibility_score >= 90 ? "text-success" : "text-foreground"
            )}>
              {lender.compatibility_score}%
            </p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider mt-0.5">Match</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">
              {lender.interest_rate_min ? `${lender.interest_rate_min}%` : '—'}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider mt-0.5">Rate</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">
              {displayAmount 
                ? `₹${(displayAmount / 10000000).toFixed(2)} Cr`
                : '—'}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider mt-0.5">Amount</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">
              {lender.processing_time_days ? `${lender.processing_time_days}` : '7-10'}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider mt-0.5">Days</p>
          </div>
        </div>

        {/* View Detailed Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          View Detailed
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            showDetails && "rotate-180"
          )} />
        </button>

        {/* Expanded Details */}
        {showDetails && (
          <div className="pt-2 border-t border-border space-y-3">
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Expenses Covered</p>
              <div className="space-y-1.5">
                {expensesCovered.map((expense, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {typeof expense === 'string' ? expense : expense.name || 'Covered'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Select Button */}
        <Button
          onClick={() => onSelect(lender.lender_id)}
          disabled={isUpdating}
          variant={isTopMatch ? "default" : "outline"}
          className={cn(
            "w-full h-11 text-sm font-medium",
            isSelected && "bg-success hover:bg-success/90 border-success"
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
