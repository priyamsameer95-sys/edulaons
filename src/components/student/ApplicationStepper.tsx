/**
 * Application Stepper
 * 
 * Non-clickable 5-step visual progress indicator.
 * Only one step is active at a time.
 * Locked steps show lock icon.
 */
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApplicationStepperProps {
  currentStep: number; // 1-5
}

const STEPS = [
  { id: 1, label: 'Application Created' },
  { id: 2, label: 'Upload Documents' },
  { id: 3, label: 'Lender Review' },
  { id: 4, label: 'Approved' },
  { id: 5, label: 'Disbursed' },
];

// Map lead status to stepper step
export const getStepFromStatus = (status: string, documentsStatus: string): number => {
  // If documents are not complete, we're on step 2
  if (documentsStatus !== 'verified') {
    return 2;
  }

  const statusMap: Record<string, number> = {
    'new': 2,
    'docs_pending': 2,
    'under_review': 3,
    'lender_review': 3,
    'processing': 3,
    'credit_check': 3,
    'approved': 4,
    'sanction_issued': 4,
    'disbursement_pending': 4,
    'disbursed': 5,
    'rejected': 3, // Show at review step
    'on_hold': 3,
  };

  return statusMap[status] || 2;
};

const ApplicationStepper = ({ currentStep }: ApplicationStepperProps) => {
  return (
    <div className="w-full py-4">
      {/* Desktop/Tablet - Horizontal */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        
        {STEPS.map((step) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isLocked = step.id > currentStep;

          return (
            <div 
              key={step.id} 
              className="flex flex-col items-center relative z-10"
            >
              {/* Step Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted && "bg-primary border-primary",
                  isActive && "bg-primary border-primary ring-4 ring-primary/20",
                  isLocked && "bg-muted border-border"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-primary-foreground" />
                ) : isActive ? (
                  <span className="w-3 h-3 rounded-full bg-primary-foreground animate-pulse" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              
              {/* Step Label */}
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-[80px]",
                  isCompleted && "text-primary",
                  isActive && "text-foreground font-semibold",
                  isLocked && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile - Vertical Compact */}
      <div className="sm:hidden">
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isActive = step.id === currentStep;
            const isLocked = step.id > currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0",
                      isCompleted && "bg-primary border-primary",
                      isActive && "bg-primary border-primary ring-2 ring-primary/20",
                      isLocked && "bg-muted border-border"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    ) : isActive ? (
                      <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                    ) : (
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-1 text-[10px] text-center whitespace-nowrap",
                      isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "w-6 h-0.5 mx-1 mt-[-16px]",
                    step.id < currentStep ? "bg-primary" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ApplicationStepper;
