import { useLenderConfig } from '@/hooks/useLenderConfig';
import { LoanBandEditor } from './LoanBandEditor';
import { InterestRateTierEditor } from './InterestRateTierEditor';
import { UniversityGradeMapper } from './UniversityGradeMapper';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LenderScoringConfigProps {
  lenderId: string;
}

export const LenderScoringConfig = ({ lenderId }: LenderScoringConfigProps) => {
  const { config, loading, updateConfig } = useLenderConfig(lenderId);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!config) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load lender configuration. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          These configurations control how student eligibility scores translate into loan amounts and interest rates. 
          Changes will be automatically saved when you click "Update Lender".
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Maximum Loan Amount</CardTitle>
          <CardDescription>
            Set the maximum loan amount this lender offers. Actual loan amounts are calculated as a percentage of this value based on student scores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="max_loan_amount">Maximum Loan Amount (₹)</Label>
            <Input
              id="max_loan_amount"
              type="number"
              value={config.max_loan_amount}
              onChange={(e) => updateConfig({ max_loan_amount: parseFloat(e.target.value) || 0 })}
              placeholder="e.g., 5000000"
            />
            <p className="text-sm text-muted-foreground">
              Current: ₹{config.max_loan_amount.toLocaleString('en-IN')}
            </p>
          </div>
        </CardContent>
      </Card>

      <LoanBandEditor
        bands={config.loan_bands}
        onChange={(bands) => updateConfig({ loan_bands: bands })}
      />

      <InterestRateTierEditor
        rateConfig={config.rate_config}
        onChange={(rateConfig) => updateConfig({ rate_config: rateConfig })}
      />

      <UniversityGradeMapper
        mapping={config.university_grade_mapping}
        onChange={(mapping) => updateConfig({ university_grade_mapping: mapping })}
      />
    </div>
  );
};
