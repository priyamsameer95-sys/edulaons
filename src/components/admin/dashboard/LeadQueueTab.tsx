import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SmartFilterBar } from './SmartFilterBar';
import { LeadQueueTable } from './LeadQueueTable';
import { PaginatedLead } from '@/hooks/usePaginatedLeads';

interface Partner {
  id: string;
  name: string;
  partner_code: string;
}

interface LeadQueueTabProps {
  // Data
  leads: PaginatedLead[];
  loading: boolean;
  allPartners: Partner[];
  
  // Filters
  searchTerm: string;
  statusFilter: string | null;
  partnerFilter: string | null;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string | null) => void;
  onPartnerChange: (value: string | null) => void;
  
  // Selection
  selectedLeads: string[];
  onSelectionChange: (ids: string[]) => void;
  
  // Pagination
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  
  // Actions
  onAddLead: () => void;
  onViewLead: (lead: PaginatedLead) => void;
  onUpdateStatus: (lead: PaginatedLead) => void;
  onCompleteLead: (lead: PaginatedLead) => void;
  onOpenBulkStatus: () => void;
}

export const LeadQueueTab = React.memo(function LeadQueueTab({
  leads,
  loading,
  allPartners,
  searchTerm,
  statusFilter,
  partnerFilter,
  onSearchChange,
  onStatusChange,
  onPartnerChange,
  selectedLeads,
  onSelectionChange,
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onAddLead,
  onViewLead,
  onUpdateStatus,
  onCompleteLead,
  onOpenBulkStatus,
}: LeadQueueTabProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <SmartFilterBar
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          statusFilter={statusFilter || 'all'}
          onStatusChange={(value) => onStatusChange(value === 'all' ? null : value)}
          partnerFilter={partnerFilter || 'all'}
          onPartnerChange={(value) => onPartnerChange(value === 'all' ? null : value)}
          partners={allPartners}
        />
        <Button size="sm" className="ml-3" onClick={onAddLead}>
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedLeads.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border-b border-primary/20 shrink-0">
          <span className="text-sm font-medium">
            {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
          </span>
          <Button size="sm" variant="outline" onClick={onOpenBulkStatus}>
            Bulk Update Status
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onSelectionChange([])}>
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <LeadQueueTable
          leads={leads}
          loading={loading}
          onViewLead={onViewLead}
          onUpdateStatus={onUpdateStatus}
          onCompleteLead={onCompleteLead}
          selectedLeads={selectedLeads}
          onSelectionChange={onSelectionChange}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
});
