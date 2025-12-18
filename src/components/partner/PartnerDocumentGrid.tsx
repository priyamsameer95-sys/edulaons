import { useMemo } from 'react';
import { Check, CheckCircle, Clock, XCircle, AlertTriangle, Upload } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { LeadDocument } from '@/hooks/useLeadDocuments';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  required?: boolean;
}

interface PartnerDocumentGridProps {
  documentTypes: DocumentType[];
  uploadedDocuments: LeadDocument[];
  selectedDocType: string | null;
  onSelect: (id: string) => void;
}

type DocumentStatus = 'verified' | 'pending' | 'rejected' | 'not_uploaded';

function getDocumentStatus(
  documentTypeId: string,
  uploadedDocuments: LeadDocument[]
): DocumentStatus {
  const doc = uploadedDocuments.find(d => d.document_type_id === documentTypeId);
  if (!doc) return 'not_uploaded';
  
  if (doc.verification_status === 'verified') return 'verified';
  if (doc.verification_status === 'rejected' || doc.ai_validation_status === 'rejected') return 'rejected';
  return 'pending';
}

function StatusIcon({ status }: { status: DocumentStatus }) {
  switch (status) {
    case 'verified':
      return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-600" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Upload className="h-4 w-4 text-muted-foreground" />;
  }
}

function StatusLabel({ status }: { status: DocumentStatus }) {
  const styles = {
    verified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    rejected: 'bg-destructive/10 text-destructive',
    not_uploaded: 'bg-muted text-muted-foreground',
  };
  
  const labels = {
    verified: 'Verified',
    pending: 'Pending',
    rejected: 'Re-upload',
    not_uploaded: 'Not uploaded',
  };
  
  return (
    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', styles[status])}>
      {labels[status]}
    </span>
  );
}

export function PartnerDocumentGrid({
  documentTypes,
  uploadedDocuments,
  selectedDocType,
  onSelect
}: PartnerDocumentGridProps) {
  // Group by category
  const groupedDocs = useMemo(() => {
    return documentTypes.reduce((acc, type) => {
      const category = type.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(type);
      return acc;
    }, {} as Record<string, DocumentType[]>);
  }, [documentTypes]);

  // Summary stats
  const summary = useMemo(() => {
    const total = documentTypes.length;
    const uploaded = documentTypes.filter(d => 
      uploadedDocuments.some(doc => doc.document_type_id === d.id)
    ).length;
    const needsAttention = documentTypes.filter(d => 
      getDocumentStatus(d.id, uploadedDocuments) === 'rejected'
    ).length;
    
    return { total, uploaded, needsAttention };
  }, [documentTypes, uploadedDocuments]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Alert for rejected documents */}
        {summary.needsAttention > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{summary.needsAttention} document{summary.needsAttention > 1 ? 's' : ''} need re-upload</span>
          </div>
        )}

        {/* Categories */}
        {Object.entries(groupedDocs).map(([category, docs]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wide">
              {category}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {docs.map((doc) => {
                const status = getDocumentStatus(doc.id, uploadedDocuments);
                const isSelected = selectedDocType === doc.id;
                
                return (
                  <Tooltip key={doc.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onSelect(doc.id)}
                        className={cn(
                          'flex flex-col items-start gap-2 p-3 rounded-lg border text-left transition-all',
                          'hover:shadow-sm hover:border-primary/50',
                          isSelected && 'border-primary bg-primary/5 ring-1 ring-primary',
                          status === 'verified' && !isSelected && 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10',
                          status === 'rejected' && !isSelected && 'border-destructive/50 bg-destructive/5',
                          status === 'pending' && !isSelected && 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10',
                          status === 'not_uploaded' && !isSelected && 'border-border hover:bg-muted/50'
                        )}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {isSelected ? (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <StatusIcon status={status} />
                          )}
                          <span className={cn(
                            'text-sm font-medium truncate flex-1',
                            status === 'verified' && 'text-emerald-700 dark:text-emerald-400'
                          )}>
                            {doc.name}
                            {doc.required && status === 'not_uploaded' && (
                              <span className="text-destructive ml-0.5">*</span>
                            )}
                          </span>
                        </div>
                        <StatusLabel status={status} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">
                        {status === 'rejected' && '⚠️ Re-upload required'}
                        {status === 'pending' && '⏳ Pending verification'}
                        {status === 'verified' && '✓ Verified'}
                        {status === 'not_uploaded' && 'Click to upload'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
