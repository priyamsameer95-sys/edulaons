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
import { LogOut, ArrowLeft, Shield, Lock, TrendingUp, Users, Clock, Save, Building2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { TrustIndicators } from './TrustIndicators';
import { LiveEligibilityScore } from './LiveEligibilityScore';
import { EnhancedProgressStepper } from './EnhancedProgressStepper';
import { WhatsAppSupport } from './WhatsAppSupport';
import { StepMotivation } from './StepMotivation';

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
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

      {/* Trust Bar */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-green-100 dark:border-green-900/50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-6 text-xs sm:text-sm flex-wrap">
          <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
            <Shield className="h-3.5 w-3.5" />
            <span className="font-medium">SSL Secured</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
            <Lock className="h-3.5 w-3.5" />
            <span className="font-medium">Data Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="font-medium">₹500Cr+ Funded</span>
          </div>
          <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 animate-pulse">
            <span>🔥</span>
            <span className="font-semibold">147 applied today</span>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6">
            {/* Live Eligibility Score */}
            <LiveEligibilityScore data={applicationData} />
            
            {/* Quick Stats */}
            <Card className="border-2 border-border/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">12+ Partner Lenders</p>
                    <p className="text-xs text-muted-foreground">Including SBI, HDFC, Axis</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">24hr Response</p>
                    <p className="text-xs text-muted-foreground">Average turnaround time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Need Help Card */}
            <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  Need Help?
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Our loan experts are available to guide you through the application.
                </p>
                <WhatsAppSupport step={currentStep} />
              </CardContent>
            </Card>
          </aside>

          {/* Main Form Area */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Mobile Eligibility Score */}
            <div className="lg:hidden">
              <LiveEligibilityScore data={applicationData} />
            </div>

            {/* Enhanced Progress Stepper */}
            <EnhancedProgressStepper currentStep={currentStep} />

            {/* Auto-save Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <Save className="h-3 w-3" />
              <span>Progress saved automatically</span>
            </div>

            {/* Step Motivation */}
            <StepMotivation step={currentStep} />

            {/* Form Card */}
            <Card className="border-2 border-border/50 shadow-xl shadow-primary/5 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 border-b border-border/50">
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

            {/* Trust Indicators - shown on first step only */}
            {currentStep === 0 && (
              <div className="mt-8">
                <TrustIndicators />
              </div>
            )}

            {/* Mobile Help Section */}
            <div className="lg:hidden">
              <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Need Help?</h3>
                    <p className="text-xs text-muted-foreground">Chat with our loan experts</p>
                  </div>
                  <WhatsAppSupport step={currentStep} />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudentApplicationFlow;
