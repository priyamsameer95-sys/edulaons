import { CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ValidationResult } from '@/hooks/useDocumentValidation';
import { formatDisplayText } from '@/utils/formatters';

interface ValidationStatusDisplayProps {
  isValidating: boolean;
  validationResult: ValidationResult | null;
  hasFile: boolean;
  hasDocumentType: boolean;
  adminOverride: boolean;
  onAdminOverride: () => void;
}

// Generate detailed feedback from validation result
function getDetailedFeedback(validationResult: ValidationResult | null): string[] {
  if (!validationResult) return [];
  const { redFlags, qualityAssessment, notes } = validationResult;
  
  const issues: string[] = [];
  
  // Non-document issues (highest priority)
  if (redFlags?.includes('not_a_document') || redFlags?.includes('random_photo')) {
    issues.push('This does not appear to be a document. Please upload the actual document.');
  }
  if (redFlags?.includes('selfie')) {
    issues.push('This appears to be a selfie or personal photo, not a document.');
  }
  if (redFlags?.includes('screenshot')) {
    issues.push('Screenshots are not accepted. Please upload the original document or a clear photo.');
  }
  
  // Quality issues
  if (redFlags?.includes('blurry') || qualityAssessment === 'poor') {
    issues.push('The document appears blurry. Please upload a clearer version.');
  }
  if (redFlags?.includes('edited')) {
    issues.push('This document appears to have been edited or modified.');
  }
  if (redFlags?.includes('cropped') || redFlags?.includes('partial') || redFlags?.includes('incomplete')) {
    issues.push('Parts of the document appear to be cropped or missing.');
  }
  if (redFlags?.includes('low_quality')) {
    issues.push('Image quality is low. Try scanning or photographing in better lighting.');
  }
  if (notes?.toLowerCase().includes('pii') || notes?.toLowerCase().includes('blurred')) {
    issues.push('Personal information fields appear obscured or unreadable.');
  }
  
  return issues;
}

export function ValidationStatusDisplay({
  isValidating,
  validationResult,
  hasFile,
  hasDocumentType,
  adminOverride,
  onAdminOverride,
}: ValidationStatusDisplayProps) {
  if (!hasFile || !hasDocumentType) return null;

  if (isValidating) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted rounded-md mt-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">AI is validating your document...</span>
      </div>
    );
  }

  if (!validationResult) return null;

  const { validationStatus, detectedType, expectedType, confidence, notes, redFlags } = validationResult;
  const detailedIssues = getDetailedFeedback(validationResult);

  if (validationStatus === 'validated') {
    return (
      <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md mt-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">Document verified</span>
          <span className="text-xs text-green-600 dark:text-green-500 ml-auto">
            {Math.round(confidence)}% confidence
          </span>
        </div>
        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
          ✓ Document type matches • ✓ Quality acceptable • Ready to upload
        </p>
      </div>
    );
  }

  if (validationStatus === 'manual_review') {
    return (
      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md mt-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Needs manual review</span>
        </div>
        {detailedIssues.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {detailedIssues.map((issue, i) => (
              <li key={i} className="text-xs text-amber-600 dark:text-amber-500 flex items-start gap-1">
                <span className="mt-0.5">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">{notes}</p>
        )}
        {redFlags && redFlags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {redFlags.map((flag, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded">
                {formatDisplayText(flag)}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (validationStatus === 'rejected') {
    // Determine rejection reason for header
    const isNotDocument = redFlags?.some(f => ['not_a_document', 'random_photo', 'selfie'].includes(f));
    const isUnknown = detectedType === 'unknown';
    const headerText = isNotDocument 
      ? 'Not a valid document' 
      : isUnknown 
        ? 'Document not recognized' 
        : 'Wrong document type';

    return (
      <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md mt-3">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-700 dark:text-red-400">{headerText}</span>
        </div>
        <div className="mt-2 text-xs text-red-600 dark:text-red-500 space-y-1">
          <p><strong>Expected:</strong> {expectedType}</p>
          {!isNotDocument && !isUnknown && <p><strong>Detected:</strong> {detectedType || 'Unknown'}</p>}
        </div>
        {detailedIssues.length > 0 && (
          <ul className="mt-2 space-y-1">
            {detailedIssues.map((issue, i) => (
              <li key={i} className="text-xs text-red-600 dark:text-red-500 flex items-start gap-1">
                <span className="mt-0.5">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        )}
        {!adminOverride && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAdminOverride}
            className="mt-2 text-xs h-7 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            Upload Anyway (Admin Override)
          </Button>
        )}
        {adminOverride && (
          <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            Admin override enabled - document will be uploaded
          </div>
        )}
      </div>
    );
  }

  return null;
}
