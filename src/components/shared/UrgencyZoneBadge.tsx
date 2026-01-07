import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UrgencyZone = 'GREEN' | 'YELLOW' | 'RED';

interface UrgencyZoneBadgeProps {
  zone: UrgencyZone;
  daysUntil?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const zoneConfig: Record<UrgencyZone, {
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}> = {
  GREEN: {
    label: 'Relaxed Timeline',
    shortLabel: 'Relaxed',
    description: 'Cost optimized - prioritizing low rates',
    icon: CheckCircle,
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
  },
  YELLOW: {
    label: 'Moderate Timeline',
    shortLabel: 'Moderate',
    description: 'Balanced approach - rate and speed',
    icon: Clock,
    colorClass: 'text-amber-700 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
  },
  RED: {
    label: 'Urgent Timeline',
    shortLabel: 'Urgent',
    description: 'Speed prioritized - fast lenders first',
    icon: AlertTriangle,
    colorClass: 'text-red-700 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  },
};

export function UrgencyZoneBadge({ 
  zone, 
  daysUntil, 
  showLabel = true,
  size = 'md',
  className 
}: UrgencyZoneBadgeProps) {
  const config = zoneConfig[zone];
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
      <Icon className={iconSizes[size]} />
      {showLabel && (
        <span>
          {size === 'sm' ? config.shortLabel : config.label}
          {daysUntil !== undefined && ` (${daysUntil}d)`}
        </span>
      )}
    </Badge>
  );
}

interface UrgencyZoneTooltipProps {
  zone: UrgencyZone;
  daysUntil?: number;
}

export function getUrgencyZoneTooltip({ zone, daysUntil }: UrgencyZoneTooltipProps): string {
  const config = zoneConfig[zone];
  const daysText = daysUntil !== undefined ? ` ${daysUntil} days until intake.` : '';
  return `${config.label}:${daysText} ${config.description}`;
}

export function UrgencyZoneIndicator({ zone }: { zone: UrgencyZone }) {
  const colors: Record<UrgencyZone, string> = {
    GREEN: 'bg-emerald-500',
    YELLOW: 'bg-amber-500',
    RED: 'bg-red-500',
  };
  
  return (
    <span 
      className={cn('inline-block w-2 h-2 rounded-full', colors[zone])}
      title={zoneConfig[zone].label}
    />
  );
}
