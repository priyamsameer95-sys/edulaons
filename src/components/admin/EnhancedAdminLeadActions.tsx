import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, FileText } from 'lucide-react';
import { StatusBadge } from '@/components/lead-status/StatusBadge';
import type { RefactoredLead } from '@/types/refactored-lead';

interface EnhancedAdminLeadActionsProps {
  lead: RefactoredLead;
  documentCount?: number;
  onViewDetails: (lead: RefactoredLead) => void;
  onStatusUpdate: (lead: RefactoredLead) => void;
}

export function EnhancedAdminLeadActions({ 
  lead, 
  documentCount = 0, 
  onViewDetails,
  onStatusUpdate 
}: EnhancedAdminLeadActionsProps) {
  
  const getDocumentBadgeColor = () => {
    if (documentCount === 0) return 'bg-destructive text-destructive-foreground hover:bg-destructive/90';
    if (documentCount < 3) return 'bg-warning text-warning-foreground hover:bg-warning/90';
    return 'bg-success text-success-foreground hover:bg-success/90';
  };

  const getDocumentIcon = () => {
    if (documentCount === 0) return '📄';
    if (documentCount < 3) return '📋';
    return '✓';
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Large Document Count Badge */}
      <Badge 
        className={`${getDocumentBadgeColor()} cursor-pointer transition-all hover:scale-105 px-3 py-1 text-sm font-semibold`}
        onClick={() => onViewDetails(lead)}
      >
        <FileText className="h-4 w-4 mr-1" />
        {getDocumentIcon()} {documentCount} docs
      </Badge>

      {/* Status Badges */}
      <div className="flex gap-1">
        <StatusBadge status={lead.status} type="lead" className="text-xs" />
        <StatusBadge status={lead.documents_status} type="document" className="text-xs" />
      </div>

      {/* Prominent Action Buttons */}
      <div className="flex gap-1 ml-auto">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onViewDetails(lead)}
          className="h-8 hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          View
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => onStatusUpdate(lead)}
          className="h-8 bg-primary hover:bg-primary-hover transition-colors"
        >
          <Edit className="h-3.5 w-3.5 mr-1" />
          Update Status
        </Button>
      </div>
    </div>
  );
}