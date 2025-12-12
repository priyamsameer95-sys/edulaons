import { useState } from 'react';
import { RefactoredLead } from '@/types/refactored-lead';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, FileCheck, MoreHorizontal, CheckSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface LeadQueueTableProps {
  leads: RefactoredLead[];
  loading: boolean;
  onViewLead: (lead: RefactoredLead) => void;
  onUpdateStatus: (lead: RefactoredLead) => void;
  onVerifyDocs: (lead: RefactoredLead) => void;
  selectedLeads: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  contacted: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  in_progress: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  document_review: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  approved: 'bg-green-500/10 text-green-600 border-green-500/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  withdrawn: 'bg-muted text-muted-foreground border-muted',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  document_review: 'Doc Review',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const DOC_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  uploaded: 'bg-blue-500/10 text-blue-600',
  verified: 'bg-green-500/10 text-green-600',
  rejected: 'bg-destructive/10 text-destructive',
  resubmission_required: 'bg-amber-500/10 text-amber-600',
};

function getAgeColor(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return 'text-green-600';
  if (days < 3) return 'text-amber-600';
  return 'text-destructive';
}

function formatAmount(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function LeadQueueTable({ 
  leads, 
  loading, 
  onViewLead, 
  onUpdateStatus, 
  onVerifyDocs,
  selectedLeads,
  onSelectionChange 
}: LeadQueueTableProps) {
  
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
    <div className="overflow-auto">
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
            <TableHead className="w-[200px]">Student</TableHead>
            <TableHead className="w-[120px]">Partner</TableHead>
            <TableHead className="w-[100px]">Amount</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px]">Docs</TableHead>
            <TableHead className="w-[80px]">Age</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const isSelected = selectedLeads.includes(lead.id);
            return (
              <TableRow 
                key={lead.id} 
                className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`}
                onClick={() => onViewLead(lead)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectLead(lead.id, !!checked)}
                    aria-label={`Select ${lead.student?.name || 'lead'}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm truncate max-w-[180px]">
                      {lead.student?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {lead.student?.email || lead.case_id}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs font-normal">
                    {lead.partner?.name || 'Direct'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-sm">
                  {formatAmount(lead.loan_amount)}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${STATUS_COLORS[lead.status] || ''}`}
                  >
                    {STATUS_LABELS[lead.status] || lead.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${DOC_STATUS_COLORS[lead.documents_status] || ''}`}
                  >
                    {lead.documents_status === 'resubmission_required' ? 'Resubmit' : lead.documents_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium ${getAgeColor(lead.created_at)}`}>
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: false })}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => onViewLead(lead)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 px-2">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onUpdateStatus(lead)}>
                          Update Status
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onVerifyDocs(lead)}>
                          Verify Documents
                        </DropdownMenuItem>
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
  );
}
