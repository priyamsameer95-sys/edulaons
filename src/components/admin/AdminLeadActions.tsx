import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  ChevronDown, 
  FileText,
  CheckCircle,
  XCircle,
  Clock 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LEAD_STATUS_OPTIONS, getStatusColor, type LeadStatus } from '@/utils/statusUtils';
import { RefactoredLead } from '@/types/refactored-lead';

interface AdminLeadActionsProps {
  lead: RefactoredLead;
  documentCount: number;
  onViewDetails: (lead: RefactoredLead) => void;
  onStatusUpdate: (lead: RefactoredLead, newStatus: LeadStatus) => void;
}

export function AdminLeadActions({ 
  lead, 
  documentCount, 
  onViewDetails, 
  onStatusUpdate 
}: AdminLeadActionsProps) {
  const getDocumentIcon = (status: string) => {
    switch (status) {
      case 'verified': return CheckCircle;
      case 'pending': return Clock;
      case 'rejected': return XCircle;
      default: return FileText;
    }
  };

  const getDocumentColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-success';
      case 'pending': return 'text-warning';  
      case 'rejected': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const DocumentIcon = getDocumentIcon(lead.documents_status);

  return (
    <div className="flex items-center gap-2">
      {/* Document Count Badge */}
      <Badge 
        variant="outline" 
        className="flex items-center gap-1 cursor-pointer hover:bg-accent"
        onClick={() => onViewDetails(lead)}
      >
        <DocumentIcon className={`h-3 w-3 ${getDocumentColor(lead.documents_status)}`} />
        {documentCount}
      </Badge>

      {/* Quick Status Update Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 bg-background hover:bg-accent border"
          >
            <span className="text-xs">Status</span>
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-background border shadow-lg z-50"
        >
          {LEAD_STATUS_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onStatusUpdate(lead, option.value as LeadStatus)}
              className="flex items-center gap-2 cursor-pointer hover:bg-accent"
            >
              <div className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
              <span className="text-sm">{option.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Details Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewDetails(lead)}
        className="h-8 px-3 bg-background hover:bg-accent border"
      >
        <Eye className="h-3 w-3 mr-1" />
        <span className="text-xs">Details</span>
      </Button>
    </div>
  );
}