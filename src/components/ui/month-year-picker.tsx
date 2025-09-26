import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthYearPickerProps {
  value: string; // Format: "YYYY-MM"
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

export function MonthYearPicker({
  value,
  onChange,
  placeholder = "Select intake month",
  error = false,
  disabled = false,
}: MonthYearPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedYear, setSelectedYear] = React.useState<number>(
    value ? parseInt(value.split('-')[0]) : new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = React.useState<number>(
    value ? parseInt(value.split('-')[1]) : new Date().getMonth() + 1
  );

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const formatDisplayValue = (yearMonth: string) => {
    if (!yearMonth) return "";
    const [year, month] = yearMonth.split('-');
    const monthName = months.find(m => m.value === parseInt(month))?.label;
    return `${monthName} ${year}`;
  };

  const handleConfirm = () => {
    // Only allow future months
    const isCurrentYear = selectedYear === currentYear;
    const isFutureMonth = !isCurrentYear || selectedMonth >= currentMonth;
    
    if (isFutureMonth) {
      const monthString = selectedMonth.toString().padStart(2, '0');
      onChange(`${selectedYear}-${monthString}`);
      setOpen(false);
    }
  };

  const isMonthDisabled = (month: number) => {
    if (selectedYear > currentYear) return false;
    if (selectedYear === currentYear) return month < currentMonth;
    return true; // Past years
  };

  React.useEffect(() => {
    if (value) {
      const [year, month] = value.split('-');
      setSelectedYear(parseInt(year));
      setSelectedMonth(parseInt(month));
    }
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            error && "border-destructive"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDisplayValue(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Select Intake Month & Year</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Month</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem 
                      key={month.value} 
                      value={month.value.toString()}
                      disabled={isMonthDisabled(month.value)}
                    >
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isMonthDisabled(selectedMonth)}
            >
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}