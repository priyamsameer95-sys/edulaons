/**
 * ProTipBanner - Displays contextual advice based on BRE data
 * 
 * Shows actionable tips like "Adding collateral could reduce your rate by 1%"
 */

import { Lightbulb, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProTip } from '@/constants/breHumanizer';

interface ProTipBannerProps {
  tip: ProTip;
  className?: string;
}

const typeStyles = {
  opportunity: {
    bg: 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600',
    title: 'text-emerald-700 dark:text-emerald-300',
    message: 'text-emerald-600 dark:text-emerald-400',
    Icon: TrendingUp,
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600',
    title: 'text-blue-700 dark:text-blue-300',
    message: 'text-blue-600 dark:text-blue-400',
    Icon: Info,
  },
  action: {
    bg: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600',
    title: 'text-amber-700 dark:text-amber-300',
    message: 'text-amber-600 dark:text-amber-400',
    Icon: Lightbulb,
  },
};

export function ProTipBanner({ tip, className }: ProTipBannerProps) {
  const styles = typeStyles[tip.type];
  const Icon = styles.Icon;

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border",
      styles.bg,
      styles.border,
      className
    )}>
      <div className="mt-0.5 p-1.5 rounded-full bg-white/50 dark:bg-black/20">
        <Icon className={cn("h-4 w-4", styles.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-semibold", styles.title)}>
          💡 {tip.title}
        </p>
        <p className={cn("text-xs mt-0.5", styles.message)}>
          {tip.message}
        </p>
      </div>
    </div>
  );
}

export default ProTipBanner;
