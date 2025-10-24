import { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingLabelInputProps extends React.ComponentProps<'input'> {
  label: string;
  error?: string;
  isValid?: boolean;
  helperText?: string;
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, error, isValid, helperText, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = props.value && String(props.value).length > 0;
    const isFloating = isFocused || hasValue;

    return (
      <div className="space-y-1">
        <div className="relative">
          <Input
            ref={ref}
            className={cn(
              "peer pt-6 pb-2 transition-all",
              error && "border-destructive focus-visible:ring-destructive",
              isValid && !error && "border-success focus-visible:ring-success",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          <Label
            className={cn(
              "absolute left-3 transition-all duration-200 pointer-events-none text-muted-foreground",
              isFloating
                ? "top-1.5 text-xs font-medium"
                : "top-1/2 -translate-y-1/2 text-sm",
              isFocused && "text-primary",
              error && "text-destructive",
              isValid && !error && "text-success"
            )}
          >
            {label} {props.required && <span className="text-destructive">*</span>}
          </Label>
          {isValid && !error && hasValue && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success animate-scale-in" />
          )}
          {error && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive" />
          )}
        </div>
        {error && (
          <p className="text-xs text-destructive flex items-center gap-1 animate-fade-in">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = 'FloatingLabelInput';
