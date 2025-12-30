/**
 * Stage Timeline
 * 
 * Simplified 5-step timeline without lock icons.
 * Only current + completed steps highlighted.
 * Future steps muted (not scary).
 */
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageTimelineProps {
  currentStep: number; // 1-5
  className?: string;
}

const STAGES = [
  { id: 1, label: 'Created' },
  { id: 2, label: 'Documents' },
  { id: 3, label: 'Review' },
  { id: 4, label: 'Approval' },
  { id: 5, label: 'Disbursed' },
];

// Map lead status to timeline step
export const getTimelineStep = (status: string, documentsStatus: string): number => {
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
    'rejected': 3,
    'on_hold': 3,
  };

  return statusMap[status] || 2;
};

const StageTimeline = ({ currentStep, className }: StageTimelineProps) => {
  return (
    <div className={cn(
      "p-4 lg:p-6 bg-card border border-border rounded-2xl",
      className
    )}>
      {/* Desktop/Tablet - Horizontal */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between relative">
          {/* Background line */}
          <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-border" />
          
          {/* Progress line */}
          <div 
            className="absolute top-4 left-[10%] h-0.5 bg-primary transition-all duration-700 ease-out"
            style={{ 
              width: `${Math.max(0, ((currentStep - 1) / (STAGES.length - 1)) * 80)}%` 
            }}
          />

          {STAGES.map((stage) => {
            const isCompleted = stage.id < currentStep;
            const isActive = stage.id === currentStep;
            const isFuture = stage.id > currentStep;

            return (
              <div key={stage.id} className="flex flex-col items-center relative z-10 flex-1">
                {/* Circle */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    "border-2",
                    isCompleted && "bg-primary border-primary",
                    isActive && "bg-primary border-primary ring-4 ring-primary/20",
                    isFuture && "bg-muted border-muted-foreground/20"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-primary-foreground" />
                  ) : isActive ? (
                    <span className="w-2 h-2 rounded-full bg-primary-foreground" />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {stage.id}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center",
                    isCompleted && "text-primary",
                    isActive && "text-foreground font-semibold",
                    isFuture && "text-muted-foreground/60"
                  )}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile - Compact Horizontal */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between relative px-2">
          {/* Background line */}
          <div className="absolute top-3 left-6 right-6 h-0.5 bg-border" />
          
          {/* Progress line */}
          <div 
            className="absolute top-3 left-6 h-0.5 bg-primary transition-all duration-500"
            style={{ 
              width: `${Math.max(0, ((currentStep - 1) / (STAGES.length - 1)) * (100 - 12))}%` 
            }}
          />

          {STAGES.map((stage) => {
            const isCompleted = stage.id < currentStep;
            const isActive = stage.id === currentStep;
            const isFuture = stage.id > currentStep;

            return (
              <div key={stage.id} className="flex flex-col items-center relative z-10">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium",
                    "border-2 transition-all",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isActive && "bg-primary border-primary text-primary-foreground ring-2 ring-primary/20",
                    isFuture && "bg-muted border-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    stage.id
                  )}
                </div>
                
                {/* Only show label for active step on mobile */}
                {isActive && (
                  <span className="mt-1.5 text-[10px] font-semibold text-foreground whitespace-nowrap">
                    {stage.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StageTimeline;
