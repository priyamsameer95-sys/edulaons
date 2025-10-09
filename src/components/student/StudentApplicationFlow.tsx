import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudentApplicationContext } from '@/contexts/StudentApplicationContext';
import PersonalDetailsStep from './PersonalDetailsStep';
import StudyDetailsStep from './StudyDetailsStep';
import CoApplicantDetailsStep from './CoApplicantDetailsStep';
import ReviewStep from './ReviewStep';
import SuccessStep from './SuccessStep';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
    validationErrors,
    submissionResult,
    updateApplicationData,
    nextStep,
    prevStep,
    goToStep,
    submitApplication,
  } = useStudentApplicationContext();

  const handleSubmit = async () => {
    const result = await submitApplication();
    if (result) {
      await nextStep(); // Move to success step
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  // Allow clicking on completed steps to navigate back
  const handleStepClick = (index: number) => {
    if (index < currentStep) {
      goToStep(index);
    }
  };

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
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = isComplete;

          return (
            <div
              key={index}
              className={`flex flex-col items-center flex-1 ${
                index < steps.length - 1 ? 'border-r border-border' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => isClickable && handleStepClick(index)}
                disabled={!isClickable}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                    : isComplete
                    ? 'bg-primary/80 text-primary-foreground cursor-pointer hover:bg-primary'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {index + 1}
              </button>
              <p className={`text-xs mt-2 text-center hidden md:block ${
                isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}>
                {step.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && <PersonalDetailsStep />}

          {currentStep === 1 && <StudyDetailsStep />}

          {currentStep === 2 && <CoApplicantDetailsStep />}

          {currentStep === 3 && (
            <ReviewStep onSubmit={handleSubmit} />
          )}

          {currentStep === 4 && (
            submissionResult ? (
              <SuccessStep
                caseId={submissionResult.lead?.case_id || submissionResult.case_id}
                leadId={submissionResult.lead?.id}
                recommendedLenders={submissionResult.recommended_lenders || []}
              />
            ) : (
              <div className="space-y-4 text-center py-8">
                <p className="text-muted-foreground">
                  You're on the final step. Please click "Submit Application" from the Review step to complete your application.
                </p>
                {currentStep > 0 && (
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back to Review
                  </Button>
                )}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentApplicationFlow;
