import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
interface LoanTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}
export const LoanTypeSelector = ({
  value,
  onChange
}: LoanTypeSelectorProps) => {
  return <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold mb-2 block">
          Do you have collateral to offer? <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Property, Fixed Deposit, or other mortgageable assets
        </p>
      </div>

      <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
        <div onClick={() => onChange('secured')} className={cn("flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:border-primary/50", value === 'secured' ? 'border-primary bg-primary/5' : 'border-border')}>
          <RadioGroupItem value="secured" id="secured" className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="secured" className="font-medium cursor-pointer flex items-center gap-2">
              Yes - I have collateral
              {value === 'secured' && <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </div>}
            </Label>
          </div>
        </div>

        <div onClick={() => onChange('unsecured')} className={cn("flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:border-primary/50", value === 'unsecured' ? 'border-primary bg-primary/5' : 'border-border')}>
          <RadioGroupItem value="unsecured" id="unsecured" className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="unsecured" className="font-medium cursor-pointer flex items-center gap-2">
              No - I don't have collateral
              {value === 'unsecured' && <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </div>}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">Faster and High Intrest rate low change of approval </p>
          </div>
        </div>
      </RadioGroup>

      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
          <span>What's the difference?</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3 text-sm text-muted-foreground">
          <div className="pl-4 border-l-2 border-primary/20">
            <p className="font-medium text-foreground mb-1">Secured Loan</p>
            <p>Backed by collateral like property or fixed deposits. Lower interest rates and higher loan amounts, but requires mortgageable assets.</p>
          </div>
          <div className="pl-4 border-l-2 border-primary/20">
            <p className="font-medium text-foreground mb-1">Unsecured Loan</p>
            <p>No collateral needed. Approval based on co-applicant's income and credit profile. Slightly higher interest but faster processing.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>;
};