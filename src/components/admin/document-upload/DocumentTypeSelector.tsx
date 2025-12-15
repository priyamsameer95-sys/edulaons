import { useMemo } from 'react';
import { Check, HelpCircle, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getHelpText } from './constants';
import type { LeadDocument } from '@/hooks/useLeadDocuments';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  required?: boolean;
}

interface DocumentTypeSelectorProps {
  documentTypes: DocumentType[] | undefined;
  selectedDocumentType: string;
  onSelect: (id: string) => void;
  uploadedDocuments?: LeadDocument[];
}

type DocumentStatus = 'verified' | 'pending' | 'rejected' | 'not_uploaded';

function getDocumentStatus(
  documentTypeId: string,
  uploadedDocuments?: LeadDocument[]
): DocumentStatus {
  if (!uploadedDocuments) return 'not_uploaded';
  
  const doc = uploadedDocuments.find(d => d.document_type_id === documentTypeId);
  if (!doc) return 'not_uploaded';
  
  if (doc.verification_status === 'verified') return 'verified';
  if (doc.verification_status === 'rejected' || doc.ai_validation_status === 'rejected') return 'rejected';
  return 'pending';
}

function StatusIcon({ status }: { status: DocumentStatus }) {
  switch (status) {
    case 'verified':
      return <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />;
    case 'pending':
      return <Clock className="h-3.5 w-3.5 text-amber-600" />;
    case 'rejected':
      return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    default:
      return null;
  }
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  if (status === 'not_uploaded') return null;
  
  const badgeStyles = {
    verified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    rejected: 'bg-destructive/10 text-destructive',
  };
  
  const labels = {
    verified: 'Verified',
    pending: 'Pending',
    rejected: 'Re-upload',
  };
  
  return (
    <span className={cn(
      'text-[10px] font-medium px-1.5 py-0.5 rounded',
      badgeStyles[status]
    )}>
      {labels[status]}
    </span>
  );
}

export function DocumentTypeSelector({
  documentTypes,
  selectedDocumentType,
  onSelect,
  uploadedDocuments
}: DocumentTypeSelectorProps) {
  // Group document types by category
  const groupedDocumentTypes = useMemo(() => {
    if (!documentTypes) return {};
    return documentTypes.reduce((acc, type) => {
      const category = type.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(type);
      return acc;
    }, {} as Record<string, DocumentType[]>);
  }, [documentTypes]);

  const selectedDocTypeInfo = useMemo(() => {
    if (!documentTypes || !selectedDocumentType) return null;
    return documentTypes.find(t => t.id === selectedDocumentType);
  }, [documentTypes, selectedDocumentType]);

  // Calculate progress summary
  const progressSummary = useMemo(() => {
    if (!documentTypes || !uploadedDocuments) return null;
    
    const requiredDocs = documentTypes.filter(d => d.required);
    const totalRequired = requiredDocs.length;
    
    let uploadedCount = 0;
    let verifiedCount = 0;
    let needsAttentionCount = 0;
    
    documentTypes.forEach(docType => {
      const status = getDocumentStatus(docType.id, uploadedDocuments);
      if (status !== 'not_uploaded') uploadedCount++;
      if (status === 'verified') verifiedCount++;
      if (status === 'rejected') needsAttentionCount++;
    });
    
    const requiredUploaded = requiredDocs.filter(d => 
      getDocumentStatus(d.id, uploadedDocuments) !== 'not_uploaded'
    ).length;
    
    return {
      totalRequired,
      requiredUploaded,
      uploadedCount,
      verifiedCount,
      needsAttentionCount,
    };
  }, [documentTypes, uploadedDocuments]);

  return (
    <div className="space-y-2">
      {/* Progress Summary Banner */}
      {progressSummary && uploadedDocuments && uploadedDocuments.length > 0 && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium',
          progressSummary.needsAttentionCount > 0
            ? 'bg-destructive/10 text-destructive'
            : progressSummary.requiredUploaded >= progressSummary.totalRequired
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        )}>
          {progressSummary.needsAttentionCount > 0 ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{progressSummary.needsAttentionCount} document{progressSummary.needsAttentionCount > 1 ? 's' : ''} need{progressSummary.needsAttentionCount === 1 ? 's' : ''} re-upload</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              <span>
                {progressSummary.requiredUploaded} of {progressSummary.totalRequired} required uploaded
                {progressSummary.verifiedCount > 0 && ` • ${progressSummary.verifiedCount} verified`}
              </span>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Label>Select Document Type</Label>
        {selectedDocTypeInfo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-xs">{getHelpText(selectedDocTypeInfo.name)}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <ScrollArea className="h-[180px] rounded-md border p-3">
        <div className="space-y-4">
          {Object.entries(groupedDocumentTypes).map(([category, types]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                {category}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {types.map((type) => {
                  const status = getDocumentStatus(type.id, uploadedDocuments);
                  const isSelected = selectedDocumentType === type.id;
                  
                  return (
                    <Tooltip key={type.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onSelect(type.id)}
                          className={cn(
                            "flex items-center justify-between gap-1 rounded-md border p-2 text-left text-sm transition-colors hover:bg-muted",
                            isSelected
                              ? "border-primary bg-primary/10"
                              : status === 'verified'
                                ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                                : status === 'rejected'
                                  ? "border-destructive/50 bg-destructive/5"
                                  : status === 'pending'
                                    ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
                                    : "border-border"
                          )}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {isSelected ? (
                              <Check className="h-3 w-3 text-primary flex-shrink-0" />
                            ) : (
                              <StatusIcon status={status} />
                            )}
                            <span className={cn(
                              "truncate text-xs",
                              status === 'verified' && !isSelected && "text-emerald-700 dark:text-emerald-400"
                            )}>
                              {type.name}
                              {type.required && status === 'not_uploaded' && (
                                <span className="text-destructive ml-0.5">*</span>
                              )}
                            </span>
                          </div>
                          <StatusBadge status={status} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-xs">
                          {status === 'rejected' && '⚠️ Re-upload required. '}
                          {status === 'pending' && '⏳ Pending verification. '}
                          {status === 'verified' && '✓ Already verified. '}
                          {getHelpText(type.name)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {selectedDocTypeInfo && (
        <p className="text-xs text-muted-foreground">{getHelpText(selectedDocTypeInfo.name)}</p>
      )}
    </div>
  );
}
