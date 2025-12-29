import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Check,
  Star,
  TrendingUp
} from 'lucide-react';
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
  processing_fee: number | null;
  processing_time_days: number | null;
  approval_rate: number | null;
  compatibility_score: number;
  is_preferred: boolean;
  probability_band?: 'high' | 'medium' | 'low';
}

interface LenderComparisonTableProps {
  lenders: LenderData[];
  selectedLenderId: string | null;
  onSelect: (lenderId: string) => void;
  isUpdating: boolean;
}

const LenderComparisonTable = ({
  lenders,
  selectedLenderId,
  onSelect,
  isUpdating
}: LenderComparisonTableProps) => {
  if (lenders.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left p-4 font-semibold text-sm text-muted-foreground">Lender</th>
            <th className="text-center p-4 font-semibold text-sm text-muted-foreground">Match</th>
            <th className="text-center p-4 font-semibold text-sm text-muted-foreground">Loan Amount</th>
            <th className="text-center p-4 font-semibold text-sm text-muted-foreground">Interest Rate</th>
            <th className="text-center p-4 font-semibold text-sm text-muted-foreground">Approval Time</th>
            <th className="text-center p-4 font-semibold text-sm text-muted-foreground">Processing Fee</th>
            <th className="text-center p-4 font-semibold text-sm text-muted-foreground"></th>
          </tr>
        </thead>
        <tbody>
          {lenders.map((lender, index) => {
            const isSelected = selectedLenderId === lender.lender_id;
            
            return (
              <tr 
                key={lender.lender_id}
                className={cn(
                  "border-b last:border-0 transition-colors",
                  isSelected ? "bg-primary/5" : "hover:bg-muted/30",
                  isUpdating && "opacity-60"
                )}
              >
                {/* Lender Name & Logo */}
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      isSelected ? "bg-primary/10" : "bg-muted"
                    )}>
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
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {lender.lender_name}
                        </span>
                        {lender.is_preferred && (
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                      {lender.probability_band === 'high' && (
                        <span className="text-xs text-success flex items-center gap-1 mt-0.5">
                          <TrendingUp className="h-3 w-3" />
                          High Approval
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                
                {/* Match Score */}
                <td className="p-4 text-center">
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "font-bold",
                      lender.compatibility_score >= 80 
                        ? "bg-success/10 text-success" 
                        : lender.compatibility_score >= 60 
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {lender.compatibility_score}%
                  </Badge>
                </td>
                
                {/* Loan Amount */}
                <td className="p-4 text-center font-medium text-sm">
                  {lender.loan_amount_max 
                    ? formatCurrency(lender.loan_amount_max) 
                    : '—'}
                </td>
                
                {/* Interest Rate */}
                <td className="p-4 text-center font-medium text-sm">
                  {lender.interest_rate_min && lender.interest_rate_max 
                    ? `${lender.interest_rate_min}% - ${lender.interest_rate_max}%` 
                    : '—'}
                </td>
                
                {/* Approval Time */}
                <td className="p-4 text-center font-medium text-sm">
                  {lender.processing_time_days 
                    ? `${lender.processing_time_days} days` 
                    : '7-10 days'}
                </td>
                
                {/* Processing Fee */}
                <td className="p-4 text-center font-medium text-sm">
                  {lender.processing_fee 
                    ? `${lender.processing_fee}%` 
                    : '—'}
                </td>
                
                {/* Select Button */}
                <td className="p-4 text-right">
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => onSelect(lender.lender_id)}
                    disabled={isUpdating}
                    className={cn(
                      "min-w-[90px]",
                      isSelected && "bg-success hover:bg-success/90"
                    )}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1" />
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
  );
};

export default LenderComparisonTable;
