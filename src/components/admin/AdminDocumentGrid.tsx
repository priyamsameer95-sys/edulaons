import { useMemo, useState } from 'react';
import { Check, AlertTriangle, Clock, Upload, XCircle, CheckCircle2, Eye, ShieldCheck, ShieldX, Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDocumentStatus, documentStatusTooltips } from '@/utils/documentStatusUtils';
import { DocumentPreviewDialog } from '@/components/admin/document-upload/DocumentPreviewDialog';
import type { LeadDocument } from '@/hooks/useLeadDocuments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  required?: boolean;
}

interface AdminDocumentGridProps {
  documentTypes: DocumentType[];
  uploadedDocuments: LeadDocument[];
  selectedDocType: string | null;
  highlightedDocType?: string | null;
  onSelect: (id: string) => void;
  onVerify?: (document: LeadDocument) => void;
  onReject?: (document: LeadDocument) => void;
  onRefresh?: () => void;
}

import { getCategoryLabel, getCategoryColors } from '@/constants/categoryLabels';

export function AdminDocumentGrid({
  documentTypes,
  uploadedDocuments,
  selectedDocType,
  highlightedDocType,
  onSelect,
  onVerify,
  onReject,
  onRefresh
}: AdminDocumentGridProps) {
  const [previewDoc, setPreviewDoc] = useState<LeadDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

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
    const progress: Record<string, { uploaded: number; total: number; required: number; requiredUploaded: number; verified: number }> = {};
    
    Object.entries(groupedDocs).forEach(([category, docs]) => {
      const uploaded = docs.filter(d => {
        const status = getDocumentStatus(d.id, uploadedDocuments);
        return status !== 'not_uploaded';
      }).length;
      
      const verified = docs.filter(d => {
        const status = getDocumentStatus(d.id, uploadedDocuments);
        return status === 'verified';
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
        requiredUploaded,
        verified
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
    const verified = uploadedDocuments.filter(doc => doc.verification_status === 'verified').length;
    const needsAttention = documentTypes.filter(d => 
      getDocumentStatus(d.id, uploadedDocuments) === 'rejected'
    ).length;
    const pendingReview = uploadedDocuments.filter(doc => 
      doc.verification_status === 'uploaded' || doc.verification_status === 'pending'
    ).length;
    
    return { total, uploaded, verified, needsAttention, pendingReview };
  }, [documentTypes, uploadedDocuments]);


  const handleViewDocument = (docTypeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = uploadedDocuments.find(d => d.document_type_id === docTypeId);
    if (doc) {
      setPreviewDoc(doc);
      setPreviewOpen(true);
    }
  };

  const handleQuickVerify = async (docTypeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = uploadedDocuments.find(d => d.document_type_id === docTypeId);
    if (!doc) return;

    setVerifyingId(doc.id);
    try {
      const { error } = await supabase
        .from('lead_documents')
        .update({
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
        })
        .eq('id', doc.id);

      if (error) throw error;

      toast({ title: 'Document verified', description: 'Document has been verified successfully' });
      onRefresh?.();
    } catch (error) {
      console.error('Verification error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to verify document' });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleQuickReject = async (docTypeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = uploadedDocuments.find(d => d.document_type_id === docTypeId);
    if (!doc) return;

    setVerifyingId(doc.id);
    try {
      const { error } = await supabase
        .from('lead_documents')
        .update({
          verification_status: 'rejected',
          verified_at: new Date().toISOString(),
        })
        .eq('id', doc.id);

      if (error) throw error;

      toast({ title: 'Document rejected', description: 'Document has been marked for re-upload' });
      onRefresh?.();
    } catch (error) {
      console.error('Rejection error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to reject document' });
    } finally {
      setVerifyingId(null);
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
      case 'uploaded':
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
        {/* Document Preview Dialog with Verification Actions */}
        <DocumentPreviewDialog 
          document={previewDoc} 
          open={previewOpen} 
          onOpenChange={setPreviewOpen}
          onVerificationComplete={onRefresh}
          showVerificationActions={true}
        />

        {/* Summary Stats Header */}
        <div className="grid grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50 border border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{summary.uploaded}</p>
            <p className="text-xs text-muted-foreground">Uploaded</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.verified}</p>
            <p className="text-xs text-muted-foreground">Verified</p>
          </div>
          <div className="text-center border-r border-border">
            <p className={cn("text-2xl font-bold", summary.pendingReview > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
              {summary.pendingReview}
            </p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </div>
          <div className="text-center">
            <p className={cn("text-2xl font-bold", summary.needsAttention > 0 ? "text-destructive" : "text-muted-foreground")}>
              {summary.needsAttention}
            </p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </div>
        </div>

        {/* Alert for pending review */}
        {summary.pendingReview > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {summary.pendingReview} document{summary.pendingReview > 1 ? 's' : ''} pending review
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                Use quick actions to verify or reject
              </p>
            </div>
          </div>
        )}

        {/* Alert for rejected documents */}
        {summary.needsAttention > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {summary.needsAttention} document{summary.needsAttention > 1 ? 's' : ''} rejected
              </p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                Waiting for student/partner to re-upload
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
                    <div className={cn('w-1 h-8 rounded-full', colors.accent)} />
                    <div>
                      <h3 className={cn('text-sm font-semibold', colors.text)}>
                        {getCategoryLabel(category)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {progress?.verified || 0} verified • {progress?.uploaded || 0} uploaded • {progress?.total || 0} total
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
                    const uploadedDoc = uploadedDocuments.find(d => d.document_type_id === doc.id);
                    const isSelected = selectedDocType === doc.id;
                    const isHighlighted = highlightedDocType === doc.id;
                    const isRequired = doc.required || false;
                    const isUploaded = status !== 'not_uploaded';
                    const isPendingReview = status === 'pending';
                    const statusStyles = getStatusStyles(status, isRequired);
                    const isVerifying = uploadedDoc && verifyingId === uploadedDoc.id;
                    
                    return (
                      <Tooltip key={doc.id}>
                        <TooltipTrigger asChild>
                          <div
                            onClick={() => onSelect(doc.id)}
                            className={cn(
                              'relative flex flex-col gap-2 p-3 rounded-lg border-2 text-left transition-all duration-200 cursor-pointer',
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

                            {/* AI confidence badge */}
                            {uploadedDoc?.ai_confidence_score && (
                              <div className="absolute -top-1.5 -left-1.5">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={cn(
                                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-900",
                                      uploadedDoc.ai_confidence_score >= 70 
                                        ? "bg-emerald-500 text-white" 
                                        : uploadedDoc.ai_confidence_score >= 50 
                                          ? "bg-amber-500 text-white"
                                          : "bg-red-500 text-white"
                                    )}>
                                      {Math.round(uploadedDoc.ai_confidence_score)}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    AI confidence: {uploadedDoc.ai_confidence_score}%
                                  </TooltipContent>
                                </Tooltip>
                              </div>
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
                            
                            {/* Status badge */}
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
                                    : 'Pending Review'
                              }
                            </div>

                            {/* Action buttons for uploaded docs */}
                            {isUploaded && (
                              <div className="flex items-center gap-1 pt-1 border-t border-inherit">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => handleViewDocument(doc.id, e)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                
                                {isPendingReview && (
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                      onClick={(e) => handleQuickVerify(doc.id, e)}
                                      disabled={isVerifying}
                                    >
                                      <ShieldCheck className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => handleQuickReject(doc.id, e)}
                                      disabled={isVerifying}
                                    >
                                      <ShieldX className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-xs">{documentStatusTooltips[status]}</p>
                          {isRequired && status === 'not_uploaded' && (
                            <p className="text-xs text-red-500 mt-1">This document is required for processing</p>
                          )}
                          {uploadedDoc?.ai_detected_type && (
                            <p className="text-xs text-muted-foreground mt-1">
                              AI detected: {uploadedDoc.ai_detected_type}
                            </p>
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
