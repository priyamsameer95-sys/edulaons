import { useMemo, useState } from 'react';
import { Check, AlertTriangle, Clock, Upload, XCircle, CheckCircle2, Eye } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDocumentStatus, documentStatusTooltips } from '@/utils/documentStatusUtils';
import { DocumentPreviewDialog } from '@/components/admin/document-upload/DocumentPreviewDialog';
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

// Category color mapping
const CATEGORY_COLORS: Record<string, {
  bg: string;
  border: string;
  text: string;
  accent: string;
  progressBg: string;
  progressFill: string;
}> = {
  STUDENT: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    accent: 'bg-blue-500',
    progressBg: 'bg-blue-100 dark:bg-blue-900',
    progressFill: 'bg-blue-500'
  },
  FINANCIAL_CO_APPLICANT: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    accent: 'bg-emerald-500',
    progressBg: 'bg-emerald-100 dark:bg-emerald-900',
    progressFill: 'bg-emerald-500'
  },
  NRI_FINANCIAL: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    accent: 'bg-purple-500',
    progressBg: 'bg-purple-100 dark:bg-purple-900',
    progressFill: 'bg-purple-500'
  },
  NON_FINANCIAL_CO_APPLICANT: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    accent: 'bg-amber-500',
    progressBg: 'bg-amber-100 dark:bg-amber-900',
    progressFill: 'bg-amber-500'
  },
  COLLATERAL: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    accent: 'bg-orange-500',
    progressBg: 'bg-orange-100 dark:bg-orange-900',
    progressFill: 'bg-orange-500'
  }
};

const DEFAULT_CATEGORY_COLORS = {
  bg: 'bg-slate-50 dark:bg-slate-950/30',
  border: 'border-slate-200 dark:border-slate-800',
  text: 'text-slate-700 dark:text-slate-300',
  accent: 'bg-slate-500',
  progressBg: 'bg-slate-100 dark:bg-slate-900',
  progressFill: 'bg-slate-500'
};

// Friendly category names
const CATEGORY_LABELS: Record<string, string> = {
  STUDENT: 'Student Documents',
  FINANCIAL_CO_APPLICANT: 'Financial Co-Applicant',
  NRI_FINANCIAL: 'NRI Financial Documents',
  NON_FINANCIAL_CO_APPLICANT: 'Non-Financial Co-Applicant',
  COLLATERAL: 'Collateral & Property'
};

