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
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const steps = [
  { title: 'Personal Details', description: 'Tell us about yourself' },
  { title: 'Academic Background', description: 'Your education history' },
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

  const handleFillTestData = async () => {
    // First set study destination so universities can be loaded
    updateApplicationData({
      studyDestination: 'USA',
    });

    // Wait a moment for university data to be available
    setTimeout(() => {
      updateApplicationData({
        name: 'John Doe',
        phone: '9876543210',
        dateOfBirth: '2000-01-01',
        gender: 'male',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        nationality: 'Indian',
        highestQualification: 'bachelors',
        tenthPercentage: 85,
        twelfthPercentage: 88,
        bachelorsPercentage: 75,
        universities: [], // Will be filled manually from dropdown
        
        studyDestination: 'USA',
        intakeMonth: 9,
        intakeYear: 2025,
        loanAmount: 5000000,
        loanType: 'secured',
        coApplicantName: 'Jane Doe',
        coApplicantRelationship: 'parent',
        coApplicantPhone: '9876543211',
        coApplicantEmail: 'jane.doe@example.com',
        coApplicantMonthlySalary: 100000,
        coApplicantEmploymentType: 'salaried' as const,
        coApplicantPinCode: '400001',
      });
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
                window.location.href = '/student';
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={handleFillTestData} 
              variant="outline" 
              size="sm"
              type="button"
            >
              Fill Test Data
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (window.confirm('Are you sure you want to logout?')) {
                  await signOut();
                  navigate('/login');
                }
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicator */}
      <div className="flex justify-between gap-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex flex-col items-center flex-1 transition-all duration-300`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            <p className={`text-xs mt-2 text-center font-medium ${
              index === currentStep ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {step.title}
            </p>
            {index < currentStep && (
              <p className="text-xs text-green-600 hidden md:block">Completed</p>
            )}
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
              recommendedLenders={submissionResult.recommended_lenders || []}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentApplicationFlow;
