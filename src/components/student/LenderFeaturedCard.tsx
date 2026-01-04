import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  moratorium_period?: string | null;
  processing_fee?: number | null;
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
  
  const expensesCovered = lender.eligible_expenses?.length 
    ? lender.eligible_expenses.slice(0, 4)
    : ['Tuition Fees', 'Living Expenses', 'Travel Costs', 'Books & Equipment'];

  const displayAmount = lender.eligible_loan_max || lender.loan_amount_max;

  // Generate benefit highlights based on lender data
  const getBenefits = () => {
    const benefits: { icon: typeof TrendingUp; text: string }[] = [];
    if (lender.interest_rate_min && lender.interest_rate_min < 9) {
      benefits.push({ icon: TrendingUp, text: 'Among the lowest rates in market' });
    }
    if (lender.processing_time_days && lender.processing_time_days <= 7) {
      benefits.push({ icon: Zap, text: 'Super fast approval' });
    }
    if (lender.moratorium_period) {
      benefits.push({ icon: Shield, text: `${lender.moratorium_period} moratorium` });
    }
    if (lender.compatibility_score >= 90) {
      benefits.push({ icon: CheckCircle2, text: 'Excellent profile match' });
    }
    return benefits.slice(0, 2);
  };

  const benefits = getBenefits();

  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-card overflow-hidden transition-all duration-300 flex flex-col h-full",
        isTopMatch && "border-warning shadow-xl shadow-warning/15 relative",
        isSelected && "ring-2 ring-success border-success shadow-lg shadow-success/10",
        !isTopMatch && !isSelected && "border-border/60 hover:border-primary/30 hover:shadow-lg",
        isUpdating && "opacity-60 pointer-events-none"
      )}
    >
      {/* Top Match Ribbon - or placeholder for consistent height */}
      {isTopMatch ? (
        <div className="bg-gradient-to-r from-warning to-warning/80 text-warning-foreground py-2.5 px-4 flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Best Match for You</span>
          <Sparkles className="h-4 w-4" />
        </div>
      ) : (
        <div className="h-[44px]" /> 
      )}

      {/* Header Section - Cleaner layout */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border",
            isTopMatch ? "bg-warning/5 border-warning/20" : "bg-muted/30 border-border/40"
          )}>
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
          
          {/* Name & Match Badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-foreground text-base leading-tight truncate">
                {lender.lender_name}
              </h4>
              {isTopMatch && <Star className="h-4 w-4 text-warning fill-warning flex-shrink-0" />}
            </div>
            
            {!isTopMatch && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold",
                  rank === 2 ? "bg-primary/10 text-primary" : "bg-info/10 text-info"
                )}>
                  <FileCheck className="h-3 w-3" />
                  {rank === 2 ? "Strong Alternative" : "Great Option"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Why This Lender - Proper height with full text visibility */}
      <div className="px-4 pb-3">
        <div className="bg-gradient-to-br from-primary/5 via-primary/8 to-info/5 rounded-lg p-3 border border-primary/10">
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wide mb-0.5">Why This Lender?</p>
              <p className="text-xs text-foreground leading-relaxed">
                {lender.student_facing_reason || 'Matched based on your loan requirements and financial profile.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats - Vertical layout for better readability */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Percent className="h-3.5 w-3.5 text-success" />
            </div>
            <p className="text-sm font-bold text-foreground tabular-nums">
              {lender.interest_rate_min ? `${lender.interest_rate_min}%` : '—'}
            </p>
            <p className="text-[9px] text-muted-foreground font-medium uppercase mt-0.5">Rate</p>
          </div>
          
          <div className="text-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Wallet className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground tabular-nums">
              {displayAmount ? `₹${(displayAmount / 10000000).toFixed(1)}Cr` : '—'}
            </p>
            <p className="text-[9px] text-muted-foreground font-medium uppercase mt-0.5">Max Loan</p>
          </div>
          
          <div className="text-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3.5 w-3.5 text-info" />
            </div>
            <p className="text-sm font-bold text-foreground tabular-nums">
              {lender.processing_time_days || '7-10'}d
            </p>
            <p className="text-[9px] text-muted-foreground font-medium uppercase mt-0.5">Process</p>
          </div>
        </div>
      </div>

      {/* View Details - Expandable Section */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={cn(
            "w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-all",
            "bg-muted/30 hover:bg-muted/50 border border-border/40",
            showDetails && "bg-muted/50"
          )}
        >
          <span className="text-xs font-semibold text-foreground">View Full Details</span>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-300",
            showDetails && "rotate-180"
          )} />
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-4 py-3 space-y-3 animate-fade-in border-t border-border/30">
          {/* Benefits */}
          {benefits.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2">Highlights</p>
              <div className="flex flex-wrap gap-1.5">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded bg-success/5 border border-success/15">
                    <benefit.icon className="h-3 w-3 text-success flex-shrink-0" />
                    <span className="text-[10px] text-foreground/80">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses Covered */}
          <div>
            <p className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2">What's Covered</p>
            <div className="grid grid-cols-2 gap-1.5">
              {expensesCovered.map((expense, idx) => (
                <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded bg-success/5 border border-success/10">
                  <CheckCircle2 className="h-3 w-3 text-success flex-shrink-0" />
                  <span className="text-[10px] text-foreground/80 truncate">
                    {typeof expense === 'string' ? expense : expense.name || 'Covered'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
            <div className="p-2 rounded bg-muted/30">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Moratorium</p>
              <p className="text-xs font-semibold text-foreground">{lender.moratorium_period || 'Course + 6mo'}</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Processing Fee</p>
              <p className="text-xs font-semibold text-foreground">{formatProcessingFee(lender.processing_fee)}</p>
            </div>
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
          className={cn(
            "w-full h-10 font-bold text-sm rounded-lg transition-all",
            isSelected 
              ? "bg-success hover:bg-success/90 text-success-foreground shadow-md shadow-success/20" 
              : isTopMatch 
                ? "bg-primary hover:bg-primary/90 shadow-md shadow-primary/20" 
                : ""
          )}
          variant={isSelected ? "default" : isTopMatch ? "default" : "outline"}
        >
          {isSelected ? (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              Selected
            </>
          ) : (
            <>
              Choose This Lender
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default LenderFeaturedCard;
