import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { StudentApplicationData } from '@/hooks/useStudentApplication';
import { CoachingTooltip } from './CoachingTooltip';
import { LoanTypeSelector } from './LoanTypeSelector';
import { UniversitySelector } from '@/components/ui/university-selector';
import { CourseCombobox } from '@/components/ui/course-combobox';
import { STUDY_DESTINATIONS, COACHING_MESSAGES, LOAN_AMOUNT_RANGES, MIN_LOAN_AMOUNT } from '@/constants/studentApplication';
import { Info, AlertCircle } from 'lucide-react';

interface StudyDetailsStepProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const StudyDetailsStep = ({ data, onUpdate, onNext, onPrev }: StudyDetailsStepProps) => {
  const currentYear = new Date().getFullYear();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loanRangeInfo = data.studyDestination 
    ? LOAN_AMOUNT_RANGES[data.studyDestination as keyof typeof LOAN_AMOUNT_RANGES]
    : null;

  const validateLoanAmount = (amount: number): string | null => {
    if (!amount || amount < MIN_LOAN_AMOUNT) {
      return `Minimum loan amount is ₹${(MIN_LOAN_AMOUNT / 100000).toFixed(0)} Lakhs`;
    }
    if (loanRangeInfo && amount > loanRangeInfo.max) {
      return `Maximum for ${data.studyDestination} is ₹${(loanRangeInfo.max / 100000).toFixed(0)} Lakhs`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    const validUniversities = (data.universities || []).filter(u => u && u.trim());
    if (validUniversities.length === 0) {
      newErrors.universities = 'Please select at least one university';
    }
    
    const loanError = validateLoanAmount(data.loanAmount || 0);
    if (loanError) {
      newErrors.loanAmount = loanError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        {/* Universities */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label>Select Universities (up to 3) *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.universities} />
          </div>
          <UniversitySelector
            country={data.studyDestination || ''}
            universities={data.universities || []}
            onChange={(unis) => {
              onUpdate({ universities: unis });
              setErrors(prev => ({ ...prev, universities: '' }));
            }}
            error={errors.universities}
          />
          {!data.studyDestination && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select your study destination first to see available universities
              </AlertDescription>
            </Alert>
          )}
        </div>


        {/* Study Destination */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="studyDestination">Study Destination *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.studyDestination} />
          </div>
          <Select 
            value={data.studyDestination || ''} 
            onValueChange={(value) => {
              onUpdate({ studyDestination: value, universities: [] });
            }}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {STUDY_DESTINATIONS.map((dest) => (
                <SelectItem key={dest} value={dest}>{dest}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Course/Program Name */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="courseName">Course/Program Name</Label>
            <CoachingTooltip content="Select your course from the list or enter a custom name. We'll match you with lenders who support your program." />
          </div>
          
          <CourseCombobox
            universityId={data.universities?.[0]}
            value={data.courseName || ''}
            onChange={(value) => onUpdate({ courseName: value })}
            placeholder="Search courses or enter custom name..."
            disabled={!data.universities?.[0]}
          />
          
          {!data.universities?.[0] && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select a university first to see available courses
              </AlertDescription>
            </Alert>
          )}
          
          <p className="text-xs text-muted-foreground">
            Optional - Select from database or enter custom course name
          </p>
        </div>

        {/* Loan Type */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label>Loan Type *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.loanType} />
          </div>
          <LoanTypeSelector 
            value={((data.loanType || 'secured') as 'secured' | 'unsecured')} 
            onChange={(value: 'secured' | 'unsecured') => onUpdate({ loanType: value })}
          />
        </div>

        {/* Intake Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="intakeMonth">Intake Month *</Label>
              <CoachingTooltip content={COACHING_MESSAGES.intakeMonth} />
            </div>
            <Select 
              value={data.intakeMonth?.toString() || ''} 
              onValueChange={(value) => onUpdate({ intakeMonth: parseInt(value) })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intakeYear">Intake Year *</Label>
            <Select 
              value={data.intakeYear?.toString() || ''} 
              onValueChange={(value) => onUpdate({ intakeYear: parseInt(value) })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 3 }, (_, i) => (
                  <SelectItem key={currentYear + i} value={(currentYear + i).toString()}>
                    {currentYear + i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loan Amount */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="loanAmount">Loan Amount (₹) *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.loanAmount} />
          </div>
          <Input
            id="loanAmount"
            type="number"
            value={data.loanAmount || ''}
            onChange={(e) => {
              const amount = parseFloat(e.target.value);
              onUpdate({ loanAmount: amount });
              const error = validateLoanAmount(amount);
              setErrors(prev => ({ ...prev, loanAmount: error || '' }));
            }}
            min={MIN_LOAN_AMOUNT}
            placeholder="Enter total amount needed"
            className={errors.loanAmount ? 'border-destructive' : ''}
          />
          {errors.loanAmount && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.loanAmount}
            </p>
          )}
          {loanRangeInfo && (
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">
                  <Info className="h-3 w-3 inline mr-1" />
                  Typical range for {data.studyDestination}: <span className="font-medium text-foreground">{loanRangeInfo.typical}</span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrev}>Previous</Button>
        <Button type="submit" size="lg">Next: Co-Applicant Details</Button>
      </div>
    </form>
  );
};

export default StudyDetailsStep;
