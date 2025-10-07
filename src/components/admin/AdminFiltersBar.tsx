import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { PartnerStats } from '@/utils/adminDashboardHelpers';

interface AdminFiltersBarProps {
  searchTerm: string;
  selectedPartner: string;
  partnerStats: PartnerStats[];
  onSearchChange: (value: string) => void;
  onPartnerChange: (value: string) => void;
}

/**
 * Admin Dashboard Filters Bar Component
 * Provides search and partner filter controls
 */
export const AdminFiltersBar = ({
  searchTerm,
  selectedPartner,
  partnerStats,
  onSearchChange,
  onPartnerChange,
}: AdminFiltersBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student name, email, case ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Partner Filter */}
      <Select value={selectedPartner} onValueChange={onPartnerChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="All Partners" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Partners</SelectItem>
          {partnerStats.map((partner) => (
            <SelectItem key={partner.id} value={partner.id}>
              {partner.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
