import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { LOAN_TYPE_INFO } from '@/constants/studentApplication';

interface LoanTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const LoanTypeSelector = ({ value, onChange }: LoanTypeSelectorProps) => {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="grid md:grid-cols-2 gap-4">
      {Object.entries(LOAN_TYPE_INFO).map(([type, info]) => (
        <Card 
          key={type}
          className={`cursor-pointer transition-all hover:border-primary ${
            value === type ? 'border-primary bg-primary/5' : ''
          }`}
          onClick={() => onChange(type)}
        >
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={type} id={type} />
                <Label htmlFor={type} className="font-semibold text-base cursor-pointer">
                  {info.title}
                </Label>
              </div>
              {value === type && (
                <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Rate:</span>
                <span className="font-medium">{info.interestRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Collateral:</span>
                <span className="font-medium">{info.collateral}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approval:</span>
                <span className="font-medium">{info.approvalRate}</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <ul className="space-y-1">
                {info.benefits.map((benefit, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                    <Check className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ))}
    </RadioGroup>
  );
};
