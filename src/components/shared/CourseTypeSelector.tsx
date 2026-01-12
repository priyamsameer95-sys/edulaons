/**
 * Unified Course Type Selector Component
 * 
 * Standard chip/pill toggle pattern for course type selection.
 * Used consistently across Admin, Partner, and Student flows.
 */

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

const COURSE_TYPES: { value: CourseType; label: string }[] = [
  { value: 'masters_stem', label: 'Masters STEM' },
  { value: 'bachelors_stem', label: 'Bachelors STEM' },
  { value: 'mba_management', label: 'MBA' },
  { value: 'others', label: 'Others' },
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
        <label className="text-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {COURSE_TYPES.map((ct) => (
          <button
            key={ct.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(ct.value)}
            className={cn(
              'px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all',
              value === ct.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/40 text-foreground',
              error && !value && 'border-destructive',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {ct.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export { COURSE_TYPES };
