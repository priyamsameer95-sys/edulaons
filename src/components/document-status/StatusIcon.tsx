import { CheckCircle, Clock, XCircle, Upload } from 'lucide-react';
import type { DocumentStatus } from '@/utils/documentStatusUtils';

interface StatusIconProps {
  status: DocumentStatus;
  className?: string;
}

export function StatusIcon({ status, className = 'h-4 w-4' }: StatusIconProps) {
  switch (status) {
    case 'verified':
      return <CheckCircle className={`${className} text-emerald-600`} />;
    case 'uploaded':
    case 'pending':
      return <Clock className={`${className} text-amber-600`} />;
    case 'rejected':
      return <XCircle className={`${className} text-destructive`} />;
    default:
      return <Upload className={`${className} text-muted-foreground`} />;
  }
}
