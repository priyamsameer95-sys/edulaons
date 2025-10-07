import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  label: string;
}

interface ProgressTimelineProps {
  currentStep: number;
  steps: Step[];
}

export const ProgressTimeline = ({ currentStep, steps }: ProgressTimelineProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  isCompleted && "bg-primary border-primary",
                  isCurrent && "bg-primary border-primary ring-4 ring-primary/20",
                  isFuture && "bg-background border-border"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-primary-foreground",
                      isFuture && "text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-sm font-medium text-center max-w-[100px] transition-colors",
                  isCompleted && "text-foreground",
                  isCurrent && "text-primary font-semibold",
                  isFuture && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
