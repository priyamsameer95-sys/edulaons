import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, FileCheck, XCircle, AlertCircle, Upload, FileX, RefreshCw } from 'lucide-react';
import { getStatusColor, getDocumentStatusColor, getStatusLabel, getDocumentStatusLabel } from '@/utils/statusUtils';
import type { LeadStatus, DocumentStatus } from '@/utils/statusUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StatusBadgeProps {
  status: LeadStatus | DocumentStatus;
  type: 'lead' | 'document';
  className?: string;
  showIcon?: boolean;
  showTooltip?: boolean;
}

const getLeadStatusIcon = (status: LeadStatus) => {
  switch (status) {
    case 'new':
      return <Clock className="h-3 w-3" />;
    case 'in_progress':
      return <AlertCircle className="h-3 w-3" />;
    case 'document_review':
      return <FileCheck className="h-3 w-3" />;
    case 'approved':
      return <CheckCircle className="h-3 w-3" />;
    case 'rejected':
      return <XCircle className="h-3 w-3" />;
    case 'contacted':
      return <AlertCircle className="h-3 w-3" />;
    case 'withdrawn':
      return <XCircle className="h-3 w-3" />;
    default:
      return null;
  }
};

const getDocumentStatusIcon = (status: DocumentStatus) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-3 w-3" />;
    case 'uploaded':
      return <Upload className="h-3 w-3" />;
    case 'verified':
      return <FileCheck className="h-3 w-3" />;
    case 'rejected':
      return <FileX className="h-3 w-3" />;
    case 'resubmission_required':
      return <RefreshCw className="h-3 w-3" />;
    default:
      return null;
  }
};

const getStatusTooltip = (status: LeadStatus | DocumentStatus, type: 'lead' | 'document') => {
  if (type === 'lead') {
    switch (status as LeadStatus) {
      case 'new':
        return 'Lead just created, awaiting initial review';
      case 'in_progress':
        return 'Lead is being processed';
      case 'document_review':
        return 'Documents are under review';
      case 'approved':
        return 'Lead has been approved';
      case 'rejected':
        return 'Lead was rejected';
      case 'contacted':
        return 'Student has been contacted';
      case 'withdrawn':
        return 'Lead has been withdrawn';
      default:
        return '';
    }
  } else {
    switch (status as DocumentStatus) {
      case 'pending':
        return 'Awaiting document upload';
      case 'uploaded':
        return 'Documents uploaded, awaiting verification';
      case 'verified':
        return 'All documents verified';
      case 'rejected':
        return 'Documents rejected';
      case 'resubmission_required':
        return 'Documents need to be resubmitted';
      default:
        return '';
    }
  }
};

export function StatusBadge({ status, type, className, showIcon = true, showTooltip = true }: StatusBadgeProps) {
  const colorClass = type === 'lead' 
    ? getStatusColor(status as LeadStatus)
    : getDocumentStatusColor(status as DocumentStatus);
  
  const label = type === 'lead'
    ? getStatusLabel(status as LeadStatus)
    : getDocumentStatusLabel(status as DocumentStatus);

  const icon = type === 'lead' 
    ? getLeadStatusIcon(status as LeadStatus)
    : getDocumentStatusIcon(status as DocumentStatus);

  const tooltip = getStatusTooltip(status, type);

  const badgeContent = (
    <Badge 
      variant="secondary" 
      className={`${colorClass} ${className} gap-1.5`}
    >
      {showIcon && icon}
      {label}
    </Badge>
  );

  if (showTooltip && tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
}