import { Badge } from '@/components/ui/badge';
import { getStatusColor, getDocumentStatusColor, getStatusLabel, getDocumentStatusLabel } from '@/utils/statusUtils';
import type { LeadStatus, DocumentStatus } from '@/utils/statusUtils';

interface StatusBadgeProps {
  status: LeadStatus | DocumentStatus;
  type: 'lead' | 'document';
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const colorClass = type === 'lead' 
    ? getStatusColor(status as LeadStatus)
    : getDocumentStatusColor(status as DocumentStatus);
  
  const label = type === 'lead'
    ? getStatusLabel(status as LeadStatus)
    : getDocumentStatusLabel(status as DocumentStatus);

  return (
    <Badge 
      variant="secondary" 
      className={`${colorClass} ${className}`}
    >
      {label}
    </Badge>
  );
}