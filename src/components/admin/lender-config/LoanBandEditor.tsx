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
          <div className="space-y-2">
            <p>Configure the eligible loan percentage based on student score.</p>
            
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm font-semibold text-yellow-900">⚠️ How Loan Calculation Works:</p>
              <p className="text-sm text-yellow-800 mt-1">
                Percentages apply to the <strong>LOWER</strong> of:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-800 ml-2 mt-1">
                <li>Student's requested loan amount</li>
                <li>Lender's maximum loan amount ({formatAmount(maxLoanAmount)})</li>
              </ul>
              <p className="text-xs text-yellow-700 mt-2 italic">
                Example: Student requests ₹40L, lender max is ₹1Cr → Base = ₹40L → Score 85% (Good band) → Offer ₹28L-₹36L (70-90% of ₹40L)
              </p>
            </div>
          </div>
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
                    <p className="text-sm text-muted-foreground mb-2">
                      💡 <strong>Calculation Examples:</strong>
                    </p>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Student requests ₹40L (below max):</span>
                        <p className="font-semibold text-foreground">
                          → Base = ₹40L → Offer: {formatAmount(4000000 * band.min_percent / 100)} to {formatAmount(4000000 * band.max_percent / 100)}
                        </p>
                      </div>
                      
                      <div className="text-sm border-t pt-2">
                        <span className="text-muted-foreground">Student requests ₹1.5Cr (above max {formatAmount(maxLoanAmount)}):</span>
                        <p className="font-semibold text-foreground">
                          → Base = {formatAmount(maxLoanAmount)} (capped) → Offer: {formatAmount(minAmount)} to {formatAmount(maxAmount)}
                        </p>
                      </div>
                    </div>
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
