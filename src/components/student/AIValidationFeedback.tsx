/**
 * AI Validation Feedback Component
 * 
 * Shows AI validation results before upload with user-friendly messaging.
 */
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Loader2,
  FileCheck,
  ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ValidationResult } from '@/hooks/useDocumentValidation';

interface AIValidationFeedbackProps {
  status: 'idle' | 'validating' | 'validated';
  validation?: ValidationResult | null;
  className?: string;
}

// User-friendly quality messages
const QUALITY_LABELS: Record<string, { text: string; variant: 'success' | 'warning' | 'error' }> = {
  good: { text: 'Excellent quality', variant: 'success' },
  acceptable: { text: 'Good quality', variant: 'success' },
  poor: { text: 'Low quality - may need re-upload', variant: 'warning' },
  unreadable: { text: 'Document unclear - please re-take', variant: 'error' },
};

// User-friendly red flag messages
const REDFLAG_LABELS: Record<string, string> = {
  blurry: 'Image appears blurry',
  partial: 'Part of document may be cut off',
  screenshot: 'This looks like a screenshot',
  selfie: 'This appears to be a selfie',
  expired: 'Document may be expired',
  tampered: 'Document may have been edited',
  low_resolution: 'Image resolution is low',
};

const AIValidationFeedback = ({
  status,
  validation,
  className,
}: AIValidationFeedbackProps) => {
  if (status === 'idle') return null;

  if (status === 'validating') {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border",
        className
      )}>
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">
          Checking document quality...
        </span>
      </div>
    );
  }

  if (!validation) return null;

  const hasIssues = validation.redFlags.length > 0 || 
    validation.qualityAssessment === 'poor' || 
    validation.qualityAssessment === 'unreadable';
  
  const isRejected = validation.validationStatus === 'rejected';
  const needsReview = validation.validationStatus === 'manual_review';
  const isValid = validation.validationStatus === 'validated' && !hasIssues;

  const qualityInfo = QUALITY_LABELS[validation.qualityAssessment] || QUALITY_LABELS.acceptable;

  return (
    <div className={cn(
      "p-3 rounded-lg border space-y-2",
      isRejected && "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
      hasIssues && !isRejected && "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
      isValid && "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
      needsReview && !hasIssues && "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileCheck className={cn(
          "h-4 w-4",
          isRejected && "text-red-600 dark:text-red-400",
          hasIssues && !isRejected && "text-amber-600 dark:text-amber-400",
          isValid && "text-emerald-600 dark:text-emerald-400",
          needsReview && !hasIssues && "text-blue-600 dark:text-blue-400"
        )} />
        <span className={cn(
          "text-sm font-medium",
          isRejected && "text-red-700 dark:text-red-300",
          hasIssues && !isRejected && "text-amber-700 dark:text-amber-300",
          isValid && "text-emerald-700 dark:text-emerald-300",
          needsReview && !hasIssues && "text-blue-700 dark:text-blue-300"
        )}>
          AI Document Check
        </span>
      </div>

      {/* Validation Results */}
      <div className="space-y-1.5 text-sm">
        {/* Type Match */}
        {validation.isValid && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Document type matches</span>
          </div>
        )}
        {!validation.isValid && validation.detectedType !== 'unknown' && (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>AI detected: {validation.detectedType}</span>
          </div>
        )}

        {/* Quality */}
        <div className={cn(
          "flex items-center gap-2",
          qualityInfo.variant === 'success' && "text-emerald-600 dark:text-emerald-400",
          qualityInfo.variant === 'warning' && "text-amber-600 dark:text-amber-400",
          qualityInfo.variant === 'error' && "text-red-600 dark:text-red-400"
        )}>
          {qualityInfo.variant === 'success' && <CheckCircle2 className="h-3.5 w-3.5" />}
          {qualityInfo.variant === 'warning' && <AlertTriangle className="h-3.5 w-3.5" />}
          {qualityInfo.variant === 'error' && <XCircle className="h-3.5 w-3.5" />}
          <span>{qualityInfo.text}</span>
        </div>

        {/* Red Flags */}
        {validation.redFlags.length > 0 && (
          <div className="space-y-1 mt-2">
            {validation.redFlags.map((flag, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 text-amber-600 dark:text-amber-400"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{REDFLAG_LABELS[flag] || flag}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload guidance */}
      {isValid && (
        <div className="text-xs text-emerald-600 dark:text-emerald-400 pt-1 border-t border-emerald-200 dark:border-emerald-800/50 mt-2">
          ✓ Ready to upload
        </div>
      )}
      
      {hasIssues && !isRejected && (
        <div className="text-xs text-muted-foreground pt-1 border-t border-border/50 mt-2">
          💡 You can still upload - our team will verify it
        </div>
      )}
      
      {isRejected && (
        <div className="text-xs text-red-600 dark:text-red-400 pt-1 border-t border-red-200 dark:border-red-800/50 mt-2 space-y-1">
          <div className="font-medium">⚠️ Cannot upload this document</div>
          {validation.notes && (
            <div>{validation.notes}</div>
          )}
          <div className="text-red-500 dark:text-red-400/80">Please upload a valid document photo</div>
        </div>
      )}
    </div>
  );
};

export default AIValidationFeedback;
