import { cn } from '@/lib/utils';
import { Sparkles, TrendingUp, Target, Zap, CheckCircle2 } from 'lucide-react';

interface StepMotivationProps {
  step: number;
  className?: string;
}

const motivations: Record<number, { emoji: string; text: string; subtext: string; icon: React.ElementType }> = {
  0: { 
    emoji: '👋', 
    text: "Let's get started!", 
    subtext: "Your journey to funding your dream education begins here.",
    icon: Sparkles
  },
  1: { 
    emoji: '📚', 
    text: 'Great progress!', 
    subtext: "Your academic scores can boost eligibility by up to 40 points!",
    icon: TrendingUp
  },
  2: { 
    emoji: '🌍', 
    text: "You're halfway there!", 
    subtext: "Tell us about your dream university and we'll find the best lenders.",
    icon: Target
  },
  3: { 
    emoji: '💪', 
    text: 'Almost done!', 
    subtext: "Co-applicant income significantly improves approval chances.",
    icon: Zap
  },
  4: { 
    emoji: '🎯', 
    text: 'Ready to submit!', 
    subtext: "Review your details and let's get you funded!",
    icon: CheckCircle2
  },
};

export const StepMotivation = ({ step, className }: StepMotivationProps) => {
  const motivation = motivations[step];
  if (!motivation) return null;

  const Icon = motivation.icon;

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-xl",
      "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent",
      "border border-primary/20",
      className
    )}>
      <div className="text-3xl">{motivation.emoji}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{motivation.text}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{motivation.subtext}</p>
      </div>
    </div>
  );
};
