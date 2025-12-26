import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIG, LeadStatusExtended } from '@/constants/processFlow';
import { getStatusColor, getDocumentStatusColor, getStatusLabel, getDocumentStatusLabel } from '@/utils/statusUtils';
import type { LeadStatus, DocumentStatus } from '@/utils/statusUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Clock, Upload, FileCheck, FileX, RefreshCw } from 'lucide-react';

interface StatusBadgeProps {
  status: LeadStatus | DocumentStatus;
  type: 'lead' | 'document';
  className?: string;
  showIcon?: boolean;
  showTooltip?: boolean;
  compact?: boolean;
}

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

export function StatusBadge({ 
  status, 
  type, 
  className, 
  showIcon = true, 
  showTooltip = true,
  compact = false 
}: StatusBadgeProps) {
  if (type === 'lead') {
    const config = STATUS_CONFIG[status as LeadStatusExtended];
    const IconComponent = config?.icon;
    const label = compact ? config?.shortLabel : config?.label;
    const tooltip = config?.description;
    
    const badgeContent = (
      <Badge 
        variant="secondary" 
        className={`${config?.bgColor || 'bg-gray-100'} ${config?.color || 'text-gray-800'} ${className} gap-1.5 border-0 flex items-center justify-center`}
      >
        {showIcon && IconComponent && <IconComponent className="h-3 w-3" />}
        {label || status}
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

  // Document status
  const colorClass = getDocumentStatusColor(status as DocumentStatus);
  const label = getDocumentStatusLabel(status as DocumentStatus);
  const icon = getDocumentStatusIcon(status as DocumentStatus);

  const tooltipText = (() => {
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
  })();

  const badgeContent = (
    <Badge 
      variant="secondary" 
      className={`${colorClass} ${className} gap-1.5 flex items-center justify-center`}
    >
      {showIcon && icon}
      {label}
    </Badge>
  );

  if (showTooltip && tooltipText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
}
