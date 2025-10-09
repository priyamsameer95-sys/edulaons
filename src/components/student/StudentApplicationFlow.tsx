import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudentApplication } from '@/hooks/useStudentApplication';
import PersonalDetailsStep from './PersonalDetailsStep';
import StudyDetailsStep from './StudyDetailsStep';
import CoApplicantDetailsStep from './CoApplicantDetailsStep';
import ReviewStep from './ReviewStep';
import SuccessStep from './SuccessStep';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';

const steps = [
  { title: 'Personal Details', description: 'Tell us about yourself' },
  { title: 'Study Details', description: 'Your education plans' },
  { title: 'Co-Applicant', description: 'Guardian information' },
  { title: 'Review', description: 'Confirm your details' },
  { title: 'Submit', description: 'Complete application' },
];

const StudentApplicationFlow = () => {
  const {
    currentStep,
    applicationData,
    isSubmitting,
    updateApplicationData,
    nextStep,
    prevStep,
    submitApplication,
  } = useStudentApplication();

  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const handleSubmit = async () => {
    const result = await submitApplication();
    if (result) {
      setSubmissionResult(result);
      nextStep();
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicator */}
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex flex-col items-center flex-1 ${
              index < steps.length - 1 ? 'border-r' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                index <= currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
            <p className="text-xs mt-1 hidden md:block">{step.title}</p>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <PersonalDetailsStep
              data={applicationData}
              onUpdate={updateApplicationData}
              onNext={nextStep}
            />
          )}

          {currentStep === 1 && (
            <StudyDetailsStep
              data={applicationData}
              onUpdate={updateApplicationData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {currentStep === 2 && (
            <CoApplicantDetailsStep
              data={applicationData}
              onUpdate={updateApplicationData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {currentStep === 3 && (
            <ReviewStep
              data={applicationData}
              onSubmit={handleSubmit}
              onPrev={prevStep}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 4 && submissionResult && (
            <SuccessStep
              caseId={submissionResult.lead?.case_id || submissionResult.case_id}
              leadId={submissionResult.lead?.id}
              recommendedLenders={submissionResult.recommended_lenders || []}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentApplicationFlow;
