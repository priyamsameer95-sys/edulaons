import { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

export interface InputWithValidationProps extends ComponentProps<'input'> {
  label: string;
  helperText?: string;
  error?: string;
  isValid?: boolean;
  showValidation?: boolean;
}

const InputWithValidation = forwardRef<HTMLInputElement, InputWithValidationProps>(
  ({ label, helperText, error, isValid, showValidation = true, className, ...props }, ref) => {
    const [isTouched, setIsTouched] = useState(false);
    const showError = isTouched && error;
    const showSuccess = isTouched && isValid && !error && showValidation;

    return (
      <div className="space-y-2">
        <Label htmlFor={props.id} className="text-sm font-medium">
          {label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        {helperText && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}

        <div className="relative">
          <Input
            ref={ref}
            className={cn(
              "pr-10 transition-smooth",
              showError && "border-destructive focus-visible:ring-destructive",
              showSuccess && "border-success focus-visible:ring-success",
              className
            )}
            onBlur={(e) => {
              setIsTouched(true);
              props.onBlur?.(e);
            }}
            aria-invalid={!!showError}
            aria-describedby={showError ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
            {...props}
          />
          
          {/* Validation icons */}
          {showSuccess && (
            <div className="validation-icon">
              <Check className="h-5 w-5 text-success animate-scale-in" />
            </div>
          )}
          {showError && (
            <div className="validation-icon">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
          )}
        </div>

        {showError && (
          <p 
            id={`${props.id}-error`}
            className="text-sm text-destructive flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputWithValidation.displayName = 'InputWithValidation';

export { InputWithValidation };
