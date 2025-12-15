import { useState, useMemo, useCallback } from 'react';
import { Upload, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
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
}

export function InlineDocumentUpload({ leadId, onUploadComplete }: InlineDocumentUploadProps) {
  const [uploadingDocTypeId, setUploadingDocTypeId] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<LeadDocument | null>(null);

  const { documentTypes } = useDocumentTypes();
  const { documents: uploadedDocuments, refetch: refetchDocuments } = useLeadDocuments(leadId);
  const { toast } = useToast();
  const { validateDocument, validationResult, resetValidation } = useDocumentValidation();

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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Documents</span>
        </div>
        {progressStats && (
          <div className="flex items-center gap-3 text-xs">
            {progressStats.rejectedCount > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                {progressStats.rejectedCount} need re-upload
              </span>
            )}
            <span className="text-muted-foreground">
              {progressStats.requiredUploaded}/{progressStats.totalRequired} required
            </span>
            {progressStats.verifiedCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" />
                {progressStats.verifiedCount} verified
              </span>
            )}
          </div>
        )}
      </div>

      {/* Document List */}
      <ScrollArea className="h-[350px]">
        <div className="p-3 space-y-4">
          {Object.entries(groupedTypes).map(([category, types]) => (
            <div key={category}>
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">
                <FileText className="h-3.5 w-3.5" />
                {category}
              </h4>
              <div className="space-y-1.5">
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
