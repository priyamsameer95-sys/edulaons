import { useState, useMemo, useCallback } from 'react';
import { Upload, CheckCircle, AlertTriangle, ChevronDown, FileText, Clock } from 'lucide-react';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import { useLeadDocuments, LeadDocument } from '@/hooks/useLeadDocuments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateFileSize, validateFileFormat } from './document-upload';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DocumentChecklistRow } from './document-upload/DocumentChecklistRow';
import { DocumentPreviewDialog } from './document-upload/DocumentPreviewDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface InlineDocumentUploadProps {
  leadId: string;
  onUploadComplete: () => void;
  uploadedDocuments?: LeadDocument[];
  onDownload?: (document: LeadDocument) => void;
  onVerify?: (document: LeadDocument) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  student: 'Student Documents',
  financial_co_applicant: 'Financial Co-Applicant',
  nri_financial: 'NRI Financial',
  non_financial_co_applicant: 'Non-Financial Co-Applicant',
  collateral: 'Collateral & Security',
};

export function InlineDocumentUpload({ 
  leadId, 
  onUploadComplete,
  uploadedDocuments: externalDocs,
  onDownload,
  onVerify,
}: InlineDocumentUploadProps) {
  const [uploadingDocTypeId, setUploadingDocTypeId] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<LeadDocument | null>(null);
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  const { documentTypes } = useDocumentTypes();
  const { documents: internalDocs, refetch: refetchDocuments } = useLeadDocuments(leadId);
  const { toast } = useToast();
  const { validateDocument, resetValidation } = useDocumentValidation();

  // Use external docs if provided, otherwise use internal
  const uploadedDocuments = externalDocs || internalDocs;

  // Group document types by category with stats
  const categoryData = useMemo(() => {
    if (!documentTypes) return [];
    
    const grouped = documentTypes.reduce((acc, type) => {
      const category = type.category || 'Other';
      if (!acc[category]) acc[category] = { types: [], uploaded: 0, required: 0, requiredUploaded: 0, rejected: 0 };
      acc[category].types.push(type);
      
      if (type.required) acc[category].required++;
      
      const uploadedDoc = uploadedDocuments?.find(d => d.document_type_id === type.id);
      if (uploadedDoc) {
        acc[category].uploaded++;
        if (type.required) acc[category].requiredUploaded++;
        if (uploadedDoc.verification_status === 'rejected' || uploadedDoc.ai_validation_status === 'rejected') {
          acc[category].rejected++;
        }
      }
      
      return acc;
    }, {} as Record<string, { types: typeof documentTypes; uploaded: number; required: number; requiredUploaded: number; rejected: number }>);
    
    return Object.entries(grouped).map(([category, data]) => ({
      category,
      label: CATEGORY_LABELS[category] || category,
      ...data,
      complete: data.requiredUploaded === data.required && data.required > 0,
    }));
  }, [documentTypes, uploadedDocuments]);

  // Get uploaded document for a specific type
  const getUploadedDocument = useCallback((documentTypeId: string) => {
    return uploadedDocuments?.find(d => d.document_type_id === documentTypeId);
  }, [uploadedDocuments]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const totalRequired = categoryData.reduce((sum, c) => sum + c.required, 0);
    const totalRequiredUploaded = categoryData.reduce((sum, c) => sum + c.requiredUploaded, 0);
    const totalUploaded = categoryData.reduce((sum, c) => sum + c.uploaded, 0);
    const totalRejected = categoryData.reduce((sum, c) => sum + c.rejected, 0);
    
    return {
      totalRequired,
      totalRequiredUploaded,
      totalUploaded,
      totalRejected,
      percentage: totalRequired > 0 ? Math.round((totalRequiredUploaded / totalRequired) * 100) : 0,
    };
  }, [categoryData]);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleUpload = async (file: File, documentTypeId: string) => {
    const sizeError = validateFileSize(file);
    if (sizeError) {
      toast({ title: 'File too large', description: sizeError, variant: 'destructive' });
      return;
    }
    const formatError = validateFileFormat(file);
    if (formatError) {
      toast({ title: 'Invalid format', description: formatError, variant: 'destructive' });
      return;
    }

    const docTypeName = documentTypes?.find(t => t.id === documentTypeId)?.name || '';
    
    try {
      setUploadingDocTypeId(documentTypeId);
      
      const validation = await validateDocument(file, docTypeName);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `lead-documents/${leadId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lead-documents')
        .upload(filePath, file);

      if (uploadError) {
        toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' });
        return;
      }

      const { error: dbError } = await supabase
        .from('lead_documents')
        .insert({
          lead_id: leadId,
          document_type_id: documentTypeId,
          original_filename: file.name,
          stored_filename: fileName,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: 'admin',
          verification_status: 'uploaded',
          ai_validation_status: validation?.validationStatus || 'pending',
          ai_detected_type: validation?.detectedType || null,
          ai_confidence_score: validation?.confidence || null,
          ai_quality_assessment: validation?.qualityAssessment || null,
          ai_validation_notes: validation?.notes || null,
          ai_validated_at: validation ? new Date().toISOString() : null,
        });

      if (dbError) {
        await supabase.storage.from('lead-documents').remove([filePath]);
        toast({ title: 'Error', description: 'Failed to save document', variant: 'destructive' });
        return;
      }

      toast({ title: 'Document uploaded', description: `${docTypeName} uploaded successfully.` });
      resetValidation();
      refetchDocuments();
      onUploadComplete();
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploadingDocTypeId(null);
    }
  };

  const handlePreview = (document: LeadDocument) => {
    setPreviewDocument(document);
  };

  return (
    <div className="border rounded-lg bg-card flex flex-col h-full">
      {/* Summary Header */}
      <div className="px-4 py-3 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Documents</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {overallProgress.totalRejected > 0 && (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                {overallProgress.totalRejected} issues
              </span>
            )}
            <span className="text-muted-foreground">
              {overallProgress.totalRequiredUploaded}/{overallProgress.totalRequired} required
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <Progress value={overallProgress.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {overallProgress.percentage}% complete • {overallProgress.totalUploaded} files uploaded
          </p>
        </div>
      </div>

      {/* Collapsible Categories */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1">
          {categoryData.map(({ category, label, types, uploaded, required, requiredUploaded, rejected, complete }) => (
            <Collapsible 
              key={category} 
              open={openCategories.includes(category)}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger className="w-full">
                <div className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors",
                  "hover:bg-muted/50",
                  openCategories.includes(category) && "bg-muted/30"
                )}>
                  <div className="flex items-center gap-2">
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      openCategories.includes(category) && "rotate-180"
                    )} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rejected > 0 && (
                      <span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="h-3 w-3" />
                        {rejected}
                      </span>
                    )}
                    {complete ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                        <CheckCircle className="h-3 w-3" />
                        Complete
                      </span>
                    ) : required > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        <Clock className="h-3 w-3" />
                        {requiredUploaded}/{required}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {uploaded}/{types.length}
                      </span>
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-6 mt-1 space-y-0.5 pb-2">
                  {types.map((docType) => (
                    <DocumentChecklistRow
                      key={docType.id}
                      documentType={{
                        id: docType.id,
                        name: docType.name,
                        category: docType.category,
                        required: docType.required ?? false,
                      }}
                      uploadedDocument={getUploadedDocument(docType.id)}
                      onUpload={handleUpload}
                      onPreview={handlePreview}
                      onDownload={onDownload}
                      onVerify={onVerify}
                      isUploading={!!uploadingDocTypeId}
                      uploadingDocTypeId={uploadingDocTypeId || undefined}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Preview Dialog */}
      <DocumentPreviewDialog
        document={previewDocument}
        open={!!previewDocument}
        onOpenChange={(open) => !open && setPreviewDocument(null)}
      />
    </div>
  );
}
