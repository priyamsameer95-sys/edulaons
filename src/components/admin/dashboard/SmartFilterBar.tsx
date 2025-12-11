import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface SmartFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  partnerFilter: string;
  onPartnerChange: (value: string) => void;
  partners: { id: string; name: string }[];
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
    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
      {/* Status chips */}
      <div className="flex items-center gap-1.5">
        {STATUS_OPTIONS.slice(0, 5).map((status) => (
          <Badge
            key={status.value}
            variant="outline"
            className={`cursor-pointer text-xs transition-colors ${
              statusFilter === status.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-muted bg-background'
            }`}
            onClick={() => onStatusChange(status.value)}
          >
            {status.label}
          </Badge>
        ))}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Partner dropdown */}
      <Select value={partnerFilter} onValueChange={onPartnerChange}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="All Partners" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Partners</SelectItem>
          {partners.map((partner) => (
            <SelectItem key={partner.id} value={partner.id}>
              {partner.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search */}
      <div className="relative flex-1 max-w-xs ml-auto">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>
    </div>
  );
}
