import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProcessStepCardProps {
  stepNumber: number;
  icon: LucideIcon;
  title: string;
  description: string;
  timeline: string;
  trustElement?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export const ProcessStepCard = ({
  stepNumber,
  icon: Icon,
  title,
  description,
  timeline,
  trustElement,
  isActive = false,
  isCompleted = false,
  ctaLabel,
  onCtaClick,
}: ProcessStepCardProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center text-center p-6 rounded-lg border-2 transition-all duration-300 group",
        isActive && "border-primary bg-primary/5 shadow-lg scale-105",
        isCompleted && "border-success/30 bg-success/5",
        !isActive && !isCompleted && "border-border/50 bg-card hover:border-primary/30 hover:shadow-md"
      )}
    >
      {/* Step Number Badge */}
      <Badge
        variant={isCompleted ? "default" : isActive ? "default" : "secondary"}
        className={cn(
          "absolute -top-3 -left-3 h-7 w-7 rounded-full flex items-center justify-center font-bold",
          isCompleted && "bg-success text-success-foreground",
          isActive && "animate-pulse"
        )}
      >
        {stepNumber}
      </Badge>

      {/* Icon */}
      <div
        className={cn(
          "h-16 w-16 rounded-full flex items-center justify-center mb-4 transition-all",
          isActive && "bg-primary/20 ring-4 ring-primary/20",
          isCompleted && "bg-success/20",
          !isActive && !isCompleted && "bg-muted group-hover:bg-primary/10"
        )}
      >
        <Icon
          className={cn(
            "h-8 w-8",
            isActive && "text-primary",
            isCompleted && "text-success",
            !isActive && !isCompleted && "text-muted-foreground"
          )}
        />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-base mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3 min-h-[3rem]">{description}</p>

      {/* Timeline Badge */}
      <Badge variant="outline" className="mb-2">
        ⏱️ {timeline}
      </Badge>

      {/* Trust Element */}
      {trustElement && (
        <div className="text-xs text-success flex items-center gap-1 mt-1">
          <span>✓</span>
          <span>{trustElement}</span>
        </div>
      )}

      {/* CTA Button */}
      {ctaLabel && onCtaClick && isActive && (
        <Button
          size="sm"
          variant="default"
          onClick={onCtaClick}
          className="mt-4 w-full"
        >
          {ctaLabel}
        </Button>
      )}

      {/* Pulsing indicator for active step */}
      {isActive && (
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
      )}
    </div>
  );
};
