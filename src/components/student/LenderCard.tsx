import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Percent, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  ExternalLink,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  BookOpen,
  Plane,
  Home,
  Shield,
  DollarSign,
  Star,
  Check,
  AlertTriangle,
  ThumbsUp,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LenderCardProps {
  lender: {
    lender_id: string;
    lender_name: string;
    lender_code: string;
    lender_description: string | null;
    logo_url: string | null;
    website: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    interest_rate_min: number | null;
    interest_rate_max: number | null;
    loan_amount_min: number | null;
    loan_amount_max: number | null;
    processing_fee: number | null;
    foreclosure_charges: number | null;
    moratorium_period: string | null;
    processing_time_days: number | null;
    disbursement_time_days: number | null;
    approval_rate: number | null;
    key_features: string[] | null;
    eligible_expenses: any[] | null;
    required_documents: string[] | null;
    compatibility_score: number;
    is_preferred: boolean;
    fit_group?: 'best_fit' | 'also_consider' | 'possible_but_risky' | 'not_suitable';
    student_facing_reason?: string;
    justification?: string;
    risk_flags?: string[];
    bre_rules_matched?: string[];
    probability_band?: 'high' | 'medium' | 'low';
    processing_time_estimate?: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  isUpdating: boolean;
}

const iconMap: Record<string, any> = {
  GraduationCap,
  BookOpen,
  Plane,
  Home,
  Shield
};

const FIT_GROUP_BADGE = {
  best_fit: {
    label: 'Best Fit',
    variant: 'success' as const,
    icon: Star,
  },
  also_consider: {
    label: 'Good Option',
    variant: 'secondary' as const,
    icon: ThumbsUp,
  },
  possible_but_risky: {
    label: 'May Work',
    variant: 'warning' as const,
    icon: AlertCircle,
  },
  not_suitable: {
    label: 'Not Ideal',
    variant: 'destructive' as const,
    icon: AlertTriangle,
  },
};

const PROBABILITY_COLORS = {
  high: 'bg-success text-success-foreground',
  medium: 'bg-warning text-warning-foreground',
  low: 'bg-destructive/80 text-destructive-foreground',
};

const LenderCard = ({ lender, isSelected, onSelect, isUpdating }: LenderCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const maxEligible = lender.loan_amount_max 
    ? formatCurrency(lender.loan_amount_max) 
    : 'Not specified';

  const fitGroup = lender.fit_group || (lender.is_preferred ? 'best_fit' : 'also_consider');
  const fitConfig = FIT_GROUP_BADGE[fitGroup];
  const FitIcon = fitConfig.icon;

  // Calculate score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success/20';
    if (score >= 60) return 'bg-primary/20';
    if (score >= 40) return 'bg-warning/20';
    return 'bg-destructive/20';
  };

  return (
    <Card 
      className={`transition-all duration-300 hover-lift premium-card ${
        isSelected 
          ? 'border-2 border-primary bg-primary/5 shadow-lg animate-glow' 
          : 'border-2 border-border hover:border-primary/30'
      } ${isUpdating ? 'opacity-50' : ''}`}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className={`flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-lg ${
            isSelected ? 'bg-primary/20' : 'bg-primary/10'
          }`}>
            {lender.logo_url ? (
              <img 
                src={lender.logo_url} 
                alt={lender.lender_name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <Building2 className={`h-7 w-7 ${isSelected ? 'text-primary' : 'text-primary/70'}`} />
            )}
          </div>

          {/* Name & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-lg leading-tight">{lender.lender_name}</h3>
              <Badge variant={fitConfig.variant} className="flex-shrink-0 gap-1">
                <FitIcon className="h-3 w-3" />
                {fitConfig.label}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Max: <span className="font-semibold text-foreground">{maxEligible}</span></span>
            </div>
          </div>

          {/* Selection Button */}
          {isSelected ? (
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary animate-scale-in">
              <Check className="h-5 w-5 text-primary-foreground" />
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onSelect}
              disabled={isUpdating}
              className="flex-shrink-0"
            >
              Select
            </Button>
          )}
        </div>

        {/* AI Match Score - Prominent Display */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Match Score</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Score based on your profile, loan requirements, and lender's eligibility criteria
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className={`text-2xl font-bold ${getScoreColor(lender.compatibility_score)}`}>
              {lender.compatibility_score}%
            </span>
          </div>
          <Progress 
            value={lender.compatibility_score} 
            className="h-2"
          />
          
          {/* Probability Band */}
          {lender.probability_band && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Approval Likelihood:</span>
              <Badge 
                variant="outline" 
                className={`text-xs ${PROBABILITY_COLORS[lender.probability_band]}`}
              >
                {lender.probability_band === 'high' ? 'High' : 
                 lender.probability_band === 'medium' ? 'Medium' : 'Lower'}
              </Badge>
            </div>
          )}
        </div>

        {/* AI Reasoning - Why this lender matches */}
        {lender.student_facing_reason && (
          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>{lender.student_facing_reason}</span>
            </p>
          </div>
        )}

        {/* Risk Flags */}
        {lender.risk_flags && lender.risk_flags.length > 0 && (
          <div className="mt-2 space-y-1">
            {lender.risk_flags.slice(0, 2).map((flag, index) => (
              <p key={index} className="text-xs flex items-start gap-2 text-warning">
                <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span>{flag}</span>
              </p>
            ))}
          </div>
        )}

        {/* BRE Rules Matched (collapsible) */}
        {lender.bre_rules_matched && lender.bre_rules_matched.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {lender.bre_rules_matched.slice(0, 3).map((rule, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-success/5 text-success border-success/30">
                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                {rule}
              </Badge>
            ))}
            {lender.bre_rules_matched.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{lender.bre_rules_matched.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Percent className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Interest Rate</p>
              <p className="text-sm font-semibold">
                {lender.interest_rate_min && lender.interest_rate_max
                  ? `${lender.interest_rate_min}% - ${lender.interest_rate_max}% p.a.`
                  : 'Contact for rates'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Processing Time</p>
              <p className="text-sm font-semibold">
                {lender.processing_time_estimate || 
                 (lender.processing_time_days ? `${lender.processing_time_days} days` : 'Contact for info')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <DollarSign className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Loan Range</p>
              <p className="text-sm font-semibold">
                {lender.loan_amount_min && lender.loan_amount_max
                  ? `${formatCurrency(lender.loan_amount_min)} - ${formatCurrency(lender.loan_amount_max)}`
                  : 'Flexible'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Approval Rate</p>
              <p className="text-sm font-semibold">
                {lender.approval_rate ? `${lender.approval_rate}%` : 'High'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Features */}
      {lender.key_features && lender.key_features.length > 0 && (
        <div className="px-6 pb-4">
          <Separator className="mb-3" />
          <div className="space-y-2">
            {lender.key_features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 pb-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              View Details
            </>
          )}
        </Button>
        {lender.website && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex-1"
          >
            <a href={lender.website} target="_blank" rel="noopener noreferrer">
              Website
              <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </Button>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border animate-accordion-down">
          {/* AI Justification (full) */}
          {lender.justification && lender.justification !== lender.student_facing_reason && (
            <div className="px-6 py-4 bg-muted/30">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">AI Analysis</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lender.justification}
              </p>
            </div>
          )}

          {/* Description */}
          {lender.lender_description && (
            <div className="px-6 py-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lender.lender_description}
              </p>
            </div>
          )}

          {/* Financial Details */}
          <div className="px-6 py-4 bg-muted/30">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Financial Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {lender.processing_fee && (
                <div>
                  <span className="text-muted-foreground">Processing Fee:</span>
                  <span className="ml-2 font-medium">{formatCurrency(lender.processing_fee)}</span>
                </div>
              )}
              {lender.foreclosure_charges && (
                <div>
                  <span className="text-muted-foreground">Foreclosure:</span>
                  <span className="ml-2 font-medium">{lender.foreclosure_charges}%</span>
                </div>
              )}
              {lender.moratorium_period && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Moratorium:</span>
                  <span className="ml-2 font-medium">{lender.moratorium_period}</span>
                </div>
              )}
            </div>
          </div>

          {/* Eligible Expenses */}
          {lender.eligible_expenses && lender.eligible_expenses.length > 0 && (
            <div className="px-6 py-4">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Eligible Expenses</h4>
              <div className="space-y-3">
                {lender.eligible_expenses.map((expense: any, index: number) => {
                  const IconComponent = iconMap[expense.icon] || GraduationCap;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <IconComponent className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{expense.category}</p>
                        <p className="text-xs text-muted-foreground">{expense.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Processing Info */}
          {(lender.processing_time_days || lender.disbursement_time_days) && (
            <div className="px-6 py-4 bg-muted/30">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Processing Details</h4>
              <div className="space-y-2 text-sm">
                {lender.processing_time_days && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Processing Time:</span>
                    <span className="font-medium">{lender.processing_time_days} business days</span>
                  </div>
                )}
                {lender.disbursement_time_days && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Disbursement:</span>
                    <span className="font-medium">{lender.disbursement_time_days} days after approval</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Required Documents */}
          {lender.required_documents && lender.required_documents.length > 0 && (
            <div className="px-6 py-4">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Required Documents</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lender.required_documents.map((doc: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info */}
          {(lender.contact_email || lender.contact_phone) && (
            <div className="px-6 py-4 bg-muted/30">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Contact Details</h4>
              <div className="space-y-2">
                {lender.contact_email && (
                  <a 
                    href={`mailto:${lender.contact_email}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {lender.contact_email}
                  </a>
                )}
                {lender.contact_phone && (
                  <a 
                    href={`tel:${lender.contact_phone}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {lender.contact_phone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default LenderCard;