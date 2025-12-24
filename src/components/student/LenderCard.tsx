import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Percent, Clock, TrendingUp, CheckCircle2, ExternalLink, Mail, Phone, ChevronDown, ChevronUp, GraduationCap, BookOpen, Plane, Home, Shield, DollarSign, Star, Check } from 'lucide-react';
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
const LenderCard = ({
  lender,
  isSelected,
  onSelect,
  isUpdating
}: LenderCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Standardized display values with fallbacks
  const maxEligible = lender.loan_amount_max ? formatCurrency(lender.loan_amount_max) : '—';
  const interestRate = lender.interest_rate_min && lender.interest_rate_max 
    ? `${lender.interest_rate_min}% - ${lender.interest_rate_max}%` 
    : '—';
  const processingTime = lender.processing_time_days 
    ? `${lender.processing_time_days} days` 
    : '—';
  const loanRange = lender.loan_amount_min && lender.loan_amount_max 
    ? `${formatCurrency(lender.loan_amount_min)} - ${formatCurrency(lender.loan_amount_max)}` 
    : '—';
  const approvalRate = lender.approval_rate 
    ? `${lender.approval_rate}%` 
    : '—';

  return (
    <Card className={`flex flex-col h-full transition-all duration-300 hover-lift premium-card ${isSelected ? 'border-2 border-primary bg-primary/5 shadow-lg animate-glow' : 'border-2 border-border hover:border-primary/30'} ${isUpdating ? 'opacity-50' : ''}`}>
      {/* Header - Fixed Height */}
      <div className="p-5 pb-3 min-h-[88px]">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-primary/10'}`}>
            {lender.logo_url ? (
              <img src={lender.logo_url} alt={lender.lender_name} className="w-10 h-10 object-contain" />
            ) : (
              <Building2 className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-primary/70'}`} />
            )}
          </div>

          {/* Name & Badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-base leading-tight truncate">{lender.lender_name}</h3>
              {lender.is_preferred && (
                <Badge variant="warning" className="flex-shrink-0 text-xs px-1.5 py-0.5">
                  <Star className="h-3 w-3 mr-0.5" />
                  Top
                </Badge>
              )}
            </div>
            <Badge variant="secondary" className="font-semibold text-xs">
              {lender.compatibility_score}% Match
            </Badge>
          </div>

          {/* Selection */}
          {isSelected ? (
            <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-primary animate-scale-in">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          ) : (
            <Button size="sm" onClick={onSelect} disabled={isUpdating} className="flex-shrink-0 h-9 px-3 text-xs">
              Select
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Grid - Fixed Layout */}
      <div className="px-5 pb-4 flex-1">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="flex items-start gap-2">
            <DollarSign className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Max Eligible</p>
              <p className="text-sm font-semibold truncate">{maxEligible}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Percent className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Interest Rate</p>
              <p className="text-sm font-semibold truncate">{interestRate}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Processing</p>
              <p className="text-sm font-semibold truncate">{processingTime}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Approval Rate</p>
              <p className="text-sm font-semibold truncate">{approvalRate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions - Fixed at Bottom */}
      <div className="px-5 pb-4 pt-2 border-t border-border mt-auto">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="flex-1 h-8 text-xs">
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                Details
              </>
            )}
          </Button>
          {lender.website && (
            <Button variant="outline" size="sm" asChild className="flex-1 h-8 text-xs">
              <a href={lender.website} target="_blank" rel="noopener noreferrer">
                Website
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border animate-accordion-down">
          {/* Description */}
          {lender.lender_description && (
            <div className="px-5 py-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lender.lender_description}
              </p>
            </div>
          )}

          {/* Key Features */}
          {lender.key_features && lender.key_features.length > 0 && (
            <div className="px-5 py-4 bg-muted/30">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Key Features</h4>
              <div className="space-y-2">
                {lender.key_features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loan Details */}
          <div className="px-5 py-4">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Loan Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Loan Range</p>
                <p className="font-medium">{loanRange}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Processing Fee</p>
                <p className="font-medium">{lender.processing_fee ? `${lender.processing_fee}%` : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Moratorium</p>
                <p className="font-medium">{lender.moratorium_period || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Disbursement</p>
                <p className="font-medium">{lender.disbursement_time_days ? `${lender.disbursement_time_days} days` : '—'}</p>
              </div>
            </div>
          </div>

          {/* Eligible Expenses */}
          {lender.eligible_expenses && lender.eligible_expenses.length > 0 && (
            <div className="px-5 py-4 bg-muted/30">
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

          {/* Required Documents */}
          {lender.required_documents && lender.required_documents.length > 0 && (
            <div className="px-5 py-4">
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
            <div className="px-5 py-4 bg-muted/30">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Contact</h4>
              <div className="space-y-2">
                {lender.contact_email && (
                  <a href={`mailto:${lender.contact_email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Mail className="h-4 w-4" />
                    {lender.contact_email}
                  </a>
                )}
                {lender.contact_phone && (
                  <a href={`tel:${lender.contact_phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
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