import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RateTier } from '@/hooks/useLenderConfig';

interface InterestRateTierEditorProps {
  rateConfig: {
    excellent: RateTier;
    good: RateTier;
    average: RateTier;
    below_average: RateTier;
  };
  onChange: (rateConfig: any) => void;
}

export const InterestRateTierEditor = ({ rateConfig, onChange }: InterestRateTierEditorProps) => {
  const handleRateChange = (tier: string, field: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...rateConfig,
      [tier]: {
        ...rateConfig[tier as keyof typeof rateConfig],
        [field]: numValue,
      },
    });
  };

  const tierConfigs = [
    { key: 'excellent', label: 'Excellent Tier (Score ≥ 90)', color: 'border-green-500' },
    { key: 'good', label: 'Good Tier (Score 75-89)', color: 'border-blue-500' },
    { key: 'average', label: 'Average Tier (Score 60-74)', color: 'border-yellow-500' },
    { key: 'below_average', label: 'Below Average (Score < 60)', color: 'border-red-500' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interest Rate Tier Configuration</CardTitle>
        <CardDescription>
          Configure interest rate ranges based on student overall score
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tierConfigs.map((config) => {
          const tier = rateConfig[config.key as keyof typeof rateConfig];
          return (
            <div key={config.key} className={`p-4 border-l-4 ${config.color} bg-muted/30 rounded-r-lg`}>
              <h4 className="font-medium mb-3">{config.label}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${config.key}-rate-min`}>Minimum Rate (%)</Label>
                  <Input
                    id={`${config.key}-rate-min`}
                    type="number"
                    min="0"
                    max="30"
                    step="0.1"
                    value={tier.min}
                    onChange={(e) => handleRateChange(config.key, 'min', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${config.key}-rate-max`}>Maximum Rate (%)</Label>
                  <Input
                    id={`${config.key}-rate-max`}
                    type="number"
                    min="0"
                    max="30"
                    step="0.1"
                    value={tier.max}
                    onChange={(e) => handleRateChange(config.key, 'max', e.target.value)}
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
