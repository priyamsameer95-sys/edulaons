import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PartnerCombobox, PartnerOption } from '@/components/ui/partner-combobox';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

interface SmartFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  partnerFilter: string;
  onPartnerChange: (value: string) => void;
  partners: PartnerOption[];
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'document_review', label: 'Doc Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export function SmartFilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  partnerFilter,
  onPartnerChange,
  partners,
}: SmartFilterBarProps) {
  const hasActiveFilters = statusFilter !== 'all' || partnerFilter !== 'all';
  
  return (
    <div className="flex items-center gap-2 flex-1">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 bg-background border-border"
        />
      </div>

      {/* Filter group */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg">
        <Filter className="h-4 w-4 text-muted-foreground" />
        
        {/* Status dropdown */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[120px] h-7 text-xs border-0 bg-transparent shadow-none focus:ring-0 px-2 font-medium">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value} className="text-xs">
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-border" />

        {/* Partner combobox */}
        <PartnerCombobox
          partners={partners}
          value={partnerFilter === 'all' ? null : partnerFilter}
          onChange={(value) => onPartnerChange(value || 'all')}
          placeholder="All Partners"
          className="w-[150px] h-7 text-xs border-0 bg-transparent shadow-none font-medium"
        />
        
        {hasActiveFilters && (
          <>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onStatusChange('all');
                onPartnerChange('all');
              }}
              className="h-6 px-2 text-xs gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
