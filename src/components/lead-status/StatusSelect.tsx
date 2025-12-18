import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DOCUMENT_STATUS_OPTIONS, canTransitionToStatus, canTransitionToDocumentStatus } from '@/utils/statusUtils';
import { useGroupedStatuses } from '@/hooks/useStatusMapping';
import { PHASE_CONFIG, STATUS_CONFIG, LeadStatusExtended, ProcessPhase } from '@/constants/processFlow';
import type { LeadStatus, DocumentStatus } from '@/utils/statusUtils';

interface StatusSelectProps {
  value: LeadStatus | DocumentStatus;
  onChange: (value: LeadStatus | DocumentStatus) => void;
  type: 'lead' | 'document';
  currentStatus?: LeadStatus | DocumentStatus;
  disabled?: boolean;
  placeholder?: string;
  isAdmin?: boolean;
}

export function StatusSelect({ 
  value, 
  onChange, 
  type, 
  currentStatus, 
  disabled = false,
  placeholder = "Select status...",
  isAdmin = false
}: StatusSelectProps) {
  const groupedStatuses = useGroupedStatuses();
  
  if (type === 'document') {
    const options = DOCUMENT_STATUS_OPTIONS;
    const filteredOptions = isAdmin ? options : (currentStatus 
      ? options.filter(option => {
          if (option.value === currentStatus) return true;
          return canTransitionToDocumentStatus(currentStatus as DocumentStatus, option.value as DocumentStatus);
        })
      : options);

    return (
      <Select 
        value={value} 
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {filteredOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Lead status - grouped by phase
  const phaseOrder: ProcessPhase[] = ['pre_login', 'with_lender', 'sanction', 'disbursement', 'terminal'];
  
  return (
    <Select 
      value={value} 
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {value && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[value as LeadStatusExtended]?.bgColor || 'bg-gray-100'}`} />
              {STATUS_CONFIG[value as LeadStatusExtended]?.label || value}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {phaseOrder.map((phase) => {
          const statuses = groupedStatuses[phase];
          if (!statuses || statuses.length === 0) return null;
          
          // Filter based on valid transitions unless admin
          const filteredStatuses = isAdmin 
            ? statuses 
            : statuses.filter(s => {
                if (s.value === currentStatus) return true;
                if (!currentStatus) return true;
                return canTransitionToStatus(currentStatus as LeadStatus, s.value);
              });
          
          if (filteredStatuses.length === 0) return null;
          
          return (
            <SelectGroup key={phase}>
              <SelectLabel className={`${PHASE_CONFIG[phase].color} font-semibold text-xs uppercase tracking-wide`}>
                {PHASE_CONFIG[phase].label}
              </SelectLabel>
              {filteredStatuses.map((status) => {
                const config = STATUS_CONFIG[status.value as LeadStatusExtended];
                return (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config?.bgColor || 'bg-gray-100'}`} />
                      <span>{status.label}</span>
                      {config?.step && config.step > 0 && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          Step {config.step}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}
