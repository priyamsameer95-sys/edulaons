import {
  CheckCircle,
  Bell,
  Upload,
  ClipboardCheck,
  Users,
  FileCheck,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessFlowGuideProps {
  currentStep?: number;
  completedSteps?: number[];
  totalLeads?: number;
}

export const ProcessFlowGuide = ({
  currentStep = 1,
  completedSteps = [],
  totalLeads = 0,
}: ProcessFlowGuideProps) => {
  const steps = [
    { id: 1, icon: CheckCircle, title: 'Lead Created' },
    { id: 2, icon: Bell, title: 'Student Notified' },
    { id: 3, icon: Upload, title: 'Upload Docs' },
    { id: 4, icon: ClipboardCheck, title: 'RM Verifies' },
    { id: 5, icon: Users, title: 'Coordination' },
    { id: 6, icon: FileCheck, title: 'File Logged' },
    { id: 7, icon: TrendingUp, title: 'Processing' },
  ];

  // Only show for partners with fewer than 5 leads (onboarding helper)
  if (totalLeads > 5) {
    return null;
  }

  return (
    <div className="border rounded-lg bg-card shadow-sm p-4">
      {/* Header */}
      <div className="text-sm text-muted-foreground mb-4 text-center font-medium">
        Process Flow
      </div>

      {/* Steps Container */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = completedSteps.includes(step.id);

          return (
            <div key={step.id} className="flex items-center gap-3">
              {/* Step */}
              <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center transition-all',
                    isActive && 'bg-primary/20 ring-2 ring-primary/30',
                    isCompleted && 'bg-green-100 dark:bg-green-950',
                    !isActive && !isCompleted && 'bg-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isActive && 'text-primary',
                      isCompleted && 'text-green-600 dark:text-green-400',
                      !isActive && !isCompleted && 'text-muted-foreground'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs font-medium text-center leading-tight',
                    isActive && 'text-foreground',
                    isCompleted && 'text-green-600 dark:text-green-400',
                    !isActive && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>

              {/* Arrow Separator (hidden on last step and mobile) */}
              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground/30 hidden md:block shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
