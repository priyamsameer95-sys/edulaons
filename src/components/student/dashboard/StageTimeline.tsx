/**
 * Stage Timeline
 * 
 * Simple 5-step journey visualization.
 * Only current + completed highlighted. No locks, no fear.
 */
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageTimelineProps {
  currentStep: number; // 1-5
  className?: string;
}

const STAGES = [
  { id: 1, label: 'Application Created' },
  { id: 2, label: 'Documents' },
  { id: 3, label: 'Lender Review' },
  { id: 4, label: 'Approved' },
  { id: 5, label: 'Disbursed' },
];

export const getTimelineStep = (status: string, documentsStatus: string): number => {
  if (documentsStatus !== 'verified') return 2;

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
      "p-6 lg:p-8 bg-card border border-border rounded-2xl",
      className
    )}>
      <h3 className="text-sm font-medium text-muted-foreground mb-6 text-center lg:text-left">
        Your Journey
      </h3>
      
      {/* Desktop - Horizontal */}
      <div className="hidden md:block">
        <div className="flex items-start justify-between relative">
          {/* Background line */}
          <div className="absolute top-5 left-[8%] right-[8%] h-0.5 bg-border" />
          
          {/* Progress line */}
          <div 
            className="absolute top-5 left-[8%] h-0.5 bg-primary transition-all duration-700"
            style={{ 
              width: `${Math.max(0, ((currentStep - 1) / (STAGES.length - 1)) * 84)}%` 
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
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    "border-2",
                    isCompleted && "bg-primary border-primary",
                    isActive && "bg-primary border-primary ring-4 ring-primary/20",
                    isFuture && "bg-card border-muted-foreground/20"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-primary-foreground" />
                  ) : isActive ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground/60">
                      {stage.id}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "mt-3 text-sm font-medium text-center max-w-[100px]",
                    isCompleted && "text-primary",
                    isActive && "text-foreground font-semibold",
                    isFuture && "text-muted-foreground/50"
                  )}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile - Compact */}
      <div className="md:hidden">
        <div className="flex items-center justify-between relative px-4">
          {/* Background line */}
          <div className="absolute top-4 left-8 right-8 h-0.5 bg-border" />
          
          {/* Progress line */}
          <div 
            className="absolute top-4 left-8 h-0.5 bg-primary transition-all duration-500"
            style={{ 
              width: `${Math.max(0, ((currentStep - 1) / (STAGES.length - 1)) * 85)}%` 
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
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                    "border-2 transition-all",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isActive && "bg-primary border-primary text-primary-foreground ring-2 ring-primary/20",
                    isFuture && "bg-card border-muted-foreground/20 text-muted-foreground/50"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : stage.id}
                </div>
                
                {isActive && (
                  <span className="mt-2 text-xs font-semibold text-foreground whitespace-nowrap">
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
