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
import { LogOut, Home, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { TrustIndicators } from './TrustIndicators';
import { ProgressSaver } from './ProgressSaver';

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
  const [lastSaved] = useState(new Date());
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
  const minutesRemaining = Math.max(12 - currentStep * 2, 2);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout? Your progress will be saved.')) {
      await signOut();
      navigate('/student/landing');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        {currentStep < 5 && (
          <div className="mb-6 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-4">
              <ProgressSaver lastSaved={lastSaved} />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}

        {/* Welcome Hero */}
        {currentStep < 5 && (
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 mb-6 animate-scale-in shadow-xl">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-2">
                Hi {applicationData.name || 'there'}! Let's secure your education funding 🎓
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>~{minutesRemaining} min remaining</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>{currentStep} of {steps.length - 1} steps completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Progress Bar */}
        {currentStep < 5 && (
          <div className="mb-8 animate-fade-in">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span className="font-medium">{Math.round(progress)}% Complete</span>
              {progress >= 16 && progress < 20 && <span className="text-primary font-semibold animate-gentle-pulse">🎉 Great start!</span>}
              {progress >= 50 && progress < 55 && <span className="text-primary font-semibold animate-gentle-pulse">🚀 Halfway done!</span>}
              {progress >= 83 && progress < 87 && <span className="text-primary font-semibold animate-gentle-pulse">⭐ Almost there!</span>}
            </div>
          </div>
        )}

        {/* Enhanced Milestone Step Indicators */}
        {currentStep < 5 && (
          <div className="flex justify-between mb-12 relative px-2">
            <div className="milestone-line">
              <div className="milestone-line-progress" style={{ width: `${(currentStep / (steps.length - 2)) * 100}%` }} />
            </div>
            {steps.slice(0, -1).map((step, index) => (
              <div 
                key={step.id} 
                className={`flex flex-col items-center flex-1 relative z-10 transition-all duration-300 ${
                  index === 0 ? '' : 
                  index === 1 ? 'stagger-fade-1' : 
                  index === 2 ? 'stagger-fade-2' : 
                  index === 3 ? 'stagger-fade-3' : 
                  'stagger-fade-4'
                }`}
              >
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-3 transition-all duration-300 shadow-lg
                  ${index < currentStep ? 'bg-gradient-to-br from-green-500 to-green-600 text-white hover-lift scale-110' : ''}
                  ${index === currentStep ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white ring-4 ring-blue-200 dark:ring-blue-900 animate-gentle-pulse scale-110' : ''}
                  ${index > currentStep ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-2 border-gray-300 dark:border-gray-600' : ''}
                `}>
                  {index < currentStep ? (
                    <CheckCircle className="h-6 w-6 animate-scale-in" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className={`
                  text-xs text-center font-semibold max-w-[80px] transition-colors duration-300
                  ${index === currentStep ? 'text-blue-600 dark:text-blue-400' : index < currentStep ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}
                `}>
                  {step.title}
                </span>
                {index < currentStep && (
                  <span className="text-[10px] text-green-600 dark:text-green-400 mt-0.5 font-medium">✓ Done</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step Content */}
        <Card className="premium-card">
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
          <div className="mt-12">
            <TrustIndicators />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentApplicationFlow;
