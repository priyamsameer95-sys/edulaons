import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { useStudentApplicationContext } from '@/contexts/StudentApplicationContext';
import { CoachingTooltip } from './CoachingTooltip';
import { LoanTypeSelector } from './LoanTypeSelector';
import { UniversitySelector } from '@/components/ui/university-selector';
import { CourseSelector } from '@/components/ui/course-selector';
import { STUDY_DESTINATIONS, COACHING_MESSAGES, LOAN_AMOUNT_RANGES } from '@/constants/studentApplication';
import { Info } from 'lucide-react';

const StudyDetailsStep = () => {
  const {
    applicationData,
    updateApplicationData,
    nextStep,
    prevStep,
    validationErrors,
  } = useStudentApplicationContext();

  const currentYear = new Date().getFullYear();

  const loanRangeInfo = applicationData.studyDestination 
    ? LOAN_AMOUNT_RANGES[applicationData.studyDestination as keyof typeof LOAN_AMOUNT_RANGES]
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        {/* Study Destination - FIRST */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="studyDestination">Study Destination *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.studyDestination} />
          </div>
          <Select 
            value={applicationData.studyDestination || ''} 
            onValueChange={(value) => {
              updateApplicationData({ studyDestination: value, universities: [], course: '', courseId: undefined, courseDetails: undefined });
            }}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {STUDY_DESTINATIONS.map((dest) => (
                <SelectItem key={dest.value} value={dest.value}>{dest.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Universities - SECOND */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label>Select Universities (up to 3) *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.universities} />
          </div>
          <UniversitySelector
            country={applicationData.studyDestination || ''}
            universities={applicationData.universities || []}
            onChange={(unis) => {
              updateApplicationData({ universities: unis, course: '', courseId: undefined, courseDetails: undefined });
            }}
            error={validationErrors.universities}
          />
          {!applicationData.studyDestination && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select your study destination first to see available universities
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Course - THIRD */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label>Course/Program *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.course} />
          </div>
          <CourseSelector
            universityIds={applicationData.universities || []}
            value={applicationData.courseId && applicationData.courseDetails ? { id: applicationData.courseId, ...applicationData.courseDetails } : applicationData.course}
            onChange={(value) => {
              if (typeof value === 'string') {
                updateApplicationData({ course: value, courseId: undefined, courseDetails: undefined });
              } else {
                updateApplicationData({ 
                  course: value.programName,
                  courseId: value.id,
                  courseDetails: {
                    programName: value.programName,
                    degree: value.degree,
                    stream: value.stream,
                    tuition: value.tuition
                  }
                });
              }
            }}
            placeholder="Search for your course..."
          />
        </div>

        {/* Loan Type */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label>Loan Type *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.loanType} />
          </div>
          <LoanTypeSelector 
            value={applicationData.loanType || 'secured'} 
            onChange={(value) => updateApplicationData({ loanType: value as 'secured' | 'unsecured' })}
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
              value={applicationData.intakeMonth?.toString() || ''} 
              onValueChange={(value) => updateApplicationData({ intakeMonth: parseInt(value) })}
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
              value={applicationData.intakeYear?.toString() || ''} 
              onValueChange={(value) => updateApplicationData({ intakeYear: parseInt(value) })}
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
            value={applicationData.loanAmount || ''}
            onChange={(e) => {
              const amount = parseFloat(e.target.value);
              updateApplicationData({ loanAmount: amount });
            }}
            placeholder="Enter total amount needed"
            required
          />
          {loanRangeInfo && (
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">
                  <Info className="h-3 w-3 inline mr-1" />
                  Typical range for {applicationData.studyDestination}: <span className="font-medium text-foreground">{loanRangeInfo.typical}</span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep}>Previous</Button>
        <Button type="submit" size="lg">Next: Co-Applicant Details</Button>
      </div>
    </form>
  );
};

export default StudyDetailsStep;
