import { useMemo, useState } from 'react';
import { Check, AlertTriangle, Clock, Upload, XCircle, CheckCircle2, Eye, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getDocumentStatus, getDocumentRejectionReason, partnerDocumentStatusLabels, documentStatusTooltips } from '@/utils/documentStatusUtils';
import { DocumentPreviewDialog } from '@/components/admin/document-upload/DocumentPreviewDialog';
import type { LeadDocument } from '@/hooks/useLeadDocuments';
import { getCategoryLabel, getCategoryColors } from '@/constants/categoryLabels';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  required?: boolean;
}

type FilterTab = 'all' | 'pending' | 'uploaded' | 'need_attention' | 'verified';

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
  const [previewDoc, setPreviewDoc] = useState<LeadDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Calculate counts for each filter tab
  const filterCounts = useMemo(() => {
    const counts = {
      all: documentTypes.length,
      pending: 0,
      uploaded: 0,
      need_attention: 0,
      verified: 0
    };

    documentTypes.forEach(d => {
      const status = getDocumentStatus(d.id, uploadedDocuments);
      switch (status) {
        case 'not_uploaded':
          counts.pending++;
          break;
        case 'uploaded':
        case 'pending':
          counts.uploaded++;
          break;
        case 'rejected':
          counts.need_attention++;
          break;
        case 'verified':
          counts.verified++;
          break;
      }
    });

    return counts;
  }, [documentTypes, uploadedDocuments]);

  // Filter documents based on active tab
  const filteredDocumentTypes = useMemo(() => {
    if (activeFilter === 'all') return documentTypes;

    return documentTypes.filter(d => {
      const status = getDocumentStatus(d.id, uploadedDocuments);
      switch (activeFilter) {
        case 'pending':
          return status === 'not_uploaded';
        case 'uploaded':
          return status === 'uploaded' || status === 'pending';
        case 'need_attention':
          return status === 'rejected';
        case 'verified':
          return status === 'verified';
        default:
          return true;
      }
    });
  }, [documentTypes, uploadedDocuments, activeFilter]);

  // Group filtered docs by category
  const groupedDocs = useMemo(() => {
    return filteredDocumentTypes.reduce((acc, type) => {
      const category = type.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(type);
      return acc;
    }, {} as Record<string, DocumentType[]>);
  }, [filteredDocumentTypes]);

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
      case 'uploaded':
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

  // Get action button based on status
  const getActionButton = (docId: string, status: string, isRequired: boolean) => {
    switch (status) {
      case 'not_uploaded':
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(docId);
            }}
          >
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </Button>
        );
      case 'rejected':
        return (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(docId);
            }}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Re-upload
          </Button>
        );
      case 'verified':
        // Verified - no upload action, read-only
        return null;
      case 'uploaded':
      case 'pending':
        // In Review - no edit allowed, just view
        return null;
      default:
        return null;
    }
  };

  // Filter tab configuration
  const filterTabs: { key: FilterTab; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { key: 'pending', label: 'Pending', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { key: 'uploaded', label: 'Uploaded', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
    { key: 'need_attention', label: 'Need Attention', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
    { key: 'verified', label: 'Verified', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Document Preview Dialog */}
        <DocumentPreviewDialog 
          document={previewDoc} 
          open={previewOpen} 
          onOpenChange={setPreviewOpen} 
        />

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => {
            const count = filterCounts[tab.key];
            const isActive = activeFilter === tab.key;
            
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  'border-2',
                  isActive 
                    ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                    : 'border-transparent hover:bg-muted/50',
                  tab.key === 'need_attention' && count > 0 && !isActive && 'animate-pulse'
                )}
              >
                <span>{tab.label}</span>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'h-5 min-w-[20px] px-1.5 text-xs',
                    isActive ? 'bg-primary text-primary-foreground' : tab.color,
                    tab.key === 'need_attention' && count > 0 && 'bg-red-500 text-white'
                  )}
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Alert for rejected documents */}
        {filterCounts.need_attention > 0 && activeFilter !== 'need_attention' && (
          <div 
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
            onClick={() => setActiveFilter('need_attention')}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {filterCounts.need_attention} document{filterCounts.need_attention > 1 ? 's' : ''} need re-upload
              </p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                Click to view documents that require attention
              </p>
            </div>
            <Button variant="destructive" size="sm" className="flex-shrink-0">
              View
            </Button>
          </div>
        )}

        {/* Empty state for filtered view */}
        {Object.keys(groupedDocs).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No documents in this category</p>
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
                    <div className={cn('w-1 h-8 rounded-full', colors.accent)} />
                    <div>
                      <h3 className={cn('text-sm font-semibold', colors.text)}>
                        {getCategoryLabel(category)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {progress?.required || 0} required • {progress?.total || 0} total
                      </p>
                    </div>
                  </div>
                  
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
                    const rejectionReason = getDocumentRejectionReason(doc.id, uploadedDocuments);
                    const isSelected = selectedDocType === doc.id;
                    const isHighlighted = highlightedDocType === doc.id;
                    const isRequired = doc.required || false;
                    const isUploaded = status !== 'not_uploaded';
                    const statusStyles = getStatusStyles(status, isRequired);
                    const canUpload = status === 'not_uploaded' || status === 'rejected';
                    
                    return (
                      <Tooltip key={doc.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'relative flex flex-col gap-2 p-3 rounded-lg border-2 text-left transition-all duration-200',
                              canUpload && 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                              !canUpload && 'cursor-default',
                              isSelected && 'border-primary bg-primary/10 ring-2 ring-primary shadow-md',
                              isHighlighted && !isSelected && 'border-primary bg-primary/10 ring-2 ring-primary animate-pulse shadow-lg',
                              !isSelected && !isHighlighted && statusStyles.container
                            )}
                            onClick={() => canUpload && onSelect(doc.id)}
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
                                  (status === 'pending' || status === 'uploaded') && 'text-amber-700 dark:text-amber-300'
                                )}>
                                  {doc.name}
                                </span>
                              </div>
                            </div>

                            {/* Rejection reason for rejected docs */}
                            {status === 'rejected' && rejectionReason && (
                              <div className="bg-red-100 dark:bg-red-900/30 rounded px-2 py-1.5 border border-red-200 dark:border-red-800">
                                <p className="text-xs text-red-700 dark:text-red-300 font-medium mb-0.5">Admin Feedback:</p>
                                <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">{rejectionReason}</p>
                              </div>
                            )}
                            
                            {/* Status badge and action row */}
                            <div className="flex items-center justify-between gap-2">
                              <div className={cn(
                                'text-xs font-medium px-2 py-1 rounded-md w-fit',
                                statusStyles.badge
                              )}>
                                {status === 'not_uploaded' 
                                  ? (isRequired ? 'Required' : 'Optional')
                                  : partnerDocumentStatusLabels[status]
                                }
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex items-center gap-1">
                                {/* View button for uploaded docs */}
                                {isUploaded && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-background/80"
                                    onClick={(e) => handleViewDocument(doc.id, e)}
                                  >
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                )}
                                
                                {/* Upload/Re-upload action */}
                                {getActionButton(doc.id, status, isRequired)}
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-xs">{documentStatusTooltips[status]}</p>
                          {isRequired && status === 'not_uploaded' && (
                            <p className="text-xs text-red-500 mt-1">This document is required for processing</p>
                          )}
                          {status === 'verified' && (
                            <p className="text-xs text-emerald-600 mt-1">This document has been verified by admin</p>
                          )}
                          {(status === 'uploaded' || status === 'pending') && (
                            <p className="text-xs text-amber-600 mt-1">Awaiting admin review</p>
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
