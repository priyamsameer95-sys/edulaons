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
    const benefits = [];
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
        "rounded-2xl border-2 bg-card overflow-hidden transition-all duration-300 flex flex-col",
        isTopMatch && "border-warning shadow-xl shadow-warning/15 relative",
        isSelected && "ring-2 ring-success border-success shadow-lg shadow-success/10",
        !isTopMatch && !isSelected && "border-border/60 hover:border-primary/30 hover:shadow-lg",
        isUpdating && "opacity-60 pointer-events-none"
      )}
    >
      {/* Top Match Ribbon */}
      {isTopMatch && (
        <div className="bg-gradient-to-r from-warning to-warning/80 text-warning-foreground py-2 px-4 flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Best Match for You</span>
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      {/* Header Section */}
      <div className="p-5 pb-4">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border-2",
            isTopMatch ? "bg-warning/5 border-warning/20" : "bg-muted/30 border-border/40"
          )}>
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
          
          {/* Name & Match */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-foreground text-lg leading-tight truncate">
                {lender.lender_name}
              </h4>
              {isTopMatch && <Star className="h-5 w-5 text-warning fill-warning flex-shrink-0" />}
            </div>
            
            {/* Match Score - Prominent */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className={cn(
                "px-2.5 py-1 rounded-full text-xs font-bold",
                lender.compatibility_score >= 85 ? "bg-success/10 text-success" :
                lender.compatibility_score >= 70 ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              )}>
                {lender.compatibility_score}% Match
              </div>
              {!isTopMatch && (
                <span className="text-xs text-muted-foreground">#{rank} Recommendation</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insight - Solid, prominent styling */}
      {lender.student_facing_reason && (
        <div className="px-5">
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-info/5 rounded-xl p-4 border border-primary/15">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Why This Lender?</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {lender.student_facing_reason}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics - Cleaner grid */}
      <div className="p-5">
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-lg bg-success/10 flex items-center justify-center mb-2">
              <Percent className="h-5 w-5 text-success" />
            </div>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {lender.interest_rate_min ? `${lender.interest_rate_min}%` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Rate</p>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {displayAmount ? `₹${(displayAmount / 10000000).toFixed(1)}Cr` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Max Loan</p>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-lg bg-info/10 flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-info" />
            </div>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {lender.processing_time_days || '7-10'}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Days</p>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-lg bg-warning/10 flex items-center justify-center mb-2">
              <FileCheck className="h-5 w-5 text-warning" />
            </div>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {lender.processing_fee ? `${lender.processing_fee}%` : '1%'}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Fee</p>
          </div>
        </div>
      </div>

      {/* Benefits Pills */}
      {benefits.length > 0 && (
        <div className="px-5 pb-2">
          <div className="flex flex-wrap gap-2">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 whitespace-nowrap">
                <benefit.icon className="h-3.5 w-3.5 text-success flex-shrink-0" />
                <span className="text-xs text-foreground/80 whitespace-nowrap">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Details - Expandable Section */}
      <div className="px-5 mt-1">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={cn(
            "w-full flex items-center justify-between py-3 px-4 rounded-xl transition-all",
            "bg-muted/30 hover:bg-muted/50 border border-border/40",
            showDetails && "bg-muted/50"
          )}
        >
          <span className="text-sm font-semibold text-foreground">View Full Details</span>
          <ChevronDown className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-300",
            showDetails && "rotate-180"
          )} />
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-5 py-4 space-y-4 animate-fade-in">
          {/* Expenses Covered */}
          <div>
            <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">What's Covered</p>
            <div className="grid grid-cols-2 gap-2">
              {expensesCovered.map((expense, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-success/5 border border-success/10">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span className="text-xs text-foreground/80 font-medium">
                    {typeof expense === 'string' ? expense : expense.name || 'Covered'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Moratorium</p>
              <p className="text-sm font-semibold text-foreground">{lender.moratorium_period || 'Course + 6 months'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Collateral</p>
              <p className="text-sm font-semibold text-foreground">May be required</p>
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1 min-h-3" />

      {/* Select Button */}
      <div className="p-5 pt-3">
        <Button
          onClick={() => onSelect(lender.lender_id)}
          disabled={isUpdating}
          size="lg"
          className={cn(
            "w-full h-12 font-bold text-sm rounded-xl transition-all",
            isSelected 
              ? "bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/20" 
              : isTopMatch 
                ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" 
                : ""
          )}
          variant={isSelected ? "default" : isTopMatch ? "default" : "outline"}
        >
          {isSelected ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Lender Selected
            </>
          ) : (
            <>
              Choose This Lender
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default LenderFeaturedCard;
