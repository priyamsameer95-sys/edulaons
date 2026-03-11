/**
 * Unified Course Type Selector Component
 * 
 * Simple dropdown pattern for course type selection.
 * Used consistently across Admin, Partner, and Student flows.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { CourseType } from '@/types/student-application';

interface CourseTypeSelectorProps {
  value?: CourseType | string;
  onChange: (value: CourseType) => void;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
}

const COURSE_TYPES: { value: CourseType; label: string; icon: string }[] = [
  { value: 'masters_stem', label: 'Masters STEM', icon: '🎓' },
  { value: 'bachelors_stem', label: 'Bachelors STEM', icon: '📜' },
  { value: 'mba_management', label: 'MBA / Management', icon: '💼' },
  { value: 'others', label: 'Others', icon: '🌍' },
];

export function CourseTypeSelector({
  value,
  onChange,
  error,
  disabled,
  className,
  label = 'Course Type',
  required = false,
}: CourseTypeSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Select
        value={value || ''}
        onValueChange={(val) => onChange(val as CourseType)}
        disabled={disabled}
      >
        <SelectTrigger className={cn(
          "h-11 shadow-sm",
          error && !value && "border-destructive"
        )}>
          <SelectValue placeholder="Select course type" />
        </SelectTrigger>
        <SelectContent>
          {COURSE_TYPES.map((ct) => (
            <SelectItem key={ct.value} value={ct.value}>
              <span className="flex items-center gap-2">
                <span>{ct.icon}</span>
                <span>{ct.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { COURSE_TYPES };
