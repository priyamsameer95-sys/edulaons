import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CoachingTooltip } from './CoachingTooltip';
import { COACHING_MESSAGES, RELATIONSHIPS, VALIDATION_PATTERNS, EMPLOYMENT_TYPES } from '@/constants/studentApplication';
import { StudentApplicationData } from '@/hooks/useStudentApplication';
import { Info, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatIndianNumber, amountToWords, parseFormattedNumber } from '@/utils/currencyFormatter';

interface CoApplicantDetailsStepProps {
  data: StudentApplicationData;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CoApplicantDetailsStep = ({ data, onUpdate, onNext, onPrev }: CoApplicantDetailsStepProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [salaryDisplay, setSalaryDisplay] = useState<string>(
    data.coApplicantMonthlySalary ? formatIndianNumber(data.coApplicantMonthlySalary) : ''
  );

  // Calculate salary in words
  const salaryInWords = useMemo(() => {
    if (!data.coApplicantMonthlySalary || data.coApplicantMonthlySalary <= 0) return '';
    return amountToWords(data.coApplicantMonthlySalary);
  }, [data.coApplicantMonthlySalary]);

  // Handle salary input with comma formatting
  const handleSalaryChange = useCallback((value: string) => {
    const formatted = formatIndianNumber(value);
    setSalaryDisplay(formatted);
    const numValue = parseFormattedNumber(value);
    onUpdate({ coApplicantMonthlySalary: numValue || undefined });
  }, [onUpdate]);

  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'coApplicantPhone':
        const cleanPhone = value.replace(/\D/g, '');
        if (!VALIDATION_PATTERNS.phone.test(cleanPhone)) {
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

  const getMonthlyIncomeIndicator = (monthlySalary: number) => {
    if (monthlySalary >= 100000) {
      return { range: '₹1+ Lakh/month', label: 'Excellent approval chances', color: 'text-green-600' };
    }
    if (monthlySalary >= 75000) {
      return { range: '₹75k-1 Lakh/month', label: 'Very good approval chances', color: 'text-blue-600' };
    }
    if (monthlySalary >= 50000) {
      return { range: '₹50k-75k/month', label: 'Good approval chances', color: 'text-yellow-600' };
    }
    return { range: 'Below ₹50k/month', label: 'May affect eligibility', color: 'text-orange-600' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};

    if (!data.coApplicantName?.trim()) {
      newErrors.coApplicantName = 'Name is required';
    }

    if (!data.coApplicantRelationship) {
      newErrors.coApplicantRelationship = 'Relationship is required';
    }

    if (!data.coApplicantPhone) {
      newErrors.coApplicantPhone = 'Phone is required';
    } else {
      const error = validateField('coApplicantPhone', data.coApplicantPhone);
      if (error) newErrors.coApplicantPhone = error;
    }

    if (!data.coApplicantEmail) {
      newErrors.coApplicantEmail = 'Email is required';
    } else {
      const error = validateField('coApplicantEmail', data.coApplicantEmail);
      if (error) newErrors.coApplicantEmail = error;
    }

    if (!data.coApplicantEmploymentType) {
      newErrors.coApplicantEmploymentType = 'Employment type is required';
    }

    if (!data.coApplicantMonthlySalary || data.coApplicantMonthlySalary <= 0) {
      newErrors.coApplicantMonthlySalary = 'Monthly salary is required';
    }

    if (!data.coApplicantPinCode) {
      newErrors.coApplicantPinCode = 'PIN code is required';
    } else {
      const error = validateField('coApplicantPinCode', data.coApplicantPinCode);
      if (error) newErrors.coApplicantPinCode = error;
    }

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
            Their income and employment significantly affect your eligibility (worth up to 30 eligibility points).
          </p>
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="coApplicantName">
                Co-Applicant Name <span className="text-destructive">*</span>
              </Label>
              <CoachingTooltip content={COACHING_MESSAGES.coApplicantName} />
            </div>
              <Input
                id="coApplicantName"
                placeholder="Full legal name"
                value={data.coApplicantName || ''}
                onChange={(e) => handleChange('coApplicantName', e.target.value)}
              />
              {errors.coApplicantName && (
                <p className="text-sm text-destructive">{errors.coApplicantName}</p>
              )}
            </div>

            <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="coApplicantRelationship">
                Relationship <span className="text-destructive">*</span>
              </Label>
              <CoachingTooltip content={COACHING_MESSAGES.coApplicantRelationship} />
            </div>
              <Select
                value={data.coApplicantRelationship || ''}
                onValueChange={(value) => handleChange('coApplicantRelationship', value)}
              >
                <SelectTrigger id="coApplicantRelationship">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((rel) => (
                    <SelectItem key={rel.value} value={rel.value}>
                      {rel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.coApplicantRelationship && (
                <p className="text-sm text-destructive">{errors.coApplicantRelationship}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="coApplicantPhone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <CoachingTooltip content={COACHING_MESSAGES.coApplicantPhone} />
            </div>
              <Input
                id="coApplicantPhone"
                type="tel"
                placeholder="10-digit mobile number"
                value={data.coApplicantPhone || ''}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleChange('coApplicantPhone', cleaned);
                }}
                maxLength={10}
              />
              {errors.coApplicantPhone && (
                <p className="text-sm text-destructive">{errors.coApplicantPhone}</p>
              )}
            </div>

            <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="coApplicantEmail">
                Email <span className="text-destructive">*</span>
              </Label>
              <CoachingTooltip content={COACHING_MESSAGES.coApplicantEmail} />
            </div>
              <Input
                id="coApplicantEmail"
                type="email"
                placeholder="email@example.com"
                value={data.coApplicantEmail || ''}
                onChange={(e) => handleChange('coApplicantEmail', e.target.value)}
              />
              {errors.coApplicantEmail && (
                <p className="text-sm text-destructive">{errors.coApplicantEmail}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="coApplicantEmploymentType">
              Employment Type <span className="text-destructive">*</span>
            </Label>
            <CoachingTooltip content="Employment type affects loan eligibility scoring (worth up to 25 points)" />
          </div>
            <Select
              value={data.coApplicantEmploymentType || ''}
              onValueChange={(value: any) => handleChange('coApplicantEmploymentType', value)}
            >
              <SelectTrigger id="coApplicantEmploymentType">
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.coApplicantEmploymentType && (
              <p className="text-sm text-destructive">{errors.coApplicantEmploymentType}</p>
            )}
          </div>

          <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="coApplicantMonthlySalary">
              Monthly Salary <span className="text-destructive">*</span>
            </Label>
            <CoachingTooltip content="Monthly take-home salary. Higher income significantly improves approval chances (worth up to 40 points)" />
          </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                id="coApplicantMonthlySalary"
                type="text"
                inputMode="numeric"
                placeholder="50,000"
                className="pl-7"
                value={salaryDisplay}
                onChange={(e) => handleSalaryChange(e.target.value)}
              />
            </div>
            {salaryInWords && !errors.coApplicantMonthlySalary && (
              <p className="text-sm text-muted-foreground">{salaryInWords}</p>
            )}
            {errors.coApplicantMonthlySalary && (
              <p className="text-sm text-destructive">{errors.coApplicantMonthlySalary}</p>
            )}
            {data.coApplicantMonthlySalary && data.coApplicantMonthlySalary > 0 && !errors.coApplicantMonthlySalary && (
              <Alert className="mt-2">
                <Info className="h-4 w-4" />
                <AlertDescription className={getMonthlyIncomeIndicator(data.coApplicantMonthlySalary).color}>
                  <span className="font-medium">{getMonthlyIncomeIndicator(data.coApplicantMonthlySalary).range}:</span>{' '}
                  {getMonthlyIncomeIndicator(data.coApplicantMonthlySalary).label}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="coApplicantOccupation">Occupation</Label>
                <CoachingTooltip content="Occupation/job title (optional, but helpful for lender assessment)" />
              </div>
              <Input
                id="coApplicantOccupation"
                placeholder="e.g., Software Engineer"
                value={data.coApplicantOccupation || ''}
                onChange={(e) => handleChange('coApplicantOccupation', e.target.value)}
              />
            </div>

            {data.coApplicantEmploymentType === 'salaried' && (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="coApplicantEmployer">Employer Name</Label>
                  <CoachingTooltip content="Employer/company name (helps with verification)" />
                </div>
                <Input
                  id="coApplicantEmployer"
                  placeholder="e.g., TCS, Infosys"
                  value={data.coApplicantEmployer || ''}
                  onChange={(e) => handleChange('coApplicantEmployer', e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="coApplicantEmploymentDuration">Employment Duration (years)</Label>
                <CoachingTooltip content="Years in current employment (optional)" />
              </div>
              <Input
                id="coApplicantEmploymentDuration"
                type="number"
                min="0"
                max="50"
                placeholder="5"
                value={data.coApplicantEmploymentDuration || ''}
                onChange={(e) => handleChange('coApplicantEmploymentDuration', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="coApplicantPinCode">
              PIN Code <span className="text-destructive">*</span>
            </Label>
            <CoachingTooltip content={COACHING_MESSAGES.coApplicantPinCode} />
          </div>
            <Input
              id="coApplicantPinCode"
              placeholder="6-digit PIN code"
              value={data.coApplicantPinCode || ''}
              onChange={(e) => handleChange('coApplicantPinCode', e.target.value)}
              maxLength={6}
            />
            {errors.coApplicantPinCode && (
              <p className="text-sm text-destructive">{errors.coApplicantPinCode}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="coApplicantCreditScore">Credit Score (Optional)</Label>
              <CoachingTooltip content="CIBIL credit score between 300-900. Higher scores improve loan approval chances. Leave empty if not available." />
            </div>
            <Input
              id="coApplicantCreditScore"
              type="number"
              min={300}
              max={900}
              placeholder="e.g., 750"
              value={data.coApplicantCreditScore || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                handleChange('coApplicantCreditScore', value);
              }}
            />
            {data.coApplicantCreditScore && data.coApplicantCreditScore >= 300 && data.coApplicantCreditScore <= 900 && (
              <p className="text-sm text-muted-foreground">
                {data.coApplicantCreditScore >= 750 ? '✓ Excellent credit score' :
                 data.coApplicantCreditScore >= 700 ? '✓ Good credit score' :
                 data.coApplicantCreditScore >= 650 ? 'Average credit score' :
                 'Below average credit score'}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button type="submit" className="flex-1">
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </form>
  );
};

export default CoApplicantDetailsStep;
