import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStudentApplication, StudentApplicationData } from '@/hooks/useStudentApplication';
import PersonalDetailsStep from './PersonalDetailsStep';
import AcademicBackgroundStep from './AcademicBackgroundStep';
import StudyDetailsStep from './StudyDetailsStep';
import CoApplicantDetailsStep from './CoApplicantDetailsStep';
import ReviewStep from './ReviewStep';
import SuccessStep from './SuccessStep';
import { useState } from 'react';
import { LogOut, ChevronLeft, Save, Shield, Lock, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { TrustIndicators } from './TrustIndicators';
import { LiveEligibilityScore } from './LiveEligibilityScore';
import { EnhancedProgressStepper } from './EnhancedProgressStepper';
import { WhatsAppSupport } from './WhatsAppSupport';
import { StepMotivation } from './StepMotivation';
import { cn } from '@/lib/utils';

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

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout? Your progress will be saved.')) {
      await signOut();
      navigate('/');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/student');
  };

  const goToStep = (step: number) => {
    // Navigate to specific step for editing
    while (currentStep > step) {
      prevStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-muted/20">
      {/* Clean Header */}
      {currentStep < 5 && (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToDashboard}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground font-bold text-sm">E</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-semibold">EduLoans</span>
                <span className="text-xs text-muted-foreground ml-1">by CashKaro</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <WhatsAppSupport step={currentStep} />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Trust Bar */}
      {currentStep < 5 && (
        <div className="bg-muted/50 border-b py-2">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-4 sm:gap-8 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden sm:inline">SSL Secured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Data Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-primary" />
              <span>₹500Cr+ Funded</span>
            </div>
            <Badge variant="secondary" className="animate-pulse text-xs">
              🔥 147 applied today
            </Badge>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {currentStep < 5 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Progress Stepper */}
              <EnhancedProgressStepper currentStep={currentStep} />

              {/* Step Motivation */}
              <StepMotivation step={currentStep} />

              {/* Form Card */}
              <Card className="border-2 shadow-xl shadow-primary/5 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-muted/50 via-muted/30 to-transparent border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {steps[currentStep].title}
                        <Badge variant="outline" className="text-xs font-normal">
                          Step {currentStep + 1}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">{steps[currentStep].description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
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
                      goToStep={goToStep}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Auto-save indicator */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Save className="h-3 w-3" />
                <span>Progress saved automatically</span>
              </div>
            </div>

            {/* Sidebar - Desktop only */}
            <div className="hidden lg:block w-80 space-y-6">
              {/* Live Eligibility Score */}
              <div className="sticky top-24">
                <LiveEligibilityScore data={applicationData} />

                {/* Help Card */}
                <Card className="mt-6 border-dashed">
                  <CardContent className="pt-6 text-center space-y-3">
                    <div className="text-3xl">💬</div>
                    <p className="text-sm font-medium">Need Help?</p>
                    <p className="text-xs text-muted-foreground">
                      Our loan experts are available 24/7 to assist you.
                    </p>
                    <WhatsAppSupport step={currentStep} className="w-full" />
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-primary">5</p>
                    <p className="text-xs text-muted-foreground">Partner Lenders</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-primary">24h</p>
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Eligibility Score */}
        {currentStep < 5 && currentStep > 0 && (
          <div className="lg:hidden mt-6">
            <LiveEligibilityScore data={applicationData} className="mx-auto max-w-md" />
          </div>
        )}

        {/* Trust Indicators - shown on first step only */}
        {currentStep === 0 && (
          <div className="mt-8 lg:max-w-3xl lg:mx-auto">
            <TrustIndicators />
          </div>
        )}

        {/* Success Step - Full width */}
        {currentStep === 5 && submissionResult && (
          <SuccessStep
            caseId={submissionResult.lead?.case_id || submissionResult.case_id}
            leadId={submissionResult.lead?.id}
            requestedAmount={submissionResult.lead?.requested_amount || applicationData.loanAmount}
            recommendedLenders={submissionResult.recommended_lenders || []}
          />
        )}
      </div>
    </div>
  );
};

export default StudentApplicationFlow;
