import { useState } from 'react';
import { cn } from '@/lib/utils';
import { User, GraduationCap, Plane, Users, FileCheck, CheckCircle2, Clock } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  time: string;
}

interface EnhancedProgressStepperProps {
  currentStep: number;
  className?: string;
}

const steps: Step[] = [
  { id: 0, title: 'Personal', description: 'Your basic info', icon: User, time: '~2 min' },
  { id: 1, title: 'Academic', description: 'Education history', icon: GraduationCap, time: '~3 min' },
  { id: 2, title: 'Study Plans', description: 'Your goals', icon: Plane, time: '~2 min' },
  { id: 3, title: 'Co-Applicant', description: 'Guardian info', icon: Users, time: '~2 min' },
  { id: 4, title: 'Review', description: 'Confirm & submit', icon: FileCheck, time: '~1 min' },
];

export const EnhancedProgressStepper = ({ currentStep, className }: EnhancedProgressStepperProps) => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const progress = ((currentStep) / (steps.length - 1)) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress bar */}
      <div className="relative">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs font-medium text-primary">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
      </div>

      {/* Step cards - horizontal on desktop, vertical on mobile */}
      <div className="hidden md:flex gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;
          const isHovered = hoveredStep === index;

          return (
            <div
              key={step.id}
              className={cn(
                "flex-1 relative rounded-xl p-3 transition-all duration-300 cursor-default",
                "border",
                isCompleted && "bg-primary/5 border-primary/30",
                isCurrent && "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10",
                isUpcoming && "bg-muted/30 border-muted-foreground/10",
                isHovered && !isCurrent && "scale-[1.02]"
              )}
              onMouseEnter={() => setHoveredStep(index)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              <div className="flex items-start gap-2">
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground",
                  isUpcoming && "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-sm truncate",
                    isUpcoming && "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate hidden lg:block">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {/* Time estimate */}
              {isCurrent && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{step.time}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Compact step indicator */}
      <div className="flex md:hidden gap-1 justify-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step.id}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                isCurrent ? "w-8 bg-primary" : "w-2",
                isCompleted && "bg-primary/60",
                !isCompleted && !isCurrent && "bg-muted"
              )}
            />
          );
        })}
      </div>

      {/* Mobile: Current step label */}
      <div className="md:hidden text-center">
        <p className="font-semibold">{steps[currentStep]?.title}</p>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Clock className="h-3 w-3" />
          {steps[currentStep]?.time}
        </p>
      </div>
    </div>
  );
};
