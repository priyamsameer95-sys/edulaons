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
    <div className={cn('space-y-6', className)}>
      {/* Enhanced Document Type Info */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-semibold text-foreground">{documentType.name}</h4>
              {documentType.required && (
                <Badge variant="destructive" className="text-xs px-2 py-1">Required</Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>{documentType.description || 'Upload a clear, readable copy of this document.'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Accepted formats: <span className="font-medium">{getFileTypeDescription(documentType.accepted_formats)}</span></p>
              <p>• PDF files: {getFileSizeGuidance(documentType.max_file_size_pdf, 'pdf')}</p>
              <p>• Images: {getFileSizeGuidance(documentType.max_file_size_image, 'image')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer",
          "border-2 border-dashed rounded-2xl transition-all duration-300",
          "bg-gradient-to-br from-card/30 to-card/60 backdrop-blur-sm",
          "hover:from-card/50 hover:to-card/80 hover:border-primary/50 hover:shadow-lg",
          isDragActive 
            ? "border-primary bg-primary/10 shadow-xl shadow-primary/20 scale-[1.02]" 
            : "border-border/40",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        )}
      >
        <input {...getInputProps()} />
        
        <div className="p-12 text-center">
          <div className="mb-6">
            <div className={cn(
              "inline-flex items-center justify-center w-20 h-20 rounded-2xl transition-all duration-300",
              isDragActive 
                ? "bg-primary/20 text-primary scale-110" 
                : "bg-muted/40 text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary group-hover:scale-105"
            )}>
              <Upload className="h-10 w-10" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {isDragActive ? "Drop your file here" : "Upload your document"}
              </h3>
              <p className="text-base text-muted-foreground">
                {isDragActive 
                  ? "Release to upload your file" 
                  : "Drag & drop your file here, or click to browse"
                }
              </p>
            </div>
            
            {!isDragActive && (
              <Button
                type="button"
                size="lg"
                className={cn(
                  "px-8 py-4 text-base font-medium",
                  "bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl",
                  "transform transition-all duration-200 hover:scale-105",
                  disabled && "opacity-50 cursor-not-allowed hover:scale-100"
                )}
                disabled={disabled}
              >
                <Upload className="h-5 w-5 mr-2" />
                Choose File
              </Button>
            )}

            <div className="text-sm text-muted-foreground">
              <p className="font-medium">{getFileTypeDescription(documentType.accepted_formats)} up to {formatFileSize(Math.max(documentType.max_file_size_pdf, documentType.max_file_size_image))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Upload Queue */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-semibold text-foreground">Upload Status</h4>
            <Badge variant="outline" className="px-3 py-1 text-sm">
              {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "p-6 rounded-xl border-2 transition-all duration-300",
                  "bg-gradient-to-r backdrop-blur-sm shadow-lg",
                  file.status === 'completed' && "from-success/10 to-success/5 border-success/30 shadow-success/20",
                  file.status === 'error' && "from-destructive/10 to-destructive/5 border-destructive/30 shadow-destructive/20",
                  file.status === 'uploading' && "from-primary/10 to-primary/5 border-primary/30 shadow-primary/20"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl shadow-sm",
                      file.status === 'completed' && "bg-success/20",
                      file.status === 'error' && "bg-destructive/20",
                      file.status === 'uploading' && "bg-primary/20"
                    )}>
                      {file.file.type.startsWith('image/') ? (
                        <Image className={cn(
                          "h-6 w-6",
                          file.status === 'completed' && "text-success",
                          file.status === 'error' && "text-destructive",
                          file.status === 'uploading' && "text-primary"
                        )} />
                      ) : (
                        <File className={cn(
                          "h-6 w-6",
                          file.status === 'completed' && "text-success",
                          file.status === 'error' && "text-destructive",
                          file.status === 'uploading' && "text-primary"
                        )} />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground truncate max-w-64">
                        {file.file.name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{formatFileSize(file.file.size)}</span>
                        {file.status === 'completed' && (
                          <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                            ✓ Uploaded
                          </Badge>
                        )}
                        {file.status === 'error' && (
                          <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                            ✗ Failed
                          </Badge>
                        )}
                        {file.status === 'uploading' && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                            ↑ Uploading
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {file.status === 'completed' && (
                      <div className="p-2 rounded-full bg-success/20 shadow-sm">
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                    )}
                    {file.status === 'error' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryUpload(file.id)}
                          className="text-xs border-primary/30 hover:bg-primary/10"
                        >
                          Try Again
                        </Button>
                        <div className="p-2 rounded-full bg-destructive/20 shadow-sm">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        </div>
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Enhanced Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Uploading your document...</span>
                      <span className="text-primary font-semibold">{file.progress}%</span>
                    </div>
                    <Progress 
                      value={file.progress} 
                      className="h-3 bg-muted/30 rounded-full overflow-hidden shadow-inner"
                    />
                  </div>
                )}

                {/* Enhanced Error Message */}
                {file.status === 'error' && file.error && (
                  <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 shadow-sm">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive mb-1">Upload failed</p>
                        <p className="text-sm text-destructive/80">{file.error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {file.status === 'completed' && (
                  <div className="mt-4 p-4 rounded-xl bg-success/10 border border-success/20 shadow-sm">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div>
                        <p className="text-sm font-medium text-success">Document uploaded successfully!</p>
                        <p className="text-sm text-success/80">Your document is now ready for review by our team.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}