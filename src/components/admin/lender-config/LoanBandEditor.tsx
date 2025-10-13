import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoanBand } from '@/hooks/useLenderConfig';

interface LoanBandEditorProps {
  bands: {
    '90-100': LoanBand;
    '80-89': LoanBand;
    '70-79': LoanBand;
    'below-70': LoanBand;
  };
  onChange: (bands: any) => void;
  maxLoanAmount?: number;
}

export const LoanBandEditor = ({ bands, onChange, maxLoanAmount = 5000000 }: LoanBandEditorProps) => {
  const handleBandChange = (tier: string, field: 'min_percent' | 'max_percent', value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...bands,
      [tier]: {
        ...bands[tier as keyof typeof bands],
        [field]: numValue,
      },
    });
  };

  const formatAmount = (amount: number) => {
    return `₹${(amount / 100000).toFixed(2)} lakhs`;
  };

  const bandConfigs = [
    { 
      key: '90-100', 
      label: 'Student Score: 90-100 (Excellent)', 
      description: 'Top performers - Maximum loan eligibility',
      color: 'border-green-500',
      icon: '🟢',
      disabled: false
    },
    { 
      key: '80-89', 
      label: 'Student Score: 80-89 (Good)', 
      description: 'Strong profile - High loan eligibility',
      color: 'border-blue-500',
      icon: '🔵',
      disabled: false
    },
    { 
      key: '70-79', 
      label: 'Student Score: 70-79 (Average)', 
      description: 'Acceptable profile - Moderate loan eligibility',
      color: 'border-yellow-500',
      icon: '🟡',
      disabled: false
    },
    { 
      key: 'below-70', 
      label: 'Student Score: Below 70 (Rejected)', 
      description: 'Does not meet minimum requirements - Application rejected',
      color: 'border-red-500',
      icon: '🔴',
      disabled: true
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Amount Bands by Student Score</CardTitle>
        <CardDescription>
          Configure the eligible loan amount range for each student score tier. The percentages represent what portion of the maximum loan amount ({formatAmount(maxLoanAmount)}) students can receive based on their overall score.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {bandConfigs.map((config) => {
          const band = bands[config.key as keyof typeof bands];
          const minAmount = (maxLoanAmount * band.min_percent) / 100;
          const maxAmount = (maxLoanAmount * band.max_percent) / 100;
          
          return (
            <div key={config.key} className={`p-5 border-l-4 ${config.color} bg-muted/30 rounded-r-lg ${config.disabled ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">{config.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-1">{config.label}</h4>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              </div>
              
              {!config.disabled && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${config.key}-min`} className="text-sm font-medium">
                        Minimum Loan %
                      </Label>
                      <Input
                        id={`${config.key}-min`}
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={band.min_percent}
                        onChange={(e) => handleBandChange(config.key, 'min_percent', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${config.key}-max`} className="text-sm font-medium">
                        Maximum Loan %
                      </Label>
                      <Input
                        id={`${config.key}-max`}
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={band.max_percent}
                        onChange={(e) => handleBandChange(config.key, 'max_percent', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-background rounded-md border">
                    <p className="text-sm text-muted-foreground mb-1">
                      💡 <strong>Example:</strong> Max loan amount = {formatAmount(maxLoanAmount)}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      → Student receives: {formatAmount(minAmount)} to {formatAmount(maxAmount)}
                    </p>
                  </div>
                </>
              )}
              
              {config.disabled && (
                <div className="p-3 bg-background rounded-md border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Applications with scores below 70 are automatically rejected and receive no loan offer.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
