import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { PartnerCombobox, PartnerOption } from '@/components/ui/partner-combobox';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { STATUS_CONFIG, PHASE_CONFIG, ProcessPhase, LeadStatusExtended } from '@/constants/processFlow';

interface SmartFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  partnerFilter: string;
  onPartnerChange: (value: string) => void;
  partners: PartnerOption[];
}

// Legacy statuses to exclude from dropdown (they have equivalents in new flow)
const LEGACY_STATUSES = ['new', 'contacted', 'in_progress', 'document_review', 'approved'];

// Generate grouped status options from processFlow.ts
function getGroupedStatusOptions(): Record<ProcessPhase, { value: string; label: string }[]> {
  const grouped: Record<ProcessPhase, { value: string; label: string }[]> = {
    pre_login: [],
    with_lender: [],
    sanction: [],
    disbursement: [],
    terminal: [],
  };

  Object.values(STATUS_CONFIG)
    .filter(s => !LEGACY_STATUSES.includes(s.value)) // Exclude legacy
    .sort((a, b) => a.step - b.step)
    .forEach(status => {
      grouped[status.phase].push({
        value: status.value,
        label: status.shortLabel,
      });
    });

  return grouped;
}

const GROUPED_OPTIONS = getGroupedStatusOptions();

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
  
  // Get display label for current filter value
  const getFilterLabel = (value: string): string => {
    if (value === 'all') return 'All Status';
    const config = STATUS_CONFIG[value as LeadStatusExtended];
    return config?.shortLabel || value;
  };
  
  return (
    <div className="flex items-center gap-3 flex-1">
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

      {/* Filter group - consistent padding and alignment */}
      <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg h-9">
        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        
        {/* Status dropdown - grouped by phase */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[130px] h-7 text-xs border-0 bg-transparent shadow-none focus:ring-0 px-2 font-medium">
            <span className="truncate">{getFilterLabel(statusFilter)}</span>
          </SelectTrigger>
          <SelectContent className="bg-popover max-h-[400px]">
            <SelectItem value="all" className="text-xs py-2 font-medium">
              All Status
            </SelectItem>
            
            <SelectSeparator />
            
            {/* Pre-Login Phase */}
            <SelectGroup>
              <SelectLabel className="text-[10px] text-muted-foreground font-semibold px-2">
                {PHASE_CONFIG.pre_login.label}
              </SelectLabel>
              {GROUPED_OPTIONS.pre_login.map((status) => (
                <SelectItem key={status.value} value={status.value} className="text-xs py-1.5">
                  {status.label}
                </SelectItem>
              ))}
            </SelectGroup>
            
            <SelectSeparator />
            
            {/* With Lender Phase */}
            <SelectGroup>
              <SelectLabel className="text-[10px] text-muted-foreground font-semibold px-2">
                {PHASE_CONFIG.with_lender.label}
              </SelectLabel>
              {GROUPED_OPTIONS.with_lender.map((status) => (
                <SelectItem key={status.value} value={status.value} className="text-xs py-1.5">
                  {status.label}
                </SelectItem>
              ))}
            </SelectGroup>
            
            <SelectSeparator />
            
            {/* Sanction Phase */}
            <SelectGroup>
              <SelectLabel className="text-[10px] text-muted-foreground font-semibold px-2">
                {PHASE_CONFIG.sanction.label}
              </SelectLabel>
              {GROUPED_OPTIONS.sanction.map((status) => (
                <SelectItem key={status.value} value={status.value} className="text-xs py-1.5">
                  {status.label}
                </SelectItem>
              ))}
            </SelectGroup>
            
            <SelectSeparator />
            
            {/* Disbursement Phase */}
            <SelectGroup>
              <SelectLabel className="text-[10px] text-muted-foreground font-semibold px-2">
                {PHASE_CONFIG.disbursement.label}
              </SelectLabel>
              {GROUPED_OPTIONS.disbursement.map((status) => (
                <SelectItem key={status.value} value={status.value} className="text-xs py-1.5">
                  {status.label}
                </SelectItem>
              ))}
            </SelectGroup>
            
            <SelectSeparator />
            
            {/* Terminal States */}
            <SelectGroup>
              <SelectLabel className="text-[10px] text-muted-foreground font-semibold px-2">
                {PHASE_CONFIG.terminal.label}
              </SelectLabel>
              {GROUPED_OPTIONS.terminal.map((status) => (
                <SelectItem key={status.value} value={status.value} className="text-xs py-1.5">
                  {status.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-border flex-shrink-0" />

        {/* Partner combobox - consistent height and padding */}
        <PartnerCombobox
          partners={partners}
          value={partnerFilter === 'all' ? null : partnerFilter}
          onChange={(value) => onPartnerChange(value || 'all')}
          placeholder="All Partners"
          className="w-[150px] h-7 text-xs border-0 bg-transparent shadow-none font-medium"
        />
        
        {hasActiveFilters && (
          <>
            <div className="h-4 w-px bg-border flex-shrink-0" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onStatusChange('all');
                onPartnerChange('all');
              }}
              className="h-7 px-2 text-xs gap-1"
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
