import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

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

const LenderCard = ({ lender, isSelected, onSelect, isUpdating }: LenderCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const maxEligible = lender.loan_amount_max 
    ? formatCurrency(lender.loan_amount_max) 
    : 'Not specified';

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-success/15 text-success border-success/30';
    if (score >= 70) return 'bg-primary/15 text-primary border-primary/30';
    return 'bg-warning/15 text-warning border-warning/30';
  };

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 ${
        isSelected 
          ? 'border-2 border-primary shadow-primary scale-[1.02]' 
          : 'border-2 border-border hover:border-primary/40 hover:shadow-lg hover:scale-[1.01]'
      } ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Recommended Badge Ribbon */}
      {lender.is_preferred && (
        <div className="absolute top-4 -right-10 rotate-45 bg-gradient-to-r from-warning to-amber-500 text-white text-xs font-bold py-1 px-12 shadow-lg z-10">
          RECOMMENDED
        </div>
      )}

      {/* Selected Overlay Glow */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      )}

      {/* Header */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start gap-4">
          {/* Logo with Gradient Background */}
          <div className={`relative flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-xl transition-all duration-300 ${
            isSelected 
              ? 'bg-gradient-to-br from-primary/20 to-primary/10 shadow-md' 
              : 'bg-gradient-to-br from-primary/10 to-muted group-hover:from-primary/15 group-hover:to-muted'
          }`}>
            {lender.logo_url ? (
              <img 
                src={lender.logo_url} 
                alt={lender.lender_name}
                className="w-14 h-14 object-contain"
              />
            ) : (
              <Building2 className={`h-8 w-8 transition-colors ${
                isSelected ? 'text-primary' : 'text-primary/70 group-hover:text-primary'
              }`} />
            )}
            {lender.is_preferred && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-warning rounded-full flex items-center justify-center shadow-md animate-pulse-soft">
                <Star className="h-3.5 w-3.5 text-white fill-white" />
              </div>
            )}
          </div>

          {/* Name & Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-xl leading-tight mb-2 text-foreground group-hover:text-primary transition-colors">
              {lender.lender_name}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Max: <span className="font-semibold text-foreground">{maxEligible}</span></span>
              </div>
              <span className="text-muted-foreground/40">•</span>
              <Badge 
                variant="secondary" 
                className={`font-semibold border ${getScoreBadgeColor(lender.compatibility_score)}`}
              >
                {lender.compatibility_score}% Match
              </Badge>
            </div>
          </div>

          {/* Selection Button */}
          {isSelected ? (
            <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-primary shadow-primary animate-scale-in">
              <Check className="h-6 w-6 text-primary-foreground" />
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onSelect}
              disabled={isUpdating}
              className="flex-shrink-0 shadow-sm hover:shadow-md transition-all"
            >
              Select
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Grid - Enhanced Design */}
      <div className="px-6 pb-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 hover:border-primary/20 transition-colors">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Percent className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Interest Rate</p>
              <p className="text-sm font-bold text-foreground">
                {lender.interest_rate_min && lender.interest_rate_max
                  ? `${lender.interest_rate_min}% - ${lender.interest_rate_max}%`
                  : 'On request'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gradient-to-br from-success/5 to-transparent border border-success/10 hover:border-success/20 transition-colors">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Processing</p>
              <p className="text-sm font-bold text-foreground">
                {lender.processing_time_days ? `${lender.processing_time_days} days` : 'Quick'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gradient-to-br from-accent/5 to-transparent border border-accent/10 hover:border-accent/20 transition-colors">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Loan Range</p>
              <p className="text-sm font-bold text-foreground truncate">
                {lender.loan_amount_min && lender.loan_amount_max
                  ? `₹${(lender.loan_amount_min / 100000).toFixed(0)}L - ${(lender.loan_amount_max / 100000).toFixed(0)}L`
                  : 'Flexible'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gradient-to-br from-warning/5 to-transparent border border-warning/10 hover:border-warning/20 transition-colors">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Approval</p>
              <p className="text-sm font-bold text-foreground">
                {lender.approval_rate ? `${lender.approval_rate}%` : 'High'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Features - Enhanced */}
      {lender.key_features && lender.key_features.length > 0 && (
        <div className="px-6 pb-5">
          <Separator className="mb-4" />
          <div className="space-y-2.5">
            {lender.key_features.slice(0, 3).map((feature, index) => (
              <div 
                key={index} 
                className="flex items-start gap-2.5 group/feature animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success/10 flex items-center justify-center mt-0.5 group-hover/feature:bg-success/20 transition-colors">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                </div>
                <span className="text-sm text-muted-foreground leading-relaxed group-hover/feature:text-foreground transition-colors">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions - Enhanced */}
      <div className="px-6 pb-5 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 group/btn hover:border-primary/50 transition-all"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1.5 group-hover/btn:animate-bounce-soft" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1.5 group-hover/btn:animate-bounce-soft" />
              View Details
            </>
          )}
        </Button>
        {lender.website && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex-1 group/btn hover:border-primary/50 hover:text-primary transition-all"
          >
            <a href={lender.website} target="_blank" rel="noopener noreferrer">
              Website
              <ExternalLink className="h-4 w-4 ml-1.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </a>
          </Button>
        )}
      </div>

      {/* Expanded Details - Enhanced with better animations */}
      {isExpanded && (
        <div className="border-t border-border animate-accordion-down">
          {/* Description */}
          {lender.lender_description && (
            <div className="px-6 py-5 bg-gradient-to-br from-muted/30 to-transparent">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lender.lender_description}
              </p>
            </div>
          )}

          {/* Financial Details */}
          <div className="px-6 py-5 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              Financial Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {lender.processing_fee && (
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-background transition-colors">
                  <span className="text-muted-foreground">Processing Fee:</span>
                  <span className="ml-auto font-semibold">{formatCurrency(lender.processing_fee)}</span>
                </div>
              )}
              {lender.foreclosure_charges && (
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-background transition-colors">
                  <span className="text-muted-foreground">Foreclosure:</span>
                  <span className="ml-auto font-semibold">{lender.foreclosure_charges}%</span>
                </div>
              )}
              {lender.moratorium_period && (
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-background transition-colors sm:col-span-2">
                  <span className="text-muted-foreground">Moratorium:</span>
                  <span className="ml-auto font-semibold">{lender.moratorium_period}</span>
                </div>
              )}
            </div>
          </div>

          {/* Eligible Expenses */}
          {lender.eligible_expenses && lender.eligible_expenses.length > 0 && (
            <div className="px-6 py-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                Eligible Expenses
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lender.eligible_expenses.map((expense: any, index: number) => {
                  const IconComponent = iconMap[expense.icon] || GraduationCap;
                  return (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-muted/50 to-transparent border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all group/expense"
                    >
                      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 group-hover/expense:bg-primary/15 transition-colors">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold mb-1">{expense.category}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{expense.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Processing Info */}
          {(lender.processing_time_days || lender.disbursement_time_days) && (
            <div className="px-6 py-5 bg-gradient-to-br from-success/5 via-transparent to-transparent">
              <h4 className="text-xs font-bold uppercase tracking-wider text-success mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-success rounded-full" />
                Processing Timeline
              </h4>
              <div className="space-y-3 text-sm">
                {lender.processing_time_days && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-success/10">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-muted-foreground">Processing Time:</span>
                    <span className="ml-auto font-bold text-success">{lender.processing_time_days} business days</span>
                  </div>
                )}
                {lender.disbursement_time_days && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-success/10">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-muted-foreground">Disbursement:</span>
                    <span className="ml-auto font-bold text-success">{lender.disbursement_time_days} days after approval</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Required Documents */}
          {lender.required_documents && lender.required_documents.length > 0 && (
            <div className="px-6 py-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                Required Documents
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lender.required_documents.map((doc: string, index: number) => (
                  <div key={index} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors group/doc">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center group-hover/doc:bg-primary/15 transition-colors">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover/doc:text-foreground transition-colors">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info */}
          {(lender.contact_email || lender.contact_phone) && (
            <div className="px-6 py-5 bg-gradient-to-br from-accent/5 via-transparent to-transparent border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-accent rounded-full" />
                Contact Details
              </h4>
              <div className="space-y-2">
                {lender.contact_email && (
                  <a 
                    href={`mailto:${lender.contact_email}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-accent/10 hover:border-accent/30 hover:shadow-sm text-sm text-primary hover:text-accent transition-all group/contact"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-accent" />
                    </div>
                    <span className="group-hover/contact:underline">{lender.contact_email}</span>
                  </a>
                )}
                {lender.contact_phone && (
                  <a 
                    href={`tel:${lender.contact_phone}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-accent/10 hover:border-accent/30 hover:shadow-sm text-sm text-primary hover:text-accent transition-all group/contact"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-accent" />
                    </div>
                    <span className="group-hover/contact:underline">{lender.contact_phone}</span>
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
