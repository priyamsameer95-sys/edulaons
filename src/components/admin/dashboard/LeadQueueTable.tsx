import { useState, useMemo } from 'react';
import { PaginatedLead } from '@/hooks/usePaginatedLeads';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Eye, 
  FileCheck, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Clock,
  Zap,
  ClipboardCheck,
  Pencil,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Import shared constants and utilities
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
  needsFieldCompletion 
} from '@/utils/leadCompleteness';

interface LeadQueueTableProps {
  leads: PaginatedLead[];
  loading: boolean;
  onViewLead: (lead: PaginatedLead) => void;
  onUpdateStatus: (lead: PaginatedLead) => void;
  onCompleteLead?: (lead: PaginatedLead) => void;
  onEditLead?: (lead: PaginatedLead) => void;
  selectedLeads: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

type SortField = 'id' | 'student' | 'amount' | 'status' | 'age' | null;
type SortDirection = 'asc' | 'desc';

export function LeadQueueTable({ 
  leads, 
  loading, 
  onViewLead, 
  onUpdateStatus,
  onCompleteLead,
  onEditLead,
  selectedLeads,
  onSelectionChange,
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: LeadQueueTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLeadId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Lead ID copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const allSelected = leads.length > 0 && selectedLeads.length === leads.length;
  const someSelected = selectedLeads.length > 0 && selectedLeads.length < leads.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(leads.map(l => l.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedLeads, leadId]);
    } else {
      onSelectionChange(selectedLeads.filter(id => id !== leadId));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort leads client-side
  const sortedLeads = useMemo(() => {
    if (!sortField) return leads;

    return [...leads].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'student':
          comparison = (a.student?.name || '').localeCompare(b.student?.name || '');
          break;
        case 'amount':
          comparison = a.loan_amount - b.loan_amount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'age':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [leads, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileCheck className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No leads match your filters</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-full">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                  />
                </TableHead>
                <TableHead className="w-[100px]">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('id')}
                  >
                    Lead ID <SortIcon field="id" />
                  </Button>
                </TableHead>
                <TableHead className="w-[200px]">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('student')}
                  >
                    Student <SortIcon field="student" />
                  </Button>
                </TableHead>
                <TableHead className="w-[140px]">Partner</TableHead>
                <TableHead className="w-[110px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => handleSort('amount')}
                      >
                        Amount <SortIcon field="amount" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Requested loan amount</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-[110px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => handleSort('status')}
                      >
                        Status <SortIcon field="status" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Current application status</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-[100px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-medium cursor-help">Docs</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Document verification status</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-[100px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => handleSort('age')}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Created <SortIcon field="age" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Time since lead was created</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {sortedLeads.map((lead) => {
                const isSelected = selectedLeads.includes(lead.id);
                const urgent = isLeadUrgent(lead);
                const ageDays = getAgeDays(lead.created_at);
                const action = needsAdminAction(lead);
                // Calculate lead completeness for universal incomplete detection
                const completeness = getLeadCompleteness(lead as any);
                const isIncomplete = !completeness.isComplete;
                
                return (
                  <TableRow 
                    key={lead.id} 
                    className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''} ${urgent ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
                    onClick={() => onViewLead(lead)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, !!checked)}
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
                          onClick={(e) => copyLeadId(lead.id, e)}
                        >
                          {copiedId === lead.id ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
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
                          {/* Show Quick Lead badge */}
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
                          {/* Show Incomplete badge for ANY lead with missing required fields */}
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
                              {lead.student?.email || lead.case_id}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{lead.student?.email || lead.case_id}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
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
                    <TableCell className="font-semibold text-sm">
                      {formatLoanAmount(lead.loan_amount)}
                    </TableCell>
                    <TableCell>
                      {lead.is_quick_lead && !lead.quick_lead_completed_at ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className="text-xs cursor-help bg-amber-50 text-amber-700 border-amber-200"
                            >
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
                            <Badge 
                              variant="outline" 
                              className={`text-xs cursor-help ${STATUS_COLORS[lead.status] || ''}`}
                            >
                              {STATUS_LABELS[lead.status] || lead.status}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{STATUS_DESCRIPTIONS[lead.status]}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant="outline" 
                            className={`text-xs cursor-help ${DOC_STATUS_COLORS[lead.documents_status] || ''}`}
                          >
                            {DOC_STATUS_LABELS[lead.documents_status] || lead.documents_status}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{DOC_STATUS_DESCRIPTIONS[lead.documents_status]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`text-xs font-medium ${getAgeColor(lead.created_at)} flex items-center gap-1`}>
                            {ageDays > 30 && <AlertTriangle className="h-3 w-3" />}
                            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: false })}
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
                    <TableCell className="text-right">
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
                            {/* Edit Lead - available for ANY lead */}
                            {onEditLead && (
                              <DropdownMenuItem onClick={() => onEditLead(lead)}>
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {/* Complete Lead - for quick leads or incomplete leads */}
                            {(isIncomplete || (lead.is_quick_lead && !lead.quick_lead_completed_at)) && onCompleteLead && (
                              <DropdownMenuItem onClick={() => onCompleteLead(lead)}>
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
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-muted/30 gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing {startItem}-{endItem} of {totalCount.toLocaleString()} leads</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Per page:</span>
              <Select value={pageSize.toString()} onValueChange={(v) => onPageSizeChange(parseInt(v))}>
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2 min-w-[80px] text-center">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="h-8 px-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}