import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProcessStepCardProps {
  stepNumber: number;
  icon: LucideIcon;
  title: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

export const ProcessStepCard = ({
  stepNumber,
  icon: Icon,
  title,
  isActive = false,
  isCompleted = false,
}: ProcessStepCardProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center text-center p-2 rounded-lg border transition-all",
        isActive && "border-primary bg-primary/5",
        isCompleted && "border-green-500/30 bg-green-50/50",
        !isActive && !isCompleted && "border-border bg-card"
      )}
    >
      {/* Step Number Badge */}
      <Badge
        variant={isCompleted ? "default" : isActive ? "default" : "secondary"}
        className={cn(
          "absolute -top-2 -left-2 h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px]",
          isCompleted && "bg-green-600 text-white"
        )}
      >
        {stepNumber}
      </Badge>

      {/* Icon */}
      <div
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center mb-1.5",
          isActive && "bg-primary/20",
          isCompleted && "bg-green-100",
          !isActive && !isCompleted && "bg-muted"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            isActive && "text-primary",
            isCompleted && "text-green-600",
            !isActive && !isCompleted && "text-muted-foreground"
          )}
        />
      </div>

      {/* Title */}
      <h3 className="font-medium text-xs leading-tight">{title}</h3>
    </div>
  );
};
