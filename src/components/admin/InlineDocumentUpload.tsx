import { useState, useMemo, useCallback } from 'react';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import { useLeadDocuments, LeadDocument } from '@/hooks/useLeadDocuments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateFileSize, validateFileFormat } from './document-upload';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DocumentChecklistRow } from './document-upload/DocumentChecklistRow';
import { DocumentPreviewDialog } from './document-upload/DocumentPreviewDialog';

interface InlineDocumentUploadProps {
  leadId: string;
  onUploadComplete: () => void;
  uploadedDocuments?: LeadDocument[];
  onDownload?: (document: LeadDocument) => void;
  onVerify?: (document: LeadDocument) => void;
}

export function InlineDocumentUpload({ 
  leadId, 
  onUploadComplete,
  uploadedDocuments: externalDocs,
  onDownload,
  onVerify,
}: InlineDocumentUploadProps) {
  const [uploadingDocTypeId, setUploadingDocTypeId] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<LeadDocument | null>(null);

  const { documentTypes } = useDocumentTypes();
  const { documents: internalDocs, refetch: refetchDocuments } = useLeadDocuments(leadId);
  const { toast } = useToast();
  const { validateDocument, resetValidation } = useDocumentValidation();

  // Use external docs if provided, otherwise use internal
  const uploadedDocuments = externalDocs || internalDocs;

  // Group document types by category
  const groupedTypes = useMemo(() => {
    if (!documentTypes) return {};
    return documentTypes.reduce((acc, type) => {
      const category = type.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(type);
      return acc;
    }, {} as Record<string, typeof documentTypes>);
  }, [documentTypes]);

  // Get uploaded document for a specific type
  const getUploadedDocument = useCallback((documentTypeId: string) => {
    return uploadedDocuments?.find(d => d.document_type_id === documentTypeId);
  }, [uploadedDocuments]);

  // Calculate progress stats
  const progressStats = useMemo(() => {
    if (!documentTypes || !uploadedDocuments) return null;
    
    const requiredDocs = documentTypes.filter(d => d.required);
    const uploadedCount = uploadedDocuments.length;
    const verifiedCount = uploadedDocuments.filter(d => d.verification_status === 'verified').length;
    const rejectedCount = uploadedDocuments.filter(
      d => d.verification_status === 'rejected' || d.ai_validation_status === 'rejected'
    ).length;
    const requiredUploaded = requiredDocs.filter(
      d => uploadedDocuments.some(ud => ud.document_type_id === d.id)
    ).length;

    return {
      totalRequired: requiredDocs.length,
      requiredUploaded,
      uploadedCount,
      verifiedCount,
      rejectedCount,
    };
  }, [documentTypes, uploadedDocuments]);

  const handleUpload = async (file: File, documentTypeId: string) => {
    // Validate file
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
      
      // Validate with AI
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
    <div className="border rounded-lg bg-card">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Documents</span>
          <span className="text-[10px] text-muted-foreground">(jpg, pdf, png • max 10MB)</span>
        </div>
        {progressStats && (
          <div className="flex items-center gap-2 text-[10px]">
            {progressStats.rejectedCount > 0 && (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <AlertTriangle className="h-3 w-3" />
                {progressStats.rejectedCount}
              </span>
            )}
            <span className="text-muted-foreground">
              {progressStats.requiredUploaded}/{progressStats.totalRequired}
            </span>
            {progressStats.verifiedCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle className="h-3 w-3" />
                {progressStats.verifiedCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Compact Document List */}
      <ScrollArea className="h-[320px]">
        <div className="p-2 space-y-3">
          {Object.entries(groupedTypes).map(([category, types]) => (
            <div key={category}>
              <h4 className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 px-2">
                {category}
              </h4>
              <div className="space-y-0.5">
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
            </div>
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
