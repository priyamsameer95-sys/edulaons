import React from 'react';
import { PaginatedLead } from '@/hooks/usePaginatedLeads';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  AlertTriangle,
  Edit,
  Zap,
  ClipboardCheck,
  Pencil,
  Copy,
  Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import {
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_DESCRIPTIONS,
  DOC_STATUS_COLORS,
  DOC_STATUS_LABELS,
  DOC_STATUS_DESCRIPTIONS,
} from '@/constants/leadStatus';
import {
  formatLoanAmount,
  getAgeDays,
  getAgeColor,
  isLeadUrgent,
  needsAdminAction,
} from '@/utils/leadTableUtils';
import {
  getLeadCompleteness,
  getCompletenessColor,
} from '@/utils/leadCompleteness';

interface LeadTableRowProps {
  lead: PaginatedLead;
  isSelected: boolean;
  copiedId: string | null;
  onSelect: (checked: boolean) => void;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  onViewLead: () => void;
  onUpdateStatus: () => void;
  onCompleteLead?: () => void;
  onEditLead?: () => void;
}

export const LeadTableRow = React.memo(function LeadTableRow({
  lead,
  isSelected,
  copiedId,
  onSelect,
  onCopyId,
  onViewLead,
  onUpdateStatus,
  onCompleteLead,
  onEditLead,
}: LeadTableRowProps) {
  const urgent = isLeadUrgent(lead);
  const ageDays = getAgeDays(lead.created_at);
  const action = needsAdminAction(lead);
  const completeness = getLeadCompleteness(lead as any);
  const isIncomplete = !completeness.isComplete;

  return (
    <TableRow
      className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''} ${urgent ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
      onClick={onViewLead}
    >
      {/* Selection & Indicators */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(!!checked)}
            aria-label={`Select ${lead.student?.name || 'lead'}`}
          />
          {urgent && (
            <Tooltip>
              <TooltipTrigger>
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Requires immediate attention</p>
              </TooltipContent>
            </Tooltip>
          )}
          {!urgent && action.needed && (
            <Tooltip>
              <TooltipTrigger>
                <span className="flex h-2 w-2 rounded-full bg-blue-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{action.reason}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>

      {/* Lead ID */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground font-mono truncate max-w-[60px] cursor-help">
                {lead.id.slice(0, 8)}…
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-mono">{lead.id}</p>
            </TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-muted"
            onClick={(e) => onCopyId(lead.id, e)}
          >
            {copiedId === lead.id ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
        </div>
      </TableCell>

      {/* Student */}
      <TableCell>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="font-medium text-sm truncate max-w-[180px]">
                  {lead.student?.name || 'Unknown'}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{lead.student?.name || 'Unknown'}</p>
              </TooltipContent>
            </Tooltip>
            {/* Quick Lead badge */}
            {lead.is_quick_lead && !lead.quick_lead_completed_at && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200 gap-0.5"
                  >
                    <Zap className="h-2.5 w-2.5" />
                    Quick
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Incomplete quick lead - needs additional details</p>
                </TooltipContent>
              </Tooltip>
            )}
            {/* Incomplete badge */}
            {isIncomplete && !(lead.is_quick_lead && !lead.quick_lead_completed_at) && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 ${getCompletenessColor(completeness.completenessScore)} gap-0.5`}
                  >
                    {completeness.completenessScore}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-1">
                    <p className="font-medium">Missing Required Fields:</p>
                    <ul className="list-disc pl-3">
                      {completeness.missingRequired.slice(0, 5).map((f, i) => (
                        <li key={i}>{f.displayName}</li>
                      ))}
                      {completeness.missingRequired.length > 5 && (
                        <li>+{completeness.missingRequired.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {lead.student?.email?.includes('@quick.placeholder') || lead.student?.email?.includes('@lead.placeholder') || lead.student?.email?.includes('@student.loan.app')
                  ? lead.student?.phone || lead.case_id
                  : lead.student?.email || lead.case_id}
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {lead.student?.email?.includes('@quick.placeholder') || lead.student?.email?.includes('@lead.placeholder') || lead.student?.email?.includes('@student.loan.app')
                  ? lead.student?.phone || lead.case_id
                  : lead.student?.email || lead.case_id}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TableCell>

      {/* Partner */}
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs font-normal truncate max-w-[120px] block hover:bg-transparent">
              {lead.partner?.name || 'Direct'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{lead.partner?.name || 'Direct application (no partner)'}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>

      {/* Amount */}
      <TableCell className="font-semibold text-sm">
        {formatLoanAmount(lead.loan_amount)}
      </TableCell>

      {/* Status */}
      <TableCell>
        {lead.is_quick_lead && !lead.quick_lead_completed_at ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs cursor-help bg-amber-50 text-amber-700 border-amber-200">
                Incomplete
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Quick lead needs additional details to be completed</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className={`text-xs cursor-help ${STATUS_COLORS[lead.status] || ''}`}>
                {STATUS_LABELS[lead.status] || lead.status}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{STATUS_DESCRIPTIONS[lead.status]}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TableCell>

      {/* Docs Status */}
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`text-xs cursor-help ${DOC_STATUS_COLORS[lead.documents_status] || ''}`}>
              {DOC_STATUS_LABELS[lead.documents_status] || lead.documents_status}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{DOC_STATUS_DESCRIPTIONS[lead.documents_status]}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>

      {/* Age */}
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`text-xs font-medium ${getAgeColor(lead.created_at)} flex items-center gap-1`}>
              {ageDays > 30 && <AlertTriangle className="h-3 w-3" />}
              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true }).replace('about ', '')}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p>Created: {new Date(lead.created_at).toLocaleDateString()}</p>
              <p>{ageDays} days ago</p>
              {ageDays > 30 && <p className="text-red-500">⚠️ Needs attention - over 1 month old</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onViewLead}>
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
              <DropdownMenuItem onClick={onViewLead}>
                <Eye className="h-3.5 w-3.5 mr-2" />
                View Lead
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onUpdateStatus}>
                <Edit className="h-3.5 w-3.5 mr-2" />
                Update Status
              </DropdownMenuItem>
              {onEditLead && (
                <DropdownMenuItem onClick={onEditLead}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Edit Details
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {(isIncomplete || (lead.is_quick_lead && !lead.quick_lead_completed_at)) && onCompleteLead && (
                <DropdownMenuItem onClick={onCompleteLead}>
                  <ClipboardCheck className="h-3.5 w-3.5 mr-2" />
                  Complete Lead
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
});
