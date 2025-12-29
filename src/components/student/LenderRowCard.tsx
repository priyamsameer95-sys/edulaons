import { Button } from '@/components/ui/button';
import { Building2, Check } from 'lucide-react';
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
}

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
  const displayAmount = lender.eligible_loan_max || lender.loan_amount_max;

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border bg-card transition-all",
        isSelected && "ring-2 ring-success border-success bg-success/5",
        !isSelected && "border-border hover:bg-muted/30",
        isUpdating && "opacity-60 pointer-events-none"
      )}
    >
      {/* Logo */}
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        {lender.logo_url ? (
          <img 
            src={lender.logo_url} 
            alt={lender.lender_name} 
            className="w-6 h-6 object-contain" 
          />
        ) : (
          <Building2 className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* Name + Match Score */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm truncate">{lender.lender_name}</p>
        <p className={cn(
          "text-xs font-semibold",
          lender.compatibility_score >= 50 ? "text-success" : "text-muted-foreground"
        )}>
          {lender.compatibility_score}% Match
        </p>
      </div>

      {/* Metrics */}
      <div className="hidden sm:flex items-center gap-6 text-sm">
        <div className="text-center min-w-[60px]">
          <p className="font-semibold text-foreground">
            {displayAmount 
              ? `₹${(displayAmount / 10000000).toFixed(2)} Cr`
              : '—'}
          </p>
          <p className="text-[10px] uppercase text-muted-foreground">Amount</p>
        </div>
        <div className="text-center min-w-[50px]">
          <p className="font-semibold text-foreground">
            {lender.interest_rate_min ? `${lender.interest_rate_min}%` : '—'}
          </p>
          <p className="text-[10px] uppercase text-muted-foreground">Rate</p>
        </div>
        <div className="text-center min-w-[40px]">
          <p className="font-semibold text-foreground">
            {lender.processing_time_days ? `${lender.processing_time_days}d` : '7-10d'}
          </p>
          <p className="text-[10px] uppercase text-muted-foreground">Time</p>
        </div>
      </div>

      {/* Select Button */}
      <Button
        size="sm"
        variant={isSelected ? "default" : "outline"}
        onClick={() => onSelect(lender.lender_id)}
        disabled={isUpdating}
        className={cn(
          "h-8 px-4 text-xs",
          isSelected && "bg-success hover:bg-success/90"
        )}
      >
        {isSelected ? (
          <>
            <Check className="h-3 w-3 mr-1" />
            Selected
          </>
        ) : (
          'Select'
        )}
      </Button>
    </div>
  );
};

export default LenderRowCard;
