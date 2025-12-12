import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PartnerCombobox, PartnerOption } from '@/components/ui/partner-combobox';
import { Search } from 'lucide-react';

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
  return (
    <div className="flex items-center gap-3 flex-1">
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, case ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Status dropdown */}
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Partner combobox - searchable for 500+ partners */}
      <PartnerCombobox
        partners={partners}
        value={partnerFilter === 'all' ? null : partnerFilter}
        onChange={(value) => onPartnerChange(value || 'all')}
        placeholder="All Partners"
        className="w-[180px] h-8 text-xs"
      />
    </div>
  );
}
