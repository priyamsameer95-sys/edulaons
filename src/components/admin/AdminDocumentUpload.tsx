import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Upload, Loader2 } from 'lucide-react';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DocumentTypeSelector,
  FileDropZone,
  DocumentPreviewModal,
  ValidationStatusDisplay,
  validateFileSize,
  validateFileFormat
} from './document-upload';

interface AdminDocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  onUploadComplete: () => void;
}

export function AdminDocumentUpload({
  open,
  onOpenChange,
  leadId,
  onUploadComplete
}: AdminDocumentUploadProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [adminOverride, setAdminOverride] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { documentTypes } = useDocumentTypes();
  const { toast } = useToast();
  const { validateDocument, isValidating, validationResult, resetValidation } = useDocumentValidation();

  // Get selected document type name
  const selectedDocTypeName = useMemo(() => {
    if (!documentTypes || !selectedDocumentType) return '';
    return documentTypes.find(t => t.id === selectedDocumentType)?.name || '';
  }, [documentTypes, selectedDocumentType]);

  // Generate preview URL for images
  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Trigger validation when file and document type are both selected
  useEffect(() => {
    if (selectedFile && selectedDocTypeName) {
      setAdminOverride(false);
      validateDocument(selectedFile, selectedDocTypeName);
    }
  }, [selectedFile, selectedDocTypeName, validateDocument]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setSelectedDocumentType('');
      setAdminOverride(false);
      setPreviewUrl(null);
      setShowPreview(false);
      resetValidation();
    }
  }, [open, resetValidation]);

  const processFile = useCallback((file: File) => {
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
    setSelectedFile(file);
  }, [toast]);

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    resetValidation();
  }, [resetValidation]);

  // Determine if upload should be allowed
  const canUpload = useMemo(() => {
    if (!selectedFile || !selectedDocumentType) return false;
    if (isValidating) return false;
    if (!validationResult) return false;
    if (validationResult.validationStatus === 'rejected' && !adminOverride) return false;
    return true;
  }, [selectedFile, selectedDocumentType, isValidating, validationResult, adminOverride]);

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocumentType) {
      toast({
        title: 'Error',
        description: 'Please select both a file and document type',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `lead-documents/${leadId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lead-documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        toast({
          title: 'Error',
          description: 'Failed to upload file to storage',
          variant: 'destructive',
        });
        return;
      }

      const { error: dbError } = await supabase
        .from('lead_documents')
        .insert({
          lead_id: leadId,
          document_type_id: selectedDocumentType,
          original_filename: selectedFile.name,
          stored_filename: fileName,
          file_path: filePath,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          uploaded_by: 'admin',
          verification_status: 'uploaded',
          ai_validation_status: validationResult?.validationStatus || 'pending',
          ai_detected_type: validationResult?.detectedType || null,
          ai_confidence_score: validationResult?.confidence || null,
          ai_quality_assessment: validationResult?.qualityAssessment || null,
          ai_validation_notes: adminOverride 
            ? `Admin override: ${validationResult?.notes}` 
            : validationResult?.notes || null,
          ai_validated_at: validationResult ? new Date().toISOString() : null,
        });

      if (dbError) {
        console.error('Database insert error:', dbError);
        await supabase.storage.from('lead-documents').remove([filePath]);
        toast({
          title: 'Error',
          description: 'Failed to save document record',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Document uploaded successfully',
        description: validationResult?.validationStatus === 'validated' 
          ? 'Document verified and ready for processing.'
          : 'Document uploaded and queued for review.',
      });

      onUploadComplete();
      onOpenChange(false);
    } catch (err) {
      console.error('Error in document upload:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Document for Student</DialogTitle>
            <DialogDescription>
              Upload a document on behalf of the student. AI will validate the document type and quality automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <DocumentTypeSelector
              documentTypes={documentTypes}
              selectedDocumentType={selectedDocumentType}
              onSelect={setSelectedDocumentType}
            />

            <FileDropZone
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              onFileSelect={processFile}
              onFileRemove={handleFileRemove}
              onPreviewClick={() => setShowPreview(true)}
            />

            <ValidationStatusDisplay
              isValidating={isValidating}
              validationResult={validationResult}
              hasFile={!!selectedFile}
              hasDocumentType={!!selectedDocumentType}
              adminOverride={adminOverride}
              onAdminOverride={() => setAdminOverride(true)}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleUpload}
              disabled={loading || !canUpload}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {loading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        previewUrl={previewUrl}
        fileName={selectedFile?.name}
      />
    </TooltipProvider>
  );
}
