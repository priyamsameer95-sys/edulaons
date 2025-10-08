import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { useStudentApplicationContext } from '@/contexts/StudentApplicationContext';
import { CoachingTooltip } from './CoachingTooltip';
import { RELATIONSHIPS, COACHING_MESSAGES, INCOME_INDICATORS } from '@/constants/studentApplication';
import { Info, AlertCircle, TrendingUp } from 'lucide-react';

const CoApplicantDetailsStep = () => {
  const {
    applicationData,
    updateApplicationData,
    nextStep,
    prevStep,
    validationErrors,
  } = useStudentApplicationContext();

  const getIncomeIndicator = (salary: number) => {
    if (salary >= 1000000) return INCOME_INDICATORS[2];
    if (salary >= 500000) return INCOME_INDICATORS[1];
    return INCOME_INDICATORS[0];
  };

  const incomeIndicator = applicationData.coApplicantSalary ? getIncomeIndicator(applicationData.coApplicantSalary) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await nextStep();
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
            value={applicationData.coApplicantName || ''}
            onChange={(e) => updateApplicationData({ coApplicantName: e.target.value })}
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
            value={applicationData.coApplicantRelationship || ''} 
            onValueChange={(value) => updateApplicationData({ coApplicantRelationship: value })}
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
            value={applicationData.coApplicantPhone || ''}
            onChange={(e) => updateApplicationData({ coApplicantPhone: e.target.value })}
            maxLength={10}
            placeholder="10-digit mobile number"
            className={validationErrors.coApplicantPhone ? 'border-destructive' : ''}
          />
          {validationErrors.coApplicantPhone && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.coApplicantPhone}
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
            value={applicationData.coApplicantEmail || ''}
            onChange={(e) => updateApplicationData({ coApplicantEmail: e.target.value })}
            placeholder="email@example.com"
            className={validationErrors.coApplicantEmail ? 'border-destructive' : ''}
          />
          {validationErrors.coApplicantEmail && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.coApplicantEmail}
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
            value={applicationData.coApplicantSalary || ''}
            onChange={(e) => updateApplicationData({ coApplicantSalary: parseFloat(e.target.value) })}
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
            value={applicationData.coApplicantPinCode || ''}
            onChange={(e) => updateApplicationData({ coApplicantPinCode: e.target.value })}
            maxLength={6}
            placeholder="6-digit PIN code"
            className={validationErrors.coApplicantPinCode ? 'border-destructive' : ''}
          />
          {validationErrors.coApplicantPinCode && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.coApplicantPinCode}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep}>Previous</Button>
        <Button type="submit" size="lg">Next: Review Application</Button>
      </div>
    </form>
  );
};

export default CoApplicantDetailsStep;
