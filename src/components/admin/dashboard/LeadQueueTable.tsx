import { useState, useMemo, useCallback } from 'react';
import { PaginatedLead } from '@/hooks/usePaginatedLeads';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileCheck, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { LeadTableRow } from './lead-table/LeadTableRow';
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
  onPageSizeChange
}: LeadQueueTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyLeadId = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Lead ID copied');
    setTimeout(() => setCopiedId(null), 2000);
  }, []);
  const allSelected = leads.length > 0 && selectedLeads.length === leads.length;
  const someSelected = selectedLeads.length > 0 && selectedLeads.length < leads.length;
  const handleSelectAll = useCallback((checked: boolean) => {
    onSelectionChange(checked ? leads.map(l => l.id) : []);
  }, [leads, onSelectionChange]);
  const handleSelectLead = useCallback((leadId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedLeads, leadId]);
    } else {
      onSelectionChange(selectedLeads.filter(id => id !== leadId));
    }
  }, [selectedLeads, onSelectionChange]);
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

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
  const SortIcon = ({
    field
  }: {
    field: SortField;
  }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);
  if (loading) {
    return <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>;
  }
  if (leads.length === 0) {
    return <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileCheck className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No leads match your filters</p>
      </div>;
  }
  return <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-full">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40px]">
                  <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} aria-label="Select all" className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''} />
                </TableHead>
                <TableHead className="w-[100px]">
                  <Button variant="ghost" size="sm" className="h-auto p-0 font-medium hover:bg-transparent" onClick={() => handleSort('id')}>
                    Lead ID <SortIcon field="id" />
                  </Button>
                </TableHead>
                <TableHead className="w-[200px]">
                  <Button variant="ghost" size="sm" className="h-auto p-0 font-medium hover:bg-transparent" onClick={() => handleSort('student')}>
                    Student <SortIcon field="student" />
                  </Button>
                </TableHead>
                <TableHead className="w-[140px]">Partner</TableHead>
                <TableHead className="w-[110px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-0 font-medium hover:bg-transparent" onClick={() => handleSort('amount')}>
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
                      <Button variant="ghost" size="sm" className="h-auto p-0 font-medium hover:bg-transparent" onClick={() => handleSort('status')}>
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
                      <span className="font-medium cursor-help">Documents</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Document verification status</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-[100px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-0 font-medium hover:bg-transparent" onClick={() => handleSort('age')}>
                        <Clock className="h-3 w-3 mr-1" />
                        Created   <SortIcon field="age" />
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
              {sortedLeads.map(lead => <LeadTableRow key={lead.id} lead={lead} isSelected={selectedLeads.includes(lead.id)} copiedId={copiedId} onSelect={checked => handleSelectLead(lead.id, checked)} onCopyId={copyLeadId} onViewLead={() => onViewLead(lead)} onUpdateStatus={() => onUpdateStatus(lead)} onCompleteLead={onCompleteLead ? () => onCompleteLead(lead) : undefined} onEditLead={onEditLead ? () => onEditLead(lead) : undefined} />)}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-muted/30 gap-3 shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {startItem}-{endItem} of {totalCount.toLocaleString()} leads
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Per page:</span>
              <Select value={pageSize.toString()} onValueChange={v => onPageSizeChange(parseInt(v))}>
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
              <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="h-8 px-2">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2 min-w-[80px] text-center">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="h-8 px-2">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>;
}