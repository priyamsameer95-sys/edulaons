import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Check,
  Clock,
  TrendingUp,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface LenderCardProps {
  lender: {
    lender_id: string;
    lender_name: string;
    lender_code: string;
    lender_description: string | null;
    logo_url: string | null;
    website: string | null;
    interest_rate_min: number | null;
    interest_rate_max: number | null;
    loan_amount_min: number | null;
    loan_amount_max: number | null;
    processing_fee: number | null;
    moratorium_period: string | null;
    processing_time_days: number | null;
    approval_rate: number | null;
    key_features: string[] | null;
    compatibility_score: number;
    is_preferred: boolean;
    student_facing_reason?: string;
    probability_band?: 'high' | 'medium' | 'low';
  };
  isSelected: boolean;
  onSelect: () => void;
  isUpdating: boolean;
  showDetails?: boolean;
  onDetailsClick?: () => void;
}

const LenderCard = ({
  lender,
  isSelected,
  onSelect,
  isUpdating,
  showDetails = true,
  onDetailsClick
}: LenderCardProps) => {
  const loanRange = lender.loan_amount_min && lender.loan_amount_max 
    ? `${formatCurrency(lender.loan_amount_min)} - ${formatCurrency(lender.loan_amount_max)}`
    : lender.loan_amount_max 
      ? `Up to ${formatCurrency(lender.loan_amount_max)}`
      : '—';
      
  const interestRate = lender.interest_rate_min && lender.interest_rate_max 
    ? `${lender.interest_rate_min}% - ${lender.interest_rate_max}%` 
    : lender.interest_rate_min 
      ? `From ${lender.interest_rate_min}%` 
      : '—';
      
  const approvalTime = lender.processing_time_days 
    ? `${lender.processing_time_days} days` 
    : '7-10 days';

  const topFeatures = lender.key_features?.slice(0, 3) || [];

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isSelected 
          ? "ring-2 ring-primary shadow-lg" 
          : "hover:shadow-md hover:border-primary/30",
        isUpdating && "opacity-60 pointer-events-none"
      )}
    >
      {/* Top Recommendation Badge */}
      {lender.is_preferred && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm">
            TOP PICK
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Header: Logo + Name + Match */}
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center",
            isSelected ? "bg-primary/10" : "bg-muted"
          )}>
            {lender.logo_url ? (
              <img 
                src={lender.logo_url} 
                alt={lender.lender_name} 
                className="w-12 h-12 object-contain"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground leading-tight">
              {lender.lender_name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge 
                variant="secondary" 
                className="font-semibold text-xs bg-primary/10 text-primary border-0"
              >
                {lender.compatibility_score}% Match
              </Badge>
              {lender.probability_band === 'high' && (
                <Badge 
                  variant="outline" 
                  className="text-[10px] border-success/40 text-success bg-success/5"
                >
                  High Approval
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* AI Reason */}
        {lender.student_facing_reason && (
          <p className="mt-4 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 border-l-2 border-primary/40">
            "{lender.student_facing_reason}"
          </p>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
              Loan Amount
            </p>
            <p className="text-sm font-bold text-foreground">{loanRange}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
              Interest
            </p>
            <p className="text-sm font-bold text-foreground">{interestRate}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
              Approval
            </p>
            <p className="text-sm font-bold text-foreground">{approvalTime}</p>
          </div>
        </div>

        {/* Key Benefits */}
        {topFeatures.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {topFeatures.map((feature, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Check className="h-3.5 w-3.5 text-success" />
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 pt-2 flex gap-3">
        <Button
          onClick={onSelect}
          disabled={isUpdating}
          className={cn(
            "flex-1 h-11",
            isSelected && "bg-success hover:bg-success/90"
          )}
        >
          {isSelected ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Selected
            </>
          ) : (
            'Select This Lender'
          )}
        </Button>
        
        {showDetails && lender.website && (
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            asChild
          >
            <a href={lender.website} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
};

export default LenderCard;
