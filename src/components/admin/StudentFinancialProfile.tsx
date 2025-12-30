import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, Briefcase, TrendingUp } from "lucide-react";
import { formatCurrency, formatDisplayText } from "@/utils/formatters";

interface CoApplicant {
  name: string;
  relationship: string;
  salary: number;
  monthly_salary?: number | null;
  employment_type?: string | null;
  occupation?: string | null;
  employer?: string | null;
  pin_code: string;
}

interface Lead {
  loan_amount: number;
  loan_type: string;
  lenders?: {
    name: string;
  };
}

interface EligibilityScores {
  eligible_loan_min?: number | null;
  eligible_loan_max?: number | null;
  loan_band_percentage?: string | null;
  interest_rate_min?: number | null;
  interest_rate_max?: number | null;
  rate_tier?: string | null;
}

interface StudentFinancialProfileProps {
  lead: Lead;
  coApplicant: CoApplicant;
  scores: EligibilityScores | null;
}

const StudentFinancialProfile = ({ lead, coApplicant, scores }: StudentFinancialProfileProps) => {

  const getRateTierBadge = (tier?: string | null) => {
    if (!tier) return { variant: 'outline' as const, label: 'N/A' };
    switch (tier) {
      case 'excellent':
        return { variant: 'default' as const, label: 'Excellent Rate' };
      case 'good':
        return { variant: 'secondary' as const, label: 'Good Rate' };
      case 'average':
        return { variant: 'outline' as const, label: 'Average Rate' };
      default:
        return { variant: 'destructive' as const, label: 'Higher Rate' };
    }
  };

  const loanToIncomeRatio = coApplicant.salary > 0 
    ? (lead.loan_amount / coApplicant.salary).toFixed(2) 
    : 'N/A';

  const rateTier = getRateTierBadge(scores?.rate_tier);

  return (
    <div className="space-y-6">
      {/* Loan Details */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Loan Request Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Requested Amount</label>
              <p className="text-2xl font-bold text-primary">₹{formatCurrency(lead.loan_amount)}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Loan Type</label>
              <Badge variant="secondary" className="mt-2 text-sm">
                {formatDisplayText(lead.loan_type)}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Assigned Lender</label>
            <p className="font-medium">{lead.lenders?.name || 'Not Assigned'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Eligibility Results */}
      {scores && (scores.eligible_loan_min || scores.interest_rate_min) && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-success/5 to-success/10">
            <CardHeader>
              <CardTitle className="text-lg">Eligible Loan Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-success">
                  ₹{formatCurrency(scores.eligible_loan_min || 0)} - ₹{formatCurrency(scores.eligible_loan_max || 0)}
                </div>
                {scores.loan_band_percentage && (
                  <Badge variant="outline" className="text-xs">
                    {scores.loan_band_percentage} of maximum
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/5 to-warning/10">
            <CardHeader>
              <CardTitle className="text-lg">Indicative Interest Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-warning">
                  {scores.interest_rate_min?.toFixed(2)}% - {scores.interest_rate_max?.toFixed(2)}%
                </div>
                <Badge variant={rateTier.variant} className="text-xs">
                  {rateTier.label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Co-Applicant Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Co-Applicant Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Name</label>
              <p className="font-medium">{coApplicant.name}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Relationship</label>
              <Badge variant="secondary" className="mt-1">
                {formatDisplayText(coApplicant.relationship)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Annual Salary</label>
              <p className="text-xl font-bold">₹{formatCurrency(coApplicant.salary)}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Monthly Salary</label>
              <p className="text-xl font-bold">
                ₹{formatCurrency(coApplicant.monthly_salary || coApplicant.salary / 12)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Employment Type</label>
              <p className="font-medium">{formatDisplayText(coApplicant.employment_type) || 'Not Specified'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">PIN Code</label>
              <p className="font-medium">{coApplicant.pin_code}</p>
            </div>
          </div>

          {coApplicant.occupation && (
            <div>
              <label className="text-sm text-muted-foreground">Occupation</label>
              <p className="font-medium">{coApplicant.occupation}</p>
            </div>
          )}

          {coApplicant.employer && (
            <div>
              <label className="text-sm text-muted-foreground">Employer</label>
              <p className="font-medium">{coApplicant.employer}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Financial Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <label className="text-sm text-muted-foreground">Loan-to-Income Ratio</label>
              <p className="text-2xl font-bold mt-1">{loanToIncomeRatio}x</p>
              {typeof loanToIncomeRatio === 'string' && loanToIncomeRatio !== 'N/A' && (
                <p className="text-xs text-muted-foreground mt-1">
                  {parseFloat(loanToIncomeRatio) < 2 ? 'Excellent' : 
                   parseFloat(loanToIncomeRatio) < 3 ? 'Good' : 
                   parseFloat(loanToIncomeRatio) < 4 ? 'Acceptable' : 'High Risk'}
                </p>
              )}
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <label className="text-sm text-muted-foreground">Est. Monthly EMI</label>
              <p className="text-2xl font-bold mt-1">
                ₹{formatCurrency((lead.loan_amount * 0.01) / 12)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Approx. at 12% p.a.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFinancialProfile;