export function PartnerDocumentGrid({
  documentTypes,
  uploadedDocuments,
  selectedDocType,
  highlightedDocType,
  onSelect
}: PartnerDocumentGridProps) {
  const [previewDoc, setPreviewDoc] = useState<LeadDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Group by category
  const groupedDocs = useMemo(() => {
    return documentTypes.reduce((acc, type) => {
      const category = type.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(type);
      return acc;
    }, {} as Record<string, DocumentType[]>);
  }, [documentTypes]);

  // Calculate per-category progress
  const categoryProgress = useMemo(() => {
    const progress: Record<string, { uploaded: number; total: number; required: number; requiredUploaded: number }> = {};
    
    Object.entries(groupedDocs).forEach(([category, docs]) => {
      const uploaded = docs.filter(d => {
        const status = getDocumentStatus(d.id, uploadedDocuments);
        return status !== 'not_uploaded';
      }).length;
      
      const requiredDocs = docs.filter(d => d.required);
      const requiredUploaded = requiredDocs.filter(d => {
        const status = getDocumentStatus(d.id, uploadedDocuments);
        return status !== 'not_uploaded';
      }).length;
      
      progress[category] = {
        uploaded,
        total: docs.length,
        required: requiredDocs.length,
        requiredUploaded
      };
    });
    
    return progress;
  }, [groupedDocs, uploadedDocuments]);

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

  const getCategoryColors = (category: string) => {
    return CATEGORY_COLORS[category] || DEFAULT_CATEGORY_COLORS;
  };

  const handleViewDocument = (docTypeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = uploadedDocuments.find(d => d.document_type_id === docTypeId);
    if (doc) {
      setPreviewDoc(doc);
      setPreviewOpen(true);
    }
  };

  const getStatusStyles = (status: string, isRequired: boolean) => {
    switch (status) {
      case 'verified':
        return {
          container: 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-700 dark:bg-emerald-900/20',
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
          badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
        };
      case 'rejected':
        return {
          container: 'border-red-300 bg-red-50/80 dark:border-red-700 dark:bg-red-900/20 ring-1 ring-red-200 dark:ring-red-800',
          icon: <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />,
          badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
        };
      case 'pending':
        return {
          container: 'border-amber-300 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-900/20',
          icon: <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
          badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
        };
      default:
        return {
          container: isRequired 
            ? 'border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20 border-dashed'
            : 'border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/20 border-dashed',
          icon: isRequired 
            ? <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
            : <Upload className="h-4 w-4 text-slate-400 dark:text-slate-500" />,
          badge: isRequired
            ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        };
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Document Preview Dialog */}
        <DocumentPreviewDialog 
          document={previewDoc} 
          open={previewOpen} 
          onOpenChange={setPreviewOpen} 
        />

        {/* Alert for rejected documents */}
        {summary.needsAttention > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {summary.needsAttention} document{summary.needsAttention > 1 ? 's' : ''} need re-upload
              </p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                Please review and upload corrected versions
              </p>
            </div>
          </div>
        )}

        {/* Categories */}
        {Object.entries(groupedDocs).map(([category, docs]) => {
          const colors = getCategoryColors(category);
          const progress = categoryProgress[category];
          const progressPercent = progress ? Math.round((progress.uploaded / progress.total) * 100) : 0;
          
          return (
            <div 
              key={category} 
              className={cn(
                'rounded-xl border overflow-hidden',
                colors.border,
                colors.bg
              )}
            >
              {/* Category Header */}
              <div className="px-4 py-3 border-b border-inherit">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Color accent bar */}
                    <div className={cn('w-1 h-8 rounded-full', colors.accent)} />
                    <div>
                      <h3 className={cn('text-sm font-semibold', colors.text)}>
                        {CATEGORY_LABELS[category] || category}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {progress?.required || 0} required • {progress?.total || 0} total
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={cn('text-lg font-bold', colors.text)}>
                        {progress?.uploaded || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">/{progress?.total || 0}</span>
                    </div>
                    <div className="w-20">
                      <div className={cn('h-2 rounded-full overflow-hidden', colors.progressBg)}>
                        <div 
                          className={cn('h-full rounded-full transition-all duration-500', colors.progressFill)}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {docs.map((doc) => {
                    const status = getDocumentStatus(doc.id, uploadedDocuments);
                    const isSelected = selectedDocType === doc.id;
                    const isHighlighted = highlightedDocType === doc.id;
                    const isRequired = doc.required || false;
                    const isUploaded = status !== 'not_uploaded';
                    const statusStyles = getStatusStyles(status, isRequired);
                    
                    return (
                      <Tooltip key={doc.id}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => onSelect(doc.id)}
                            className={cn(
                              'relative flex flex-col gap-2 p-3 rounded-lg border-2 text-left transition-all duration-200',
                              'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                              isSelected && 'border-primary bg-primary/10 ring-2 ring-primary shadow-md',
                              isHighlighted && !isSelected && 'border-primary bg-primary/10 ring-2 ring-primary animate-pulse shadow-lg',
                              !isSelected && !isHighlighted && statusStyles.container
                            )}
                          >
                            {/* Required badge */}
                            {isRequired && status === 'not_uploaded' && (
                              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
                            )}
                            
                            {/* Header row */}
                            <div className="flex items-start gap-2 w-full">
                              <div className="flex-shrink-0 mt-0.5">
                                {isSelected ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  statusStyles.icon
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={cn(
                                  'text-sm font-medium leading-tight block',
                                  status === 'verified' && 'text-emerald-700 dark:text-emerald-300',
                                  status === 'rejected' && 'text-red-700 dark:text-red-300',
                                  status === 'pending' && 'text-amber-700 dark:text-amber-300'
                                )}>
                                  {doc.name}
                                </span>
                              </div>
                            </div>
                            
                            {/* Status badge and View button row */}
                            <div className="flex items-center justify-between gap-2">
                              <div className={cn(
                                'text-xs font-medium px-2 py-1 rounded-md w-fit',
                                statusStyles.badge
                              )}>
                                {status === 'not_uploaded' 
                                  ? (isRequired ? 'Required' : 'Optional')
                                  : status === 'verified' 
                                    ? 'Verified ✓'
                                    : status === 'rejected'
                                      ? 'Re-upload needed'
                                      : 'In Review'
                                }
                              </div>
                              
                              {/* View button for uploaded docs */}
                              {isUploaded && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-background/80"
                                  onClick={(e) => handleViewDocument(doc.id, e)}
                                >
                                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              )}
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-xs">{documentStatusTooltips[status]}</p>
                          {isRequired && status === 'not_uploaded' && (
                            <p className="text-xs text-red-500 mt-1">This document is required for processing</p>
                          )}
                          {isUploaded && (
                            <p className="text-xs text-muted-foreground mt-1">Click the eye icon to preview</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}