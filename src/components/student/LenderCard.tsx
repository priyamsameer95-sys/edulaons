import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Percent, 
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
  Star, 
  Check,
  Zap,
  FileText
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
    student_facing_reason?: string;
    probability_band?: 'high' | 'medium' | 'low';
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
  const minEligible = lender.loan_amount_min ? formatCurrency(lender.loan_amount_min) : '—';
  const interestRate = lender.interest_rate_min && lender.interest_rate_max 
    ? `${lender.interest_rate_min}% - ${lender.interest_rate_max}%` 
    : lender.interest_rate_min ? `${lender.interest_rate_min}%` : '—';
  const processingTime = lender.processing_time_days 
    ? `${lender.processing_time_days} days` 
    : '—';
  const disbursementTime = lender.disbursement_time_days 
    ? `${lender.disbursement_time_days} days` 
    : '—';
  const approvalRate = lender.approval_rate 
    ? `${lender.approval_rate}%` 
    : '—';
  const processingFee = lender.processing_fee 
    ? `${lender.processing_fee}%` 
    : '—';
  const moratorium = lender.moratorium_period || '—';

  const probabilityConfig = {
    high: { label: 'High Chance', color: 'bg-success/10 text-success border-success/30' },
    medium: { label: 'Good Chance', color: 'bg-warning/10 text-warning border-warning/30' },
    low: { label: 'Possible', color: 'bg-muted text-muted-foreground border-border' }
  };

  const probability = lender.probability_band ? probabilityConfig[lender.probability_band] : null;

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${isSelected ? 'ring-2 ring-primary shadow-xl' : 'hover:shadow-lg border-border'} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* HEADER SECTION */}
      <div className={`p-4 ${isSelected ? 'bg-primary/5' : 'bg-card'}`}>
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className={`flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-xl ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
            {lender.logo_url ? (
              <img src={lender.logo_url} alt={lender.lender_name} className="w-10 h-10 object-contain" />
            ) : (
              <Building2 className={`h-7 w-7 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
            )}
          </div>

          {/* Name & Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg leading-tight">{lender.lender_name}</h3>
              {lender.is_preferred && (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Top Pick
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className="font-bold text-sm px-2 py-0.5">
                {lender.compatibility_score}% Match
              </Badge>
              {probability && (
                <Badge variant="outline" className={`text-xs ${probability.color}`}>
                  {probability.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Selection Button */}
          {isSelected ? (
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary">
              <Check className="h-5 w-5 text-primary-foreground" />
            </div>
          ) : (
            <Button size="sm" onClick={onSelect} disabled={isUpdating} className="flex-shrink-0 h-10 px-4">
              Select
            </Button>
          )}
        </div>

        {/* Student Facing Reason */}
        {lender.student_facing_reason && (
          <p className="mt-3 text-sm text-muted-foreground italic bg-muted/50 rounded-lg p-2 border-l-2 border-primary/50">
            "{lender.student_facing_reason}"
          </p>
        )}
      </div>

      {/* ELIGIBILITY SECTION - Green Accent */}
      <div className="border-l-4 border-success bg-success/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-xs font-semibold uppercase tracking-wide text-success">Eligibility</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Loan Range</p>
            <p className="text-base font-bold">{minEligible} - {maxEligible}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Approval Rate</p>
            <p className="text-base font-bold">{approvalRate}</p>
          </div>
        </div>
      </div>

      {/* TERMS SECTION - Blue Accent */}
      <div className="border-l-4 border-primary bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Percent className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">Terms</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Interest Rate</p>
            <p className="text-sm font-bold">{interestRate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Processing Fee</p>
            <p className="text-sm font-bold">{processingFee}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Moratorium</p>
            <p className="text-sm font-bold">{moratorium}</p>
          </div>
        </div>
      </div>

      {/* SPEED SECTION - Orange Accent */}
      <div className="border-l-4 border-warning bg-warning/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-warning" />
          <span className="text-xs font-semibold uppercase tracking-wide text-warning">Speed</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Processing Time</p>
            <p className="text-sm font-bold">{processingTime}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Disbursement</p>
            <p className="text-sm font-bold">{disbursementTime}</p>
          </div>
        </div>
      </div>

      {/* KEY FEATURES - Chips */}
      {lender.key_features && lender.key_features.length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {lender.key_features.slice(0, 4).map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs font-normal bg-muted/50">
                <CheckCircle2 className="h-3 w-3 mr-1 text-success" />
                {feature}
              </Badge>
            ))}
            {lender.key_features.length > 4 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{lender.key_features.length - 4} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="p-4 bg-muted/30 border-t border-border">
        <div className="flex items-center gap-2">
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
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a href={lender.website} target="_blank" rel="noopener noreferrer">
                Website
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* EXPANDED DETAILS */}
      {isExpanded && (
        <div className="border-t border-border animate-accordion-down">
          {/* Description */}
          {lender.lender_description && (
            <div className="p-4">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">About</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lender.lender_description}
              </p>
            </div>
          )}

          {/* Eligible Expenses */}
          {lender.eligible_expenses && lender.eligible_expenses.length > 0 && (
            <div className="p-4 bg-muted/30 border-t border-border">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Eligible Expenses</h4>
              <div className="grid grid-cols-2 gap-3">
                {lender.eligible_expenses.map((expense: any, index: number) => {
                  const IconComponent = iconMap[expense.icon] || GraduationCap;
                  return (
                    <div key={index} className="flex items-start gap-2">
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <IconComponent className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{expense.category}</p>
                        <p className="text-xs text-muted-foreground truncate">{expense.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Required Documents */}
          {lender.required_documents && lender.required_documents.length > 0 && (
            <div className="p-4 border-t border-border">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Required Documents
              </h4>
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
            <div className="p-4 bg-muted/30 border-t border-border">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Contact</h4>
              <div className="flex flex-wrap gap-4">
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
