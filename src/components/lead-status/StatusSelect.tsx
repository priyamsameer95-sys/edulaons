import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LEAD_STATUS_OPTIONS, DOCUMENT_STATUS_OPTIONS, canTransitionToStatus, canTransitionToDocumentStatus } from '@/utils/statusUtils';
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
  const options = type === 'lead' ? LEAD_STATUS_OPTIONS : DOCUMENT_STATUS_OPTIONS;
  
  // Admins can see all status options, partners see filtered options
  const filteredOptions = isAdmin ? options : (currentStatus 
    ? options.filter(option => {
        if (option.value === currentStatus) return true;
        return type === 'lead' 
          ? canTransitionToStatus(currentStatus as LeadStatus, option.value as LeadStatus)
          : canTransitionToDocumentStatus(currentStatus as DocumentStatus, option.value as DocumentStatus);
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