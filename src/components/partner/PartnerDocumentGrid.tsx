import { useMemo } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { StatusIcon, StatusLabel } from '@/components/document-status';
import { getDocumentStatus, documentStatusTooltips } from '@/utils/documentStatusUtils';
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
  highlightedDocType?: string | null;
  onSelect: (id: string) => void;
}

export function PartnerDocumentGrid({
  documentTypes,
  uploadedDocuments,
  selectedDocType,
  highlightedDocType,
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
                const isHighlighted = highlightedDocType === doc.id;
                
                return (
                  <Tooltip key={doc.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onSelect(doc.id)}
                        className={cn(
                          'flex flex-col items-start gap-2 p-3 rounded-lg border text-left transition-all',
                          'hover:border-primary/50',
                          isSelected && 'border-primary bg-primary/5 ring-1 ring-primary',
                          isHighlighted && !isSelected && 'border-primary bg-primary/10 ring-2 ring-primary animate-pulse',
                          status === 'verified' && !isSelected && !isHighlighted && 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10',
                          status === 'rejected' && !isSelected && !isHighlighted && 'border-destructive/50 bg-destructive/5',
                          status === 'pending' && !isSelected && !isHighlighted && 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10',
                          status === 'not_uploaded' && !isSelected && !isHighlighted && 'border-border hover:bg-muted/50'
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
                      <p className="text-xs">{documentStatusTooltips[status]}</p>
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
