import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LeadStatusExtended } from '@/constants/processFlow';
import { formatIndianNumber, parseFormattedNumber } from '@/utils/currencyFormatter';

interface ConditionalFieldsProps {
  selectedStatus: LeadStatusExtended;
  values: {
    lanNumber?: string;
    sanctionAmount?: string;
    sanctionDate?: Date;
    pdScheduledAt?: Date;
    pfAmount?: string;
    pfPaidAt?: Date;
    propertyVerificationStatus?: string;
  };
  onChange: (values: ConditionalFieldsProps['values']) => void;
}

export function ConditionalFields({ selectedStatus, values, onChange }: ConditionalFieldsProps) {
  const handleCurrencyChange = (field: 'sanctionAmount' | 'pfAmount', rawValue: string) => {
    const numericValue = rawValue.replace(/[^0-9]/g, '');
    onChange({ ...values, [field]: numericValue ? formatIndianNumber(parseInt(numericValue)) : '' });
  };

  const renderDatePicker = (
    label: string,
    value: Date | undefined,
    onSelect: (date: Date | undefined) => void,
    placeholder: string
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9 text-sm",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onSelect}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  // Determine which fields to show based on status
  const showLanNumber = selectedStatus === 'logged_with_lender';
  const showSanctionFields = selectedStatus === 'sanctioned';
  const showPdScheduled = selectedStatus === 'pd_scheduled';
  const showPfFields = selectedStatus === 'pf_paid';
  const showPropertyVerification = selectedStatus === 'property_verification';

  if (!showLanNumber && !showSanctionFields && !showPdScheduled && !showPfFields && !showPropertyVerification) {
    return null;
  }

  return (
    <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Required Information
      </div>

      {showLanNumber && (
        <div className="space-y-1.5">
          <Label className="text-xs">LAN Number</Label>
          <Input
            placeholder="Enter Loan Account Number"
            value={values.lanNumber || ''}
            onChange={(e) => onChange({ ...values, lanNumber: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
      )}

      {showSanctionFields && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Sanction Amount (₹)</Label>
            <Input
              placeholder="e.g., 25,00,000"
              value={values.sanctionAmount || ''}
              onChange={(e) => handleCurrencyChange('sanctionAmount', e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          {renderDatePicker(
            'Sanction Date',
            values.sanctionDate,
            (date) => onChange({ ...values, sanctionDate: date }),
            'Select date'
          )}
        </div>
      )}

      {showPdScheduled && (
        renderDatePicker(
          'PD Call Scheduled For',
          values.pdScheduledAt,
          (date) => onChange({ ...values, pdScheduledAt: date }),
          'Select date & time'
        )
      )}

      {showPfFields && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Processing Fee (₹)</Label>
            <Input
              placeholder="e.g., 15,000"
              value={values.pfAmount || ''}
              onChange={(e) => handleCurrencyChange('pfAmount', e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          {renderDatePicker(
            'PF Paid On',
            values.pfPaidAt,
            (date) => onChange({ ...values, pfPaidAt: date }),
            'Select date'
          )}
        </div>
      )}

      {showPropertyVerification && (
        <div className="space-y-1.5">
          <Label className="text-xs">Verification Status</Label>
          <Select
            value={values.propertyVerificationStatus || ''}
            onValueChange={(val) => onChange({ ...values, propertyVerificationStatus: val })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="issues_found">Issues Found</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
