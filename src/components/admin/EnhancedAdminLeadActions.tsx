import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Edit, FileText } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);

  const handleViewDetails = () => {
    setIsOpen(false);
    onViewDetails(lead);
  };

  const handleStatusUpdate = () => {
    setIsOpen(false);
    onStatusUpdate(lead);
  };

  const getDocumentBadgeVariant = () => {
    if (documentCount === 0) return 'destructive';
    if (documentCount < 3) return 'secondary';
    return 'default';
  };

  const getDocumentIcon = () => {
    if (documentCount === 0) return '📄';
    if (documentCount < 3) return '📋';
    return '📚';
  };

  return (
    <div className="flex items-center gap-2">
      {/* Document Count Badge */}
      <Badge 
        variant={getDocumentBadgeVariant()}
        className="cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleViewDetails}
      >
        {getDocumentIcon()} {documentCount}
      </Badge>

      {/* Status Badges */}
      <div className="flex gap-1">
        <StatusBadge status={lead.status} type="lead" className="text-xs" />
        <StatusBadge status={lead.documents_status} type="document" className="text-xs" />
      </div>

      {/* Actions Dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleViewDetails} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleStatusUpdate} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4" />
            Update Status
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}