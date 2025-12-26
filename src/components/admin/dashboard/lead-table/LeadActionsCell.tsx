import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, Edit, Pencil, ClipboardCheck } from 'lucide-react';
import { PaginatedLead } from '@/hooks/usePaginatedLeads';

interface LeadActionsCellProps {
  lead: PaginatedLead;
  isIncomplete: boolean;
  onViewLead: (lead: PaginatedLead) => void;
  onUpdateStatus: (lead: PaginatedLead) => void;
  onEditLead?: (lead: PaginatedLead) => void;
  onCompleteLead?: (lead: PaginatedLead) => void;
}

export function LeadActionsCell({
  lead,
  isIncomplete,
  onViewLead,
  onUpdateStatus,
  onEditLead,
  onCompleteLead,
}: LeadActionsCellProps) {
  const isQuickLeadIncomplete = lead.is_quick_lead && !lead.quick_lead_completed_at;

  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => onViewLead(lead)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View Details</TooltipContent>
      </Tooltip>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => onViewLead(lead)}>
            <Eye className="h-3.5 w-3.5 mr-2" />
            View Lead
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onUpdateStatus(lead)}>
            <Edit className="h-3.5 w-3.5 mr-2" />
            Update Status
          </DropdownMenuItem>
          {onEditLead && (
            <DropdownMenuItem onClick={() => onEditLead(lead)}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Edit Details
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {(isIncomplete || isQuickLeadIncomplete) && onCompleteLead && (
            <DropdownMenuItem onClick={() => onCompleteLead(lead)}>
              <ClipboardCheck className="h-3.5 w-3.5 mr-2" />
              Complete Lead
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
