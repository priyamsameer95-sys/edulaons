import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle, Shield, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useDocumentValidation, ValidationResult } from '@/hooks/useDocumentValidation';
import { PartnerValidationFeedback } from '@/components/partner/PartnerValidationFeedback';
import { 
  DOCUMENT_ERROR_MESSAGES, 
  transformBackendError 
} from '@/utils/errorMessages';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  required: boolean;
  max_file_size_pdf: number;
  max_file_size_image: number;
  accepted_formats: string[];
  description: string;
}

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'validating' | 'uploading' | 'completed' | 'error' | 'rejected';
  error?: string;
  url?: string;
  validationResult?: ValidationResult;
}

interface EnhancedDocumentUploadProps {
  leadId?: string;
  documentType: DocumentType;
  onUploadSuccess: (document: any) => void;
  onUploadError: (error: string) => void;
  className?: string;
  disabled?: boolean;
  enableAIValidation?: boolean;
}

export function EnhancedDocumentUpload({ 
  leadId, 
  documentType, 
  onUploadSuccess, 
  onUploadError,
  className,
  disabled = false,
  enableAIValidation = true
}: EnhancedDocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { validateDocument } = useDocumentValidation();

  const validateFile = useCallback((file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    const suspiciousExtensions = ['exe', 'bat', 'com', 'scr', 'vbs', 'js', 'jar'];
    if (suspiciousExtensions.includes(fileExtension || '')) {
      return 'This file type is not allowed for security reasons. Please upload PDF or image files only.';
    }

    if (!fileExtension || !documentType.accepted_formats.includes(fileExtension)) {
      return DOCUMENT_ERROR_MESSAGES.UNSUPPORTED_FORMAT(documentType.accepted_formats);
    }

    const isPdf = fileExtension === 'pdf';
    const maxSize = isPdf ? documentType.max_file_size_pdf : documentType.max_file_size_image;
    
    if (file.size > maxSize) {
      return DOCUMENT_ERROR_MESSAGES.FILE_TOO_LARGE(
        Math.round(maxSize / (1024 * 1024)),
        isPdf ? 'PDF' : 'Image'
      );
    }

    return null;
  }, [documentType]);

  const uploadFile = useCallback(async (file: File, fileId: string, skipValidation = false) => {
    let currentValidationResult: ValidationResult | null = null;
    
    try {
      // Step 1: AI Validation (for images only, if enabled)
      if (enableAIValidation && !skipValidation && file.type.startsWith('image/')) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'validating' as const, progress: 0 } : f
        ));

        const validationResult = await validateDocument(file, documentType.name);
        currentValidationResult = validationResult;
        
        if (validationResult) {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, validationResult } : f
          ));

          // Handle rejected documents
          if (validationResult.validationStatus === 'rejected') {
            const errorMessage = `Wrong document type: Expected ${documentType.name} but detected ${validationResult.detectedType}. ${validationResult.notes}`;
            
            setUploadedFiles(prev => prev.map(f => 
              f.id === fileId ? { 
                ...f, 
                status: 'rejected' as const,
                error: errorMessage,
                validationResult
              } : f
            ));

            toast({
              variant: 'destructive',
              title: 'Document Rejected',
              description: errorMessage
            });

            onUploadError(errorMessage);
            return;
          }

          // Show warning for manual review items but continue upload
          if (validationResult.validationStatus === 'manual_review') {
            toast({
              title: 'Document needs review',
              description: `${validationResult.notes || 'This document will be manually verified by our team.'}`,
            });
          }
        }
      }

      // Step 2: Proceed with upload
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'uploading' as const } : f
      ));

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const storedFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = leadId ? `${leadId}/${storedFilename}` : `temp/${storedFilename}`;

      // Simulate progress updates for better UX
      const progressUpdates = [10, 25, 40, 60, 80];
      let currentProgress = 0;

      const progressInterval = setInterval(() => {
        if (currentProgress < progressUpdates.length) {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress: progressUpdates[currentProgress] } : f
          ));
          currentProgress++;
        }
      }, 200);

      const { data, error } = await supabase.storage
        .from('lead-documents')
        .upload(filePath, file);

      clearInterval(progressInterval);

      if (error) {
        console.error('Storage upload error:', error);
        const friendlyMessage = transformBackendError(error);
        throw new Error(friendlyMessage);
      }

      // Final progress update
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 90 } : f
      ));

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('lead-documents')
        .getPublicUrl(filePath);

      // Save to database if leadId is provided
      let documentRecord = null;
      if (leadId) {
        const { data: docData, error: dbError } = await supabase
          .from('lead_documents')
          .insert({
            lead_id: leadId,
            document_type_id: documentType.id,
            original_filename: file.name,
            stored_filename: storedFilename,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            upload_status: 'uploaded',
            ai_validation_status: currentValidationResult?.validationStatus || 'pending',
            ai_detected_type: currentValidationResult?.detectedType || null,
            ai_confidence_score: currentValidationResult?.confidence || null,
            ai_quality_assessment: currentValidationResult?.qualityAssessment || null,
            ai_validation_notes: currentValidationResult?.notes || null,
            ai_validated_at: currentValidationResult ? new Date().toISOString() : null
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          
          let errorMessage = transformBackendError(dbError);
          
          if (dbError.code === '23503') {
            errorMessage = 'This lead no longer exists. Please refresh the page and try again.';
          } else if (dbError.code === '23505') {
            errorMessage = 'A document with this name already exists. Please use a different filename.';
          }
          
          throw new Error(errorMessage);
        }
        documentRecord = docData;
      }

      // Update file status to completed
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          progress: 100, 
          status: 'completed' as const,
          url: publicUrl 
        } : f
      ));

      onUploadSuccess(documentRecord || { file, url: publicUrl, filePath });
      
      const isValidated = currentValidationResult?.validationStatus === 'validated';
      
      toast({
        title: isValidated ? '✅ Verified & Uploaded!' : '✅ Upload successful!',
        description: isValidated 
          ? `${file.name} has been verified as ${documentType.name} and uploaded.`
          : `${file.name} has been uploaded and is ready for review.`
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      let friendlyErrorMessage = DOCUMENT_ERROR_MESSAGES.UPLOAD_FAILED;
      
      if (error instanceof Error) {
        friendlyErrorMessage = error.message;
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
          friendlyErrorMessage = DOCUMENT_ERROR_MESSAGES.NETWORK_ERROR;
        } else if (error.message.includes('timeout')) {
          friendlyErrorMessage = DOCUMENT_ERROR_MESSAGES.TIMEOUT_ERROR;
        } else if (error.message.includes('lead no longer exists')) {
          friendlyErrorMessage = DOCUMENT_ERROR_MESSAGES.LEAD_NOT_FOUND;
        } else if (error.message.includes('corrupted') || error.message.includes('damaged')) {
          friendlyErrorMessage = DOCUMENT_ERROR_MESSAGES.FILE_CORRUPTED;
        }
      }
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          progress: 0, 
          status: 'error' as const,
          error: friendlyErrorMessage 
        } : f
      ));

      onUploadError(friendlyErrorMessage);
      
      toast({
        variant: 'destructive',
        title: '❌ Upload failed',
        description: friendlyErrorMessage
      });
    }
  }, [leadId, documentType, onUploadSuccess, onUploadError, enableAIValidation, validateDocument]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const validationError = validateFile(file);
      
      if (validationError) {
        toast({
          variant: 'destructive',
          title: '⚠️ File not accepted',
          description: validationError
        });
        return;
      }

      const fileId = Math.random().toString(36).substring(2);
      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        progress: 0,
        status: 'validating'
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      uploadFile(file, fileId);
    });
  }, [validateFile, uploadFile]);

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryUpload = (fileId: string, skipValidation = false) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'validating', progress: 0, error: undefined, validationResult: undefined } : f
      ));
      uploadFile(file.file, fileId, skipValidation);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: documentType.accepted_formats.reduce((acc, format) => {
      acc[format === 'pdf' ? 'application/pdf' : `image/${format}`] = [`.${format}`];
      return acc;
    }, {} as Record<string, string[]>),
    disabled,
    multiple: false
  });

  const getStatusIcon = (file: UploadedFile) => {
    switch (file.status) {
      case 'validating':
        return <Shield className="h-3 w-3 flex-shrink-0 animate-pulse" />;
      case 'completed':
        return file.validationResult?.validationStatus === 'validated' 
          ? <ShieldCheck className="h-3 w-3 flex-shrink-0" />
          : <CheckCircle className="h-3 w-3 flex-shrink-0" />;
      case 'rejected':
        return <ShieldAlert className="h-3 w-3 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 flex-shrink-0" />;
      case 'uploading':
        return <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case 'validating':
        return 'Verifying...';
      case 'uploading':
        return `Uploading (${file.progress}%)`;
      case 'completed':
        return file.validationResult?.validationStatus === 'validated' 
          ? 'Verified' 
          : file.validationResult?.validationStatus === 'manual_review'
          ? 'Uploaded (pending review)'
          : 'Uploaded';
      case 'rejected':
        return 'Rejected';
      case 'error':
        return 'Failed';
      default:
        return '';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Compact Upload Button */}
      <div
        {...getRootProps()}
        className={cn(
          "inline-block cursor-pointer transition-all",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <input {...getInputProps()} />
        
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            "gap-2 border-border hover:border-primary hover:bg-primary/5",
            isDragActive && "border-primary bg-primary/10"
          )}
          disabled={disabled}
        >
          <Upload className="h-4 w-4" />
          {isDragActive ? "Drop file" : "Choose File"}
        </Button>
      </div>

      {/* Compact Upload Status */}
      {uploadedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {uploadedFiles.map((file) => (
            <div key={file.id}>
              <div
                className={cn(
                  "flex items-center justify-between gap-3 p-2 rounded text-xs",
                  file.status === 'completed' && "bg-success/10 text-success",
                  file.status === 'rejected' && "bg-destructive/10 text-destructive",
                  file.status === 'error' && "bg-destructive/10 text-destructive",
                  file.status === 'validating' && "bg-primary/10 text-primary",
                  file.status === 'uploading' && "bg-primary/10 text-primary"
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getStatusIcon(file)}
                  <span className="truncate">{file.file.name}</span>
                  <span className="flex-shrink-0 text-muted-foreground">
                    {getStatusText(file)}
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Detailed AI Validation Feedback */}
              {(file.status === 'validating' || file.validationResult) && (
                <PartnerValidationFeedback
                  isValidating={file.status === 'validating'}
                  validationResult={file.validationResult || null}
                  hasFile={true}
                  showUploadAnyway={file.status === 'rejected'}
                  onUploadAnyway={() => retryUpload(file.id, true)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
