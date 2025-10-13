import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoanBand } from '@/hooks/useLenderConfig';

interface LoanBandEditorProps {
  bands: {
    '90-100': LoanBand;
    '75-89': LoanBand;
    '60-74': LoanBand;
    '0-59': LoanBand;
  };
  onChange: (bands: any) => void;
}

export const LoanBandEditor = ({ bands, onChange }: LoanBandEditorProps) => {
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

  const bandConfigs = [
    { key: '90-100', label: 'Excellent Tier (90-100%)', color: 'border-green-500' },
    { key: '75-89', label: 'Good Tier (75-89%)', color: 'border-blue-500' },
    { key: '60-74', label: 'Average Tier (60-74%)', color: 'border-yellow-500' },
    { key: '0-59', label: 'Below Threshold (0-59%)', color: 'border-red-500' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Band Configuration</CardTitle>
        <CardDescription>
          Configure what percentage of max loan amount students can get based on their overall score
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bandConfigs.map((config) => {
          const band = bands[config.key as keyof typeof bands];
          return (
            <div key={config.key} className={`p-4 border-l-4 ${config.color} bg-muted/30 rounded-r-lg`}>
              <h4 className="font-medium mb-3">{config.label}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${config.key}-min`}>Minimum Loan %</Label>
                  <Input
                    id={`${config.key}-min`}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={band.min_percent}
                    onChange={(e) => handleBandChange(config.key, 'min_percent', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${config.key}-max`}>Maximum Loan %</Label>
                  <Input
                    id={`${config.key}-max`}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={band.max_percent}
                    onChange={(e) => handleBandChange(config.key, 'max_percent', e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
