/**
 * Shared FormField Component
 * 
 * Per Knowledge Base:
 * - Unified component system across Admin/Partner/Student
 * - Inline validation
 * - Consistent error copy
 */
import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface FormFieldProps {
  /** Field label */
  label: string;
  /** Field name/id */
  name: string;
  /** Field value */
  value: string | number;
  /** Change handler */
  onChange: (value: string) => void;
  /** Field type (default: text) */
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'textarea';
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Whether field value is valid */
  isValid?: boolean;
  /** Helper text */
  helperText?: string;
  /** Additional className */
  className?: string;
  /** Maximum length */
  maxLength?: number;
  /** Pattern for validation */
  pattern?: string;
  /** Input mode for mobile keyboards */
  inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'decimal';
  /** Auto-focus field */
  autoFocus?: boolean;
  /** Show character count */
  showCharCount?: boolean;
}

export const FormField = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
  ({
    label,
    name,
    value,
    onChange,
    type = 'text',
    placeholder,
    required = false,
    disabled = false,
    error,
    isValid,
    helperText,
    className,
    maxLength,
    pattern,
    inputMode,
    autoFocus,
    showCharCount,
  }, ref) => {
    const inputId = `field-${name}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    
    const hasError = !!error;
    const showValid = isValid && !hasError && value;
    
    const inputClassName = cn(
      "transition-colors",
      hasError && "border-destructive focus-visible:ring-destructive",
      showValid && "border-success focus-visible:ring-success",
      disabled && "opacity-60 cursor-not-allowed"
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    const renderInput = () => {
      if (type === 'textarea') {
        return (
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            autoFocus={autoFocus}
            aria-invalid={hasError}
            aria-describedby={cn(
              hasError && errorId,
              helperText && helperId
            )}
            className={cn(inputClassName, "min-h-[100px] resize-y")}
          />
        );
      }

      return (
        <Input
          ref={ref as React.Ref<HTMLInputElement>}
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          pattern={pattern}
          inputMode={inputMode}
          autoFocus={autoFocus}
          aria-invalid={hasError}
          aria-describedby={cn(
            hasError && errorId,
            helperText && helperId
          )}
          className={inputClassName}
        />
      );
    };

    return (
      <div className={cn("space-y-2", className)}>
        {/* Label */}
        <div className="flex items-center justify-between">
          <Label htmlFor={inputId} className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          
          {/* Character count */}
          {showCharCount && maxLength && (
            <span className={cn(
              "text-xs",
              String(value).length >= maxLength ? "text-destructive" : "text-muted-foreground"
            )}>
              {String(value).length}/{maxLength}
            </span>
          )}
        </div>

        {/* Input with status icon */}
        <div className="relative">
          {renderInput()}
          
          {/* Status indicator */}
          {(hasError || showValid) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {hasError ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : showValid ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : null}
            </div>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p id={errorId} className="text-sm text-destructive flex items-center gap-1.5" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        {/* Helper text */}
        {helperText && !hasError && (
          <p id={helperId} className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0" />
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;
