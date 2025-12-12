import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Check, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const { documentTypes } = useDocumentTypes();
  const { toast } = useToast();
  const { validateDocument, isValidating, validationResult, resetValidation } = useDocumentValidation();

  // Group document types by category
  const groupedDocumentTypes = useMemo(() => {
    if (!documentTypes) return {};
    return documentTypes.reduce((acc, type) => {
      const category = type.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(type);
      return acc;
    }, {} as Record<string, typeof documentTypes>);
  }, [documentTypes]);

  // Get selected document type name for validation
  const selectedDocTypeName = useMemo(() => {
    if (!documentTypes || !selectedDocumentType) return '';
    return documentTypes.find(t => t.id === selectedDocumentType)?.name || '';
  }, [documentTypes, selectedDocumentType]);

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
      resetValidation();
    }
  }, [open, resetValidation]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

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

      // Include AI validation data in the database record
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
        title: 'Success',
        description: 'Document uploaded successfully',
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

  // Render validation status UI
  const renderValidationStatus = () => {
    if (!selectedFile || !selectedDocumentType) return null;

    if (isValidating) {
      return (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md mt-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Validating document...</span>
        </div>
      );
    }

    if (!validationResult) return null;

    const { validationStatus, detectedType, expectedType, confidence, qualityAssessment, notes, redFlags } = validationResult;

    if (validationStatus === 'validated') {
      return (
        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md mt-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Document verified</span>
            <span className="text-xs text-green-600 dark:text-green-500">({Math.round(confidence * 100)}% confidence)</span>
          </div>
          <div className="text-xs text-green-600 dark:text-green-500 mt-1">
            Detected: {detectedType} • Quality: {qualityAssessment}
          </div>
        </div>
      );
    }

    if (validationStatus === 'manual_review') {
      return (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md mt-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Needs manual review</span>
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">
            {notes}
          </div>
          {redFlags && redFlags.length > 0 && (
            <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              Flags: {redFlags.join(', ')}
            </div>
          )}
        </div>
      );
    }

    if (validationStatus === 'rejected') {
      return (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md mt-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">Wrong document detected</span>
          </div>
          <div className="text-xs text-red-600 dark:text-red-500 mt-1">
            Expected: <strong>{expectedType}</strong> • Detected: <strong>{detectedType}</strong>
          </div>
          {notes && (
            <div className="text-xs text-red-600 dark:text-red-500 mt-1">{notes}</div>
          )}
          {!adminOverride && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdminOverride(true)}
              className="mt-2 text-xs h-7 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              Upload Anyway (Admin Override)
            </Button>
          )}
          {adminOverride && (
            <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              Admin override enabled - document will be uploaded
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Upload Document for Student</DialogTitle>
          <DialogDescription>
            Upload a document on behalf of the student. AI will validate the document type automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Document Type</Label>
            <ScrollArea className="h-[200px] rounded-md border p-3">
              <div className="space-y-4">
                {Object.entries(groupedDocumentTypes).map(([category, types]) => (
                  <div key={category}>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                      {category}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {types.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setSelectedDocumentType(type.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-md border p-2 text-left text-sm transition-colors hover:bg-muted",
                            selectedDocumentType === type.id
                              ? "border-primary bg-primary/10"
                              : "border-border"
                          )}
                        >
                          {selectedDocumentType === type.id && (
                            <Check className="h-3 w-3 text-primary flex-shrink-0" />
                          )}
                          <span className={cn(
                            "truncate",
                            selectedDocumentType !== type.id && "ml-5"
                          )}>
                            {type.name}
                            {type.required && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Select File</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="mt-2"
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to select a file
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="mt-2"
                  >
                    Select File
                  </Button>
                </div>
              )}
            </div>

            {renderValidationStatus()}
          </div>
        </div>

        <DialogFooter>
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
  );
}