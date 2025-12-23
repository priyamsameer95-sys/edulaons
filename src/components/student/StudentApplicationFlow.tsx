import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStudentApplication, StudentApplicationData } from '@/hooks/useStudentApplication';
import PersonalDetailsStep from './PersonalDetailsStep';
import AcademicBackgroundStep from './AcademicBackgroundStep';
import StudyDetailsStep from './StudyDetailsStep';
import CoApplicantDetailsStep from './CoApplicantDetailsStep';
import ReviewStep from './ReviewStep';
import SuccessStep from './SuccessStep';
import { useState } from 'react';
import { LogOut, ArrowLeft, User, GraduationCap, Plane, Users, FileCheck, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const steps = [
  { id: 0, title: 'Personal', icon: User },
  { id: 1, title: 'Academic', icon: GraduationCap },
  { id: 2, title: 'Study Plans', icon: Plane },
  { id: 3, title: 'Co-Applicant', icon: Users },
  { id: 4, title: 'Review', icon: FileCheck },
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

  // Success step
  if (currentStep === 5 && submissionResult) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-3xl mx-auto">
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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/student/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <span className="text-lg font-semibold hidden sm:block">Loan Application</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "border-primary text-primary bg-primary/10",
                      !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                    )}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={cn(
                      "text-xs mt-2 font-medium hidden sm:block",
                      isCurrent && "text-primary",
                      !isCurrent && !isCompleted && "text-muted-foreground"
                    )}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2 sm:mx-4",
                      index < currentStep ? "bg-primary" : "bg-border"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/50 px-6 py-4">
            <CardTitle className="text-lg font-semibold">
              {steps[currentStep]?.title}
            </CardTitle>
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
