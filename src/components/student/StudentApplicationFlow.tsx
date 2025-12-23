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
import { LogOut, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const steps = [
  { id: 1, title: 'Personal', description: 'Tell us about yourself' },
  { id: 2, title: 'Academic', description: 'Your education history' },
  { id: 3, title: 'Study Plans', description: 'Your education plans' },
  { id: 4, title: 'Co-Applicant', description: 'Guardian information' },
  { id: 5, title: 'Review', description: 'Confirm your details' },
  { id: 6, title: 'Success', description: 'Application submitted' }
];

const StudentApplicationFlow = () => {
  const {
    currentStep,
    applicationData,
    isSubmitting,
    updateApplicationData,
    nextStep,
    prevStep,
    submitApplication
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

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout? Your progress will be saved.')) {
      await signOut();
      navigate('/student/landing');
    }
  };

  // Success step - full width, no sidebar
  if (currentStep === 5 && submissionResult) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <SuccessStep 
            caseId={submissionResult.lead?.case_id || submissionResult.case_id} 
            leadId={submissionResult.lead?.id} 
            requestedAmount={submissionResult.lead?.requested_amount || applicationData.loanAmount} 
            recommendedLenders={submissionResult.recommended_lenders || []} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/student/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">
              Eduloans <span className="text-muted-foreground font-normal">by Cashkaro</span>
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Simple Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">Step {currentStep + 1} of {steps.length - 1}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{currentStep + 1}</span>
              </div>
              <div>
                <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentApplicationFlow;
