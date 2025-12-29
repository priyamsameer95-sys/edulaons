/**
 * Visual Status Progress Bar
 * 
 * B2C-optimized progress indicator for loan application status
 */
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StatusProgressBarProps {
  currentStatus: string;
}

const PROGRESS_STAGES = [
  { key: 'new', label: 'Applied' },
  { key: 'docs_pending', label: 'Documents' },
  { key: 'under_review', label: 'Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'disbursed', label: 'Disbursed' },
];

// Map various statuses to progress stages
const STATUS_TO_STAGE: Record<string, number> = {
  'new': 0,
  'eligibility_check': 0,
  'docs_pending': 1,
  'docs_uploaded': 1,
  'docs_under_review': 2,
  'under_review': 2,
  'lender_review': 2,
  'pf_pending': 3,
  'credit_approved': 3,
  'approved': 3,
  'sanction_issued': 4,
  'disbursed': 4,
  'rejected': -1,
  'on_hold': -2,
};

const StatusProgressBar = ({ currentStatus }: StatusProgressBarProps) => {
  const currentStageIndex = STATUS_TO_STAGE[currentStatus] ?? 0;
  const isNegativeState = currentStageIndex < 0;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative flex items-center justify-between">
        {/* Connecting Line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
        <div 
          className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ 
            width: isNegativeState ? '0%' : `${(currentStageIndex / (PROGRESS_STAGES.length - 1)) * 100}%` 
          }}
        />
        
        {/* Stage Dots */}
        {PROGRESS_STAGES.map((stage, index) => {
          const isCompleted = !isNegativeState && index <= currentStageIndex;
          const isCurrent = !isNegativeState && index === currentStageIndex;
          
          return (
            <div 
              key={stage.key} 
              className="relative flex flex-col items-center z-10"
            >
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : "bg-background border-border text-muted-foreground",
                  isCurrent && "ring-4 ring-primary/20"
                )}
              >
                {isCompleted && index < currentStageIndex ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              <span 
                className={cn(
                  "text-[10px] sm:text-xs mt-2 font-medium text-center whitespace-nowrap",
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusProgressBar;
