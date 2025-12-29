import { Button } from '@/components/ui/button';
import { Building2, Check, Star } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface LenderData {
  lender_id: string;
  lender_name: string;
  lender_code: string;
  logo_url: string | null;
  interest_rate_min: number | null;
  interest_rate_max: number | null;
  loan_amount_min: number | null;
  loan_amount_max: number | null;
  processing_time_days: number | null;
  approval_rate: number | null;
  compatibility_score: number;
  is_preferred: boolean;
  eligible_loan_max?: number | null;
  student_facing_reason?: string;
}

interface LenderComparisonGridProps {
  lenders: LenderData[];
  selectedLenderId: string | null;
  onSelect: (lenderId: string) => void;
  isUpdating: boolean;
}

const LenderComparisonGrid = ({
  lenders,
  selectedLenderId,
  onSelect,
  isUpdating
}: LenderComparisonGridProps) => {
  if (lenders.length === 0) return null;

  const topLender = lenders[0];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Your Loan Options</h3>
        <p className="text-sm text-muted-foreground">Personalized based on your profile</p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Lender</th>
                <th className="text-center p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Match</th>
                <th className="text-center p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="text-center p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Rate</th>
                <th className="text-center p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Time</th>
                <th className="text-center p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {lenders.map((lender, index) => {
                const isSelected = selectedLenderId === lender.lender_id;
                const isTop = index === 0;
                
                return (
                  <tr 
                    key={lender.lender_id}
                    className={cn(
                      "border-b last:border-0 transition-colors",
                      isSelected && "bg-success/5",
                      isTop && !isSelected && "bg-primary/5",
                      !isSelected && !isTop && "hover:bg-muted/30",
                      isUpdating && "opacity-60"
                    )}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {lender.logo_url ? (
                            <img src={lender.logo_url} alt={lender.lender_name} className="w-7 h-7 object-contain" />
                          ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{lender.lender_name}</span>
                            {isTop && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "font-bold text-sm",
                        lender.compatibility_score >= 80 ? "text-success" : "text-foreground"
                      )}>
                        {lender.compatibility_score}%
                      </span>
                    </td>
                    <td className="p-4 text-center font-semibold text-sm">
                      {lender.eligible_loan_max 
                        ? formatCurrency(lender.eligible_loan_max) 
                        : lender.loan_amount_max 
                          ? formatCurrency(lender.loan_amount_max) 
                          : '—'}
                    </td>
                    <td className="p-4 text-center text-sm">
                      {lender.interest_rate_min ? `${lender.interest_rate_min}%` : '—'}
                    </td>
                    <td className="p-4 text-center text-sm text-muted-foreground">
                      {lender.processing_time_days ? `${lender.processing_time_days}d` : '7-10d'}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => onSelect(lender.lender_id)}
                        disabled={isUpdating}
                        className={cn(
                          "min-w-[80px] h-8 text-xs",
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - Horizontal Scroll */}
      <div className="md:hidden">
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4">
          {lenders.map((lender, index) => {
            const isSelected = selectedLenderId === lender.lender_id;
            const isTop = index === 0;
            
            return (
              <div 
                key={lender.lender_id}
                className={cn(
                  "flex-shrink-0 w-[280px] snap-start rounded-xl border bg-card p-4 transition-all",
                  isSelected && "border-success bg-success/5",
                  isTop && !isSelected && "border-primary/50",
                  isUpdating && "opacity-60"
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
                      {lender.eligible_loan_max 
                        ? `₹${(lender.eligible_loan_max / 100000).toFixed(0)}L`
                        : lender.loan_amount_max 
                          ? `₹${(lender.loan_amount_max / 100000).toFixed(0)}L`
                          : '—'}
                    </p>
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Amount</p>
                  </div>
                  <div className="text-center border-x">
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
                  onClick={() => onSelect(lender.lender_id)}
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
          })}
        </div>
      </div>

      {/* Why Recommended - Only for top lender */}
      {topLender.student_facing_reason && (
        <div className="text-center px-4 py-3 rounded-lg bg-muted/30 border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Why {topLender.lender_name}?</span>{' '}
            {topLender.student_facing_reason}
          </p>
        </div>
      )}
    </div>
  );
};

export default LenderComparisonGrid;
