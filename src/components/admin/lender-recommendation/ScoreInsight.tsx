/**
 * ScoreInsight - Provides human-readable context for the fit score
 * 
 * Transforms "65%" into "This is a Strong Option — you meet all criteria..."
 */

import { TrendingUp, ThumbsUp, Lightbulb, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getScoreInsight, type ScoreInsight as ScoreInsightType } from '@/constants/breHumanizer';

interface ScoreInsightProps {
  score: number;
  lenderName: string;
  topLenderName?: string;
  gapReason?: string;
  className?: string;
}

const variantStyles = {
  excellent: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600',
    label: 'text-emerald-700 dark:text-emerald-300',
    message: 'text-emerald-600 dark:text-emerald-400',
    Icon: TrendingUp,
  },
  strong: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600',
    label: 'text-blue-700 dark:text-blue-300',
    message: 'text-blue-600 dark:text-blue-400',
    Icon: ThumbsUp,
  },
  good: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600',
    label: 'text-amber-700 dark:text-amber-300',
    message: 'text-amber-600 dark:text-amber-400',
    Icon: Lightbulb,
  },
  explore: {
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    border: 'border-slate-200 dark:border-slate-800',
    icon: 'text-slate-600',
    label: 'text-slate-700 dark:text-slate-300',
    message: 'text-slate-600 dark:text-slate-400',
    Icon: HelpCircle,
  },
};

export function ScoreInsight({ 
  score, 
  lenderName, 
  topLenderName, 
  gapReason,
  className 
}: ScoreInsightProps) {
  const insight = getScoreInsight(score, lenderName, topLenderName, gapReason);
  const styles = variantStyles[insight.variant];
  const Icon = styles.Icon;

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border",
      styles.bg,
      styles.border,
      className
    )}>
      <div className={cn("mt-0.5 p-1.5 rounded-full", styles.bg)}>
        <Icon className={cn("h-4 w-4", styles.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", styles.label)}>
            {insight.label}
          </span>
          <span className={cn(
            "text-xs font-bold px-1.5 py-0.5 rounded",
            insight.variant === 'excellent' && "bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200",
            insight.variant === 'strong' && "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200",
            insight.variant === 'good' && "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200",
            insight.variant === 'explore' && "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          )}>
            {score}%
          </span>
        </div>
        <p className={cn("text-xs mt-1", styles.message)}>
          {insight.message}
        </p>
      </div>
    </div>
  );
}

export default ScoreInsight;
