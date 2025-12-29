import { Button } from '@/components/ui/button';
import { Building2, Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LenderCardProps {
  lender: {
    lender_id: string;
    lender_name: string;
    lender_code: string;
    logo_url: string | null;
    interest_rate_min: number | null;
    loan_amount_max: number | null;
    processing_time_days: number | null;
    compatibility_score: number;
    is_preferred: boolean;
    eligible_loan_max?: number | null;
  };
  rank?: number;
  isSelected?: boolean;
  onSelect?: () => void;
  isUpdating?: boolean;
}

const LenderCard = ({ 
  lender, 
  rank,
  isSelected = false, 
  onSelect,
  isUpdating = false
}: LenderCardProps) => {
  const isTop = rank === 1;
  const displayAmount = lender.eligible_loan_max || lender.loan_amount_max;

  return (
    <div 
      className={cn(
        "rounded-xl border bg-card p-4 transition-all",
        isSelected && "border-success bg-success/5",
        isTop && !isSelected && "border-primary/50",
        isUpdating && "opacity-60 pointer-events-none"
      )}
    >
      {/* Row 1: Logo + Name + Match */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          {lender.logo_url ? (
            <img src={lender.logo_url} alt={lender.lender_name} className="w-7 h-7 object-contain" />
          ) : (
            <Building2 className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {rank && (
              <span className="text-xs font-medium text-muted-foreground">#{rank}</span>
            )}
            <span className="font-semibold text-foreground truncate">{lender.lender_name}</span>
            {isTop && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
          </div>
        </div>
        <span className={cn(
          "font-bold text-sm flex-shrink-0",
          lender.compatibility_score >= 80 ? "text-success" : "text-foreground"
        )}>
          {lender.compatibility_score}%
        </span>
      </div>

      {/* Row 2: Key Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            {displayAmount 
              ? `₹${(displayAmount / 100000).toFixed(0)}L`
              : '—'}
          </p>
          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Amount</p>
        </div>
        <div className="text-center border-x border-border">
          <p className="text-lg font-bold text-foreground">
            {lender.interest_rate_min ? `${lender.interest_rate_min}%` : '—'}
          </p>
          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Rate</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            {lender.processing_time_days ? `${lender.processing_time_days}d` : '7d'}
          </p>
          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Time</p>
        </div>
      </div>

      {/* Row 3: Select Button */}
      <Button
        size="sm"
        variant={isSelected ? "default" : "outline"}
        onClick={onSelect}
        disabled={isUpdating}
        className={cn(
          "w-full h-9",
          isSelected && "bg-success hover:bg-success/90"
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
  );
};

export default LenderCard;
