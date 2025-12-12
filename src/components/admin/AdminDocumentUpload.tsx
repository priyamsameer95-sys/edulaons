import { useState, useMemo, useEffect, useCallback } from 'react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Upload, Check, Loader2, CheckCircle, XCircle, AlertTriangle, HelpCircle, Eye, FileImage, FileText, X } from 'lucide-react';
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

// Document type help text mapping
const DOCUMENT_HELP_TEXT: Record<string, string> = {
  'PAN Copy': 'Upload a clear copy of your PAN card. Ensure the PAN number and photo are clearly visible, not blurred or cropped.',
  'Aadhaar Copy': 'Upload front and back of Aadhaar card. Ensure the Aadhaar number, photo, and address are readable.',
  'Passport': 'Upload the photo page of your passport. Ensure passport number, photo, and validity dates are visible.',
  'Photo': 'Upload a recent passport-size photo with white background. Face should be clearly visible.',
  'English Proficiency Test Result': 'Upload your IELTS/TOEFL/PTE score card. Ensure all scores and test date are visible.',
  'Offer Letter / Condition Letter': 'Upload the official offer or conditional offer letter from your university.',
  'Income Proof': 'Upload salary slips (last 3 months) or ITR for business income.',
  'Bank Statement': 'Upload last 6 months bank statement. Ensure account number and transactions are visible.',
  'Property Documents': 'Upload property valuation report, ownership documents, or encumbrance certificate.',
};

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_FORMATS = ['PDF', 'JPG', 'JPEG', 'PNG'];

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
  const [isDragging, setIsDragging] = useState(false);
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

  // Get selected document type info
  const selectedDocTypeInfo = useMemo(() => {
    if (!documentTypes || !selectedDocumentType) return null;
    return documentTypes.find(t => t.id === selectedDocumentType);
  }, [documentTypes, selectedDocumentType]);

  const selectedDocTypeName = selectedDocTypeInfo?.name || '';

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
      setIsDragging(false);
      resetValidation();
    }
  }, [open, resetValidation]);

  const validateFileSize = (file: File): string | null => {
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > MAX_FILE_SIZE_MB) {
      return `File size (${sizeMB.toFixed(2)} MB) exceeds maximum allowed (${MAX_FILE_SIZE_MB} MB)`;
    }
    return null;
  };

  const validateFileFormat = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toUpperCase();
    if (!ext || !ACCEPTED_FORMATS.includes(ext)) {
      return `Invalid format. Accepted: ${ACCEPTED_FORMATS.join(', ')}`;
    }
    return null;
  };

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

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

  // Get help text for selected document type
  const getHelpText = (docName: string) => {
    return DOCUMENT_HELP_TEXT[docName] || 'Upload a clear, legible copy of this document.';
  };

  // Format detailed validation feedback
  const getDetailedFeedback = () => {
    if (!validationResult) return null;
    const { redFlags, qualityAssessment, notes } = validationResult;
    
    const issues: string[] = [];
    
    if (redFlags?.includes('blurry') || qualityAssessment === 'poor') {
      issues.push('The document appears blurry. Please upload a clearer version.');
    }
    if (redFlags?.includes('edited')) {
      issues.push('This document appears to have been edited or modified.');
    }
    if (redFlags?.includes('cropped') || redFlags?.includes('incomplete')) {
      issues.push('Parts of the document appear to be cropped or missing.');
    }
    if (redFlags?.includes('low_quality')) {
      issues.push('Image quality is low. Try scanning or photographing in better lighting.');
    }
    if (notes?.toLowerCase().includes('pii') || notes?.toLowerCase().includes('blurred')) {
      issues.push('Personal information fields appear obscured or unreadable.');
    }
    
    return issues.length > 0 ? issues : null;
  };

  // Render validation status UI
  const renderValidationStatus = () => {
    if (!selectedFile || !selectedDocumentType) return null;

    if (isValidating) {
      return (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md mt-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">AI is validating your document...</span>
        </div>
      );
    }

    if (!validationResult) return null;

    const { validationStatus, detectedType, expectedType, confidence, qualityAssessment, notes, redFlags } = validationResult;
    const detailedIssues = getDetailedFeedback();

    if (validationStatus === 'validated') {
      return (
        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md mt-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Document verified</span>
            <span className="text-xs text-green-600 dark:text-green-500 ml-auto">
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
            ✓ Document type matches • ✓ Quality acceptable • Ready to upload
          </p>
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
          {detailedIssues && detailedIssues.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {detailedIssues.map((issue, i) => (
                <li key={i} className="text-xs text-amber-600 dark:text-amber-500 flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">{notes}</p>
          )}
          {redFlags && redFlags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {redFlags.map((flag, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded">
                  {flag.replace(/_/g, ' ')}
                </span>
              ))}
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
            <span className="text-sm font-medium text-red-700 dark:text-red-400">Wrong document type</span>
          </div>
          <div className="mt-2 text-xs text-red-600 dark:text-red-500 space-y-1">
            <p><strong>Expected:</strong> {expectedType}</p>
            <p><strong>Detected:</strong> {detectedType || 'Unknown document'}</p>
          </div>
          {detailedIssues && detailedIssues.length > 0 && (
            <ul className="mt-2 space-y-1">
              {detailedIssues.map((issue, i) => (
                <li key={i} className="text-xs text-red-600 dark:text-red-500 flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
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

  // Image preview modal - using Dialog for proper stacking context
  const renderPreviewModal = () => {
    if (!previewUrl) return null;
    
    return (
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0">
          <div className="p-4">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-sm font-medium truncate pr-8">
                {selectedFile?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center">
              <img 
                src={previewUrl} 
                alt="Document preview" 
                className="max-h-[70vh] max-w-full object-contain rounded"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
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
            {/* Document Type Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Select Document Type</Label>
                {selectedDocTypeInfo && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs">{getHelpText(selectedDocTypeInfo.name)}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <ScrollArea className="h-[180px] rounded-md border p-3">
                <div className="space-y-4">
                  {Object.entries(groupedDocumentTypes).map(([category, types]) => (
                    <div key={category}>
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                        {category}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {types.map((type) => (
                          <Tooltip key={type.id}>
                            <TooltipTrigger asChild>
                              <button
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
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p className="text-xs">{getHelpText(type.name)}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedDocTypeInfo && (
                <p className="text-xs text-muted-foreground">{getHelpText(selectedDocTypeInfo.name)}</p>
              )}
            </div>

            {/* File Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File</Label>
              
              {/* File format and size info */}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Formats: {ACCEPTED_FORMATS.join(', ')}
                </span>
                <span className="flex items-center gap-1">
                  <FileImage className="h-3 w-3" />
                  Max size: {MAX_FILE_SIZE_MB} MB
                </span>
              </div>

              {/* Drag and drop zone */}
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-border",
                  "hover:border-primary/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      {selectedFile.type.startsWith('image/') ? (
                        <FileImage className="h-6 w-6 text-primary" />
                      ) : (
                        <FileText className="h-6 w-6 text-primary" />
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium truncate max-w-[250px]">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {previewUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPreview(true)}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="text-xs"
                      >
                        Change File
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          resetValidation();
                        }}
                        className="text-xs text-muted-foreground"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className={cn(
                      "h-8 w-8 mx-auto mb-2",
                      isDragging ? "text-primary" : "text-muted-foreground"
                    )} />
                    <p className="text-sm text-muted-foreground">
                      {isDragging ? 'Drop your file here' : 'Drag & drop your file here, or'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="mt-2"
                    >
                      Browse Files
                    </Button>
                  </div>
                )}
              </div>

              {renderValidationStatus()}
            </div>
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
      
      {renderPreviewModal()}
    </TooltipProvider>
  );
}