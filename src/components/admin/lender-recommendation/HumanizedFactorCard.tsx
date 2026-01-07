/**
 * HumanizedFactorCard - Displays a single BRE factor with human-friendly messaging
 */

import { Star, Check, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HumanizedBREFactor } from '@/constants/breHumanizer';

interface HumanizedFactorCardProps {
  factor: HumanizedBREFactor;
  compact?: boolean;
}

const iconMap = {
  star: Star,
  check: Check,
  info: Info,
  alert: AlertCircle,
};

const categoryStyles = {
  strength: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
    label: 'text-emerald-700 dark:text-emerald-300',
  },
  eligibility: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    label: 'text-blue-700 dark:text-blue-300',
  },
  consideration: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
    label: 'text-amber-700 dark:text-amber-300',
  },
};

export function HumanizedFactorCard({ factor, compact = false }: HumanizedFactorCardProps) {
  const Icon = iconMap[factor.icon || 'check'];
  const styles = categoryStyles[factor.category];

  if (compact) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
        styles.bg,
        styles.border,
        "border"
      )}>
        <Icon className={cn("h-3 w-3 shrink-0", styles.icon)} />
        <span className={cn("font-medium", styles.label)}>{factor.label}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border transition-all",
      styles.bg,
      styles.border
    )}>
      <div className={cn(
        "mt-0.5 p-1 rounded-full",
        factor.category === 'strength' && "bg-emerald-100 dark:bg-emerald-900/50",
        factor.category === 'eligibility' && "bg-blue-100 dark:bg-blue-900/50",
        factor.category === 'consideration' && "bg-amber-100 dark:bg-amber-900/50"
      )}>
        <Icon className={cn("h-3.5 w-3.5", styles.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", styles.label)}>
          {factor.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {factor.description}
        </p>
      </div>
      {factor.impact === 'high' && (
        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">
          High Impact
        </span>
      )}
    </div>
  );
}

export default HumanizedFactorCard;
