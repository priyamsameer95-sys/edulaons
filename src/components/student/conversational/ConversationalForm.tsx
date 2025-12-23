import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import type { StudentApplicationData } from '@/types/student-application';
import PersonalDetailsPage from '../form-pages/PersonalDetailsPage';
import StudyLoanPage from '../form-pages/StudyLoanPage';
import CoApplicantReviewPage from '../form-pages/CoApplicantReviewPage';

interface ConversationalFormProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

const STEPS = [
  { id: 1, title: 'Personal Details' },
  { id: 2, title: 'Study & Loan' },
  { id: 3, title: 'Co-Applicant & Submit' },
];

const ConversationalForm = ({ data, onUpdate, onSubmit, isSubmitting }: ConversationalFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = STEPS.length;
  const progress = (currentStep / totalSteps) * 100;

  const goNext = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, totalSteps]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const renderPage = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalDetailsPage
            data={data}
            onUpdate={onUpdate}
            onNext={goNext}
          />
        );
      case 2:
        return (
          <StudyLoanPage
            data={data}
            onUpdate={onUpdate}
            onNext={goNext}
          />
        );
      case 3:
        return (
          <CoApplicantReviewPage
            data={data}
            onUpdate={onUpdate}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div 
          className="h-full bg-primary transition-all duration-300" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      {/* Header with back button and step indicator */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Back button */}
          <button
            onClick={goPrev}
            disabled={currentStep === 1}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
              currentStep === 1 
                ? "opacity-30 cursor-not-allowed text-muted-foreground" 
                : "hover:bg-muted text-foreground"
            )}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  step.id === currentStep
                    ? "bg-primary w-6"
                    : step.id < currentStep
                    ? "bg-primary"
                    : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Step count */}
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-8">
        {renderPage()}
      </div>
    </div>
  );
};

export default ConversationalForm;
