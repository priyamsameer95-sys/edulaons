/**
 * Standard Form Wrapper Component
 * 
 * Per Knowledge Base:
 * - Unified component system across Admin/Partner/Student
 * - Consistent workflow patterns
 * - Autosave indicator slot
 * - Standard hygiene (inline validation, loading states)
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, CloudOff, Clock } from 'lucide-react';

interface AutosaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

interface StandardFormProps {
  /** Form title */
  title?: string;
  /** Form description */
  description?: string;
  /** Form submit handler */
  onSubmit?: (e: React.FormEvent) => void;
  /** Whether form is submitting */
  isSubmitting?: boolean;
  /** Submit button text */
  submitLabel?: string;
  /** Autosave status (from useAutosave hook) */
  autosaveStatus?: AutosaveStatus;
  /** Show autosave indicator */
  showAutosave?: boolean;
  /** Additional actions (buttons) */
  actions?: React.ReactNode;
  /** Card variant or no card */
  variant?: 'card' | 'plain';
  /** Children (form fields) */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Disable submit button */
  disabled?: boolean;
  /** Show cancel button */
  showCancel?: boolean;
  /** Cancel handler */
  onCancel?: () => void;
  /** Footer content */
  footer?: React.ReactNode;
}

const formatLastSaved = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  
  if (diffSecs < 10) return 'Just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const AutosaveIndicator = ({ status }: { status: AutosaveStatus }) => {
  if (status.error) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <CloudOff className="h-3.5 w-3.5" />
        <span>Save failed</span>
      </div>
    );
  }
  
  if (status.isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }
  
  if (status.lastSaved) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Saved {formatLastSaved(status.lastSaved)}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      <span>Autosave enabled</span>
    </div>
  );
};

export const StandardForm: React.FC<StandardFormProps> = ({
  title,
  description,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Submit',
  autosaveStatus,
  showAutosave = false,
  actions,
  variant = 'plain',
  children,
  className,
  disabled = false,
  showCancel = false,
  onCancel,
  footer,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header with autosave indicator */}
      {(title || description || (showAutosave && autosaveStatus)) && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          
          {showAutosave && autosaveStatus && (
            <AutosaveIndicator status={autosaveStatus} />
          )}
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-4">
        {children}
      </div>

      {/* Actions */}
      {(onSubmit || actions || showCancel) && (
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            {showAutosave && autosaveStatus && variant === 'plain' && (
              <AutosaveIndicator status={autosaveStatus} />
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {showCancel && onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            
            {actions}
            
            {onSubmit && (
              <Button
                type="submit"
                disabled={disabled || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div className="pt-4">
          {footer}
        </div>
      )}
    </form>
  );

  if (variant === 'card') {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {showAutosave && autosaveStatus && (
              <AutosaveIndicator status={autosaveStatus} />
            )}
          </CardHeader>
        )}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {children}
            </div>

            {(onSubmit || actions || showCancel) && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                {showCancel && onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
                
                {actions}
                
                {onSubmit && (
                  <Button
                    type="submit"
                    disabled={disabled || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      submitLabel
                    )}
                  </Button>
                )}
              </div>
            )}

            {footer && (
              <div className="pt-4">
                {footer}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {formContent}
    </div>
  );
};

export default StandardForm;
