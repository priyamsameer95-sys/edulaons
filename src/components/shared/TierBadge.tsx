import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Star, Award, Medal, Circle } from 'lucide-react';

export type UniversityTier = 'S' | 'A' | 'B' | 'C';

interface TierBadgeProps {
  tier: UniversityTier;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const tierConfig: Record<UniversityTier, {
  label: string;
  fullLabel: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}> = {
  S: {
    label: 'Tier S',
    fullLabel: 'Super Prime',
    description: 'Top 100 Global University',
    icon: Star,
    colorClass: 'text-violet-700 dark:text-violet-400',
    bgClass: 'bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800',
  },
  A: {
    label: 'Tier A',
    fullLabel: 'Prime',
    description: 'Top 300 Global University',
    icon: Award,
    colorClass: 'text-blue-700 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  },
  B: {
    label: 'Tier B',
    fullLabel: 'Standard',
    description: 'Top 500 Global University',
    icon: Medal,
    colorClass: 'text-cyan-700 dark:text-cyan-400',
    bgClass: 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
  },
  C: {
    label: 'Tier C',
    fullLabel: 'Basic',
    description: 'Other Universities',
    icon: Circle,
    colorClass: 'text-slate-700 dark:text-slate-400',
    bgClass: 'bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800',
  },
};

export function TierBadge({ 
  tier, 
  showLabel = true,
  size = 'md',
  className 
}: TierBadgeProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center font-medium border',
        config.bgClass,
        config.colorClass,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn(iconSizes[size], tier === 'S' && 'fill-current')} />
      {showLabel && (
        <span>{size === 'lg' ? config.fullLabel : config.label}</span>
      )}
    </Badge>
  );
}

export function getTierTooltip(tier: UniversityTier): string {
  const config = tierConfig[tier];
  return `${config.fullLabel}: ${config.description}`;
}

export function TierIndicator({ tier }: { tier: UniversityTier }) {
  const colors: Record<UniversityTier, string> = {
    S: 'bg-violet-500',
    A: 'bg-blue-500',
    B: 'bg-cyan-500',
    C: 'bg-slate-500',
  };
  
  return (
    <span 
      className={cn('inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white', colors[tier])}
      title={tierConfig[tier].fullLabel}
    >
      {tier}
    </span>
  );
}
