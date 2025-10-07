import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, Image, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  DOCUMENT_ERROR_MESSAGES, 
  formatFileSize, 
  getFileTypeDescription, 
  getFileSizeGuidance,
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
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

interface EnhancedDocumentUploadProps {
  leadId?: string;
  documentType: DocumentType;
  onUploadSuccess: (document: any) => void;
  onUploadError: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function EnhancedDocumentUpload({ 
  leadId, 
  documentType, 
  onUploadSuccess, 
  onUploadError,
  className,
  disabled = false
}: EnhancedDocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const validateFile = useCallback((file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    // Check for suspicious or potentially harmful file extensions
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

  const uploadFile = useCallback(async (file: File, fileId: string) => {
    try {
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
            upload_status: 'uploaded'
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          
          // Parse specific database errors
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
      
      toast({
        title: '✅ Upload successful!',
        description: `${file.name} has been uploaded and is ready for review.`
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      // Parse and display user-friendly error messages
      let friendlyErrorMessage = DOCUMENT_ERROR_MESSAGES.UPLOAD_FAILED;
      
      if (error instanceof Error) {
        friendlyErrorMessage = error.message;
        
        // Add helpful context for common errors
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
  }, [leadId, documentType, onUploadSuccess, onUploadError]);

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
        status: 'uploading'
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      uploadFile(file, fileId);
    });
  }, [validateFile, uploadFile]);

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryUpload = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'uploading', progress: 0, error: undefined } : f
      ));
      uploadFile(file.file, fileId);
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
            <div
              key={file.id}
              className={cn(
                "flex items-center justify-between gap-3 p-2 rounded text-xs",
                file.status === 'completed' && "bg-success/10 text-success",
                file.status === 'error' && "bg-destructive/10 text-destructive",
                file.status === 'uploading' && "bg-primary/10 text-primary"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {file.status === 'completed' && <CheckCircle className="h-3 w-3 flex-shrink-0" />}
                {file.status === 'error' && <AlertCircle className="h-3 w-3 flex-shrink-0" />}
                {file.status === 'uploading' && (
                  <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
                <span className="truncate">{file.file.name}</span>
                {file.status === 'uploading' && <span className="flex-shrink-0">({file.progress}%)</span>}
              </div>
              
              {file.status === 'error' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => retryUpload(file.id)}
                  className="h-6 px-2 text-xs"
                >
                  Retry
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}