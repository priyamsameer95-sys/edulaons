import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  TrendingUp, 
  DollarSign,
  Clock,
  Edit,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Lender {
  id: string;
  name: string;
  code: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  interest_rate_min: number | null;
  interest_rate_max: number | null;
  loan_amount_min: number | null;
  loan_amount_max: number | null;
  processing_time_days: number | null;
  approval_rate: number | null;
  is_active: boolean;
  key_features: any;
}

interface LenderManagementCardProps {
  lender: Lender;
  onEdit: (lender: Lender) => void;
  onToggleStatus: (lender: Lender) => void;
}

export function LenderManagementCard({ lender, onEdit, onToggleStatus }: LenderManagementCardProps) {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${lender.is_active ? 'from-primary via-primary-light to-primary' : 'from-muted-foreground to-muted'}`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Logo */}
            <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
              {lender.logo_url ? (
                <img 
                  src={lender.logo_url} 
                  alt={lender.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            
            {/* Name & Status */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{lender.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">{lender.code}</p>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-2">
            <Badge variant={lender.is_active ? "default" : "secondary"}>
              {lender.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(lender)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus(lender)}>
                  {lender.is_active ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Description */}
        {lender.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {lender.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Interest Rate */}
          {(lender.interest_rate_min || lender.interest_rate_max) && (
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Interest Rate</span>
              </div>
              <p className="text-sm font-bold">
                {lender.interest_rate_min && lender.interest_rate_max
                  ? `${lender.interest_rate_min}% - ${lender.interest_rate_max}%`
                  : lender.interest_rate_min
                  ? `From ${lender.interest_rate_min}%`
                  : lender.interest_rate_max
                  ? `Up to ${lender.interest_rate_max}%`
                  : 'N/A'}
              </p>
            </div>
          )}

          {/* Loan Amount */}
          {(lender.loan_amount_min || lender.loan_amount_max) && (
            <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-3 border border-success/20">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-success" />
                <span className="text-xs font-medium text-muted-foreground">Loan Range</span>
              </div>
              <p className="text-xs font-bold">
                {formatCurrency(lender.loan_amount_min)} - {formatCurrency(lender.loan_amount_max)}
              </p>
            </div>
          )}

          {/* Processing Time */}
          {lender.processing_time_days && (
            <div className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-lg p-3 border border-warning/20">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-xs font-medium text-muted-foreground">Processing</span>
              </div>
              <p className="text-sm font-bold">{lender.processing_time_days} days</p>
            </div>
          )}

          {/* Approval Rate */}
          {lender.approval_rate && (
            <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-3 border border-accent/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-accent-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Approval Rate</span>
              </div>
              <p className="text-sm font-bold">{lender.approval_rate}%</p>
            </div>
          )}
        </div>

        {/* Key Features */}
        {lender.key_features && lender.key_features.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Key Features:</p>
            <ul className="text-xs space-y-0.5">
              {lender.key_features.slice(0, 2).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
            </ul>
            {lender.key_features.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{lender.key_features.length - 2} more features
              </p>
            )}
          </div>
        )}

        {/* Contact Info */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {lender.website && (
            <a 
              href={lender.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Globe className="h-3 w-3" />
              <span>Website</span>
            </a>
          )}
          {lender.contact_email && (
            <a 
              href={`mailto:${lender.contact_email}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-3 w-3" />
              <span>Email</span>
            </a>
          )}
          {lender.contact_phone && (
            <a 
              href={`tel:${lender.contact_phone}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-3 w-3" />
              <span>Call</span>
            </a>
          )}
        </div>

        {/* Quick Edit Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={() => onEdit(lender)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Lender
        </Button>
      </CardContent>
    </Card>
  );
}
