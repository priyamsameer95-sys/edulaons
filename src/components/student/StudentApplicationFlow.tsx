import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStudentApplication, StudentApplicationData } from '@/hooks/useStudentApplication';
import PersonalDetailsStep from './PersonalDetailsStep';
import AcademicBackgroundStep from './AcademicBackgroundStep';
import StudyDetailsStep from './StudyDetailsStep';
import CoApplicantDetailsStep from './CoApplicantDetailsStep';
import ReviewStep from './ReviewStep';
import SuccessStep from './SuccessStep';
import { useState } from 'react';
import { LogOut, ChevronLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { TrustIndicators } from './TrustIndicators';

const steps = [
  { id: 1, title: 'Personal', description: 'Tell us about yourself' },
  { id: 2, title: 'Academic', description: 'Your education history' },
  { id: 3, title: 'Study Plans', description: 'Your education plans' },
  { id: 4, title: 'Co-Applicant', description: 'Guardian information' },
  { id: 5, title: 'Review', description: 'Confirm your details' },
  { id: 6, title: 'Success', description: 'Application submitted' },
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
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSubmit = async () => {
    const result = await submitApplication();
    if (result) {
      setSubmissionResult(result);
      nextStep();
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout? Your progress will be saved.')) {
      await signOut();
      navigate('/');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/student');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Clean Header */}
      {currentStep < 5 && (
        <header className="sticky top-0 z-50 bg-background border-b">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToDashboard}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">E</span>
              </div>
              <span className="font-semibold hidden sm:inline">EduLoanPro</span>
            </div>
            
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Progress Bar - Simple */}
        {currentStep < 5 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                Step {currentStep + 1} of {steps.length - 1}: {steps[currentStep].title}
              </span>
              <span className="text-muted-foreground">
                {Math.round(progress)}% complete
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Step Labels - Minimal */}
        {currentStep < 5 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.slice(0, -1).map((step, index) => (
              <span 
                key={step.id}
                className={`${
                  index === currentStep 
                    ? 'text-primary font-medium' 
                    : index < currentStep 
                      ? 'text-muted-foreground' 
                      : ''
                }`}
              >
                {index < currentStep ? '✓ ' : ''}{step.title}
              </span>
            ))}
          </div>
        )}

        {/* Step Content */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
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
              <AcademicBackgroundStep
                data={applicationData as StudentApplicationData}
                onUpdate={updateApplicationData}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}

            {currentStep === 2 && (
              <StudyDetailsStep
                data={applicationData}
                onUpdate={updateApplicationData}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}

            {currentStep === 3 && (
              <CoApplicantDetailsStep
                data={applicationData as StudentApplicationData}
                onUpdate={updateApplicationData}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}

            {currentStep === 4 && (
              <ReviewStep
                data={applicationData}
                onSubmit={handleSubmit}
                onPrev={prevStep}
                isSubmitting={isSubmitting}
              />
            )}

            {currentStep === 5 && submissionResult && (
              <SuccessStep
                caseId={submissionResult.lead?.case_id || submissionResult.case_id}
                leadId={submissionResult.lead?.id}
                requestedAmount={submissionResult.lead?.requested_amount || applicationData.loanAmount}
                recommendedLenders={submissionResult.recommended_lenders || []}
              />
            )}
          </CardContent>
        </Card>

        {/* Trust Indicators - shown on first step only */}
        {currentStep === 0 && (
          <div className="mt-8">
            <TrustIndicators />
          </div>
        )}

        {/* Auto-save indicator */}
        {currentStep < 5 && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Save className="h-3 w-3" />
            <span>Progress saved automatically</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentApplicationFlow;
