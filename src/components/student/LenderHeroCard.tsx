import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Trophy,
  Check,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface LenderHeroCardProps {
  lender: {
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
    key_features: string[] | null;
    compatibility_score: number;
    student_facing_reason?: string;
  };
  universityName?: string;
  isSelected: boolean;
  onSelect: () => void;
  isUpdating: boolean;
}

const LenderHeroCard = ({
  lender,
  universityName,
  isSelected,
  onSelect,
  isUpdating
}: LenderHeroCardProps) => {
  const loanAmount = lender.loan_amount_max 
    ? formatCurrency(lender.loan_amount_max) 
    : '—';
    
  const interestRate = lender.interest_rate_min && lender.interest_rate_max 
    ? `${lender.interest_rate_min}% - ${lender.interest_rate_max}%` 
    : '—';
    
  const approvalDays = lender.processing_time_days || 7;

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all duration-300",
      isSelected 
        ? "border-primary shadow-xl ring-2 ring-primary/20" 
        : "border-primary/30 hover:border-primary/60 hover:shadow-lg",
      isUpdating && "opacity-60 pointer-events-none"
    )}>
      {/* Gradient Background Accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5" />
      
      {/* Trophy Badge */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
          <Trophy className="h-3.5 w-3.5" />
          TOP RECOMMENDATION
        </div>
      </div>

      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-5">
          <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-background shadow-sm border flex items-center justify-center">
            {lender.logo_url ? (
              <img 
                src={lender.logo_url} 
                alt={lender.lender_name} 
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
              />
            ) : (
              <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {lender.lender_name}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <Badge className="bg-primary text-primary-foreground font-bold text-sm px-3 py-1">
                {lender.compatibility_score}% Match
              </Badge>
              {lender.approval_rate && lender.approval_rate >= 80 && (
                <span className="text-sm text-success font-medium flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {lender.approval_rate}% approval rate
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed">
              {lender.student_facing_reason || 
                `Based on your profile${universityName ? ` and ${universityName}` : ''}, ${lender.lender_name} has the highest approval probability for your application.`
              }
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 rounded-xl bg-background shadow-sm border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Up to
            </p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{loanAmount}</p>
            <p className="text-xs text-muted-foreground mt-1">Eligible Amount</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-background shadow-sm border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Interest
            </p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{interestRate}</p>
            <p className="text-xs text-muted-foreground mt-1">Per Annum</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-background shadow-sm border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Approval
            </p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{approvalDays}</p>
            <p className="text-xs text-muted-foreground mt-1">Days</p>
          </div>
        </div>

        {/* Key Features */}
        {lender.key_features && lender.key_features.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {lender.key_features.slice(0, 4).map((feature, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="h-4 w-4 text-success" />
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <Button
          onClick={onSelect}
          disabled={isUpdating}
          size="lg"
          className={cn(
            "w-full mt-8 h-14 text-lg font-semibold",
            isSelected 
              ? "bg-success hover:bg-success/90" 
              : "bg-primary hover:bg-primary/90"
          )}
        >
          {isSelected ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Selected as Your Lender
            </>
          ) : (
            `Continue with ${lender.lender_name}`
          )}
        </Button>
      </div>
    </Card>
  );
};

export default LenderHeroCard;
