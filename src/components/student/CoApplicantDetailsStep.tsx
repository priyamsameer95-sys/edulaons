import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { StudentApplicationData } from '@/hooks/useStudentApplication';
import { CoachingTooltip } from './CoachingTooltip';
import { RELATIONSHIPS, COACHING_MESSAGES, INCOME_INDICATORS, VALIDATION_PATTERNS } from '@/constants/studentApplication';
import { Info, AlertCircle, TrendingUp } from 'lucide-react';

interface CoApplicantDetailsStepProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CoApplicantDetailsStep = ({ data, onUpdate, onNext, onPrev }: CoApplicantDetailsStepProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'coApplicantPhone':
        if (!VALIDATION_PATTERNS.phone.test(value)) {
          return 'Enter valid 10-digit phone number';
        }
        return null;
      case 'coApplicantEmail':
        if (!VALIDATION_PATTERNS.email.test(value)) {
          return 'Enter valid email address';
        }
        return null;
      case 'coApplicantPinCode':
        if (!VALIDATION_PATTERNS.pinCode.test(value)) {
          return 'Enter valid 6-digit PIN code';
        }
        return null;
      default:
        return null;
    }
  };

  const handleChange = (field: string, value: any) => {
    onUpdate({ [field]: value });
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error || '' }));
  };

  const getIncomeIndicator = (salary: number) => {
    if (salary >= 1000000) return INCOME_INDICATORS[2];
    if (salary >= 500000) return INCOME_INDICATORS[1];
    return INCOME_INDICATORS[0];
  };

  const incomeIndicator = data.coApplicantSalary ? getIncomeIndicator(data.coApplicantSalary) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    ['coApplicantPhone', 'coApplicantEmail', 'coApplicantPinCode'].forEach(field => {
      const error = validateField(field, (data as any)[field]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Why do we need a co-applicant?</strong>
          <p className="mt-1 text-sm">
            Most lenders require a co-applicant (usually a parent or guardian) who can support your loan application. 
            This increases your chances of approval and may help you get better interest rates.
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="coApplicantName">Co-Applicant Name *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.coApplicantName} />
          </div>
          <Input
            id="coApplicantName"
            value={data.coApplicantName || ''}
            onChange={(e) => onUpdate({ coApplicantName: e.target.value })}
            required
            placeholder="Full name of co-applicant"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="coApplicantRelationship">Relationship *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.coApplicantRelationship} />
          </div>
          <Select 
            value={data.coApplicantRelationship || ''} 
            onValueChange={(value) => onUpdate({ coApplicantRelationship: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                  {value === 'parent' && <span className="text-xs text-muted-foreground ml-1">(Recommended)</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="coApplicantPhone">Phone Number *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.coApplicantPhone} />
          </div>
          <Input
            id="coApplicantPhone"
            type="tel"
            value={data.coApplicantPhone || ''}
            onChange={(e) => handleChange('coApplicantPhone', e.target.value)}
            maxLength={10}
            placeholder="10-digit mobile number"
            className={errors.coApplicantPhone ? 'border-destructive' : ''}
          />
          {errors.coApplicantPhone && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.coApplicantPhone}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="coApplicantEmail">Email *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.coApplicantEmail} />
          </div>
          <Input
            id="coApplicantEmail"
            type="email"
            value={data.coApplicantEmail || ''}
            onChange={(e) => handleChange('coApplicantEmail', e.target.value)}
            placeholder="email@example.com"
            className={errors.coApplicantEmail ? 'border-destructive' : ''}
          />
          {errors.coApplicantEmail && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.coApplicantEmail}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="coApplicantSalary">Annual Income (₹) *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.coApplicantSalary} />
          </div>
          <Input
            id="coApplicantSalary"
            type="number"
            value={data.coApplicantSalary || ''}
            onChange={(e) => onUpdate({ coApplicantSalary: parseFloat(e.target.value) })}
            required
            min="0"
            placeholder="Annual income in rupees"
          />
          {incomeIndicator && (
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-4 w-4 ${incomeIndicator.color}`} />
                  <div>
                    <p className="text-sm font-medium">{incomeIndicator.label}</p>
                    <p className="text-xs text-muted-foreground">Income range: {incomeIndicator.range}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="coApplicantPinCode">PIN Code *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.coApplicantPinCode} />
          </div>
          <Input
            id="coApplicantPinCode"
            value={data.coApplicantPinCode || ''}
            onChange={(e) => handleChange('coApplicantPinCode', e.target.value)}
            maxLength={6}
            placeholder="6-digit PIN code"
            className={errors.coApplicantPinCode ? 'border-destructive' : ''}
          />
          {errors.coApplicantPinCode && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.coApplicantPinCode}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrev}>Previous</Button>
        <Button type="submit" size="lg">Next: Review Application</Button>
      </div>
    </form>
  );
};

export default CoApplicantDetailsStep;
