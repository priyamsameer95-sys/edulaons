import { cn } from '@/lib/utils';
import type { DocumentStatus } from '@/utils/documentStatusUtils';
import { documentStatusLabels } from '@/utils/documentStatusUtils';

interface StatusLabelProps {
  status: DocumentStatus;
  className?: string;
}

const statusStyles: Record<DocumentStatus, string> = {
  verified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-destructive/10 text-destructive',
  not_uploaded: 'bg-muted text-muted-foreground',
};

export function StatusLabel({ status, className }: StatusLabelProps) {
  return (
    <span className={cn(
      'text-[10px] font-medium px-1.5 py-0.5 rounded',
      statusStyles[status],
      className
    )}>
      {documentStatusLabels[status]}
    </span>
  );
}
