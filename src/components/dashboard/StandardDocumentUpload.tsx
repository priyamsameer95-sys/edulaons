import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, CheckCircle, AlertTriangle, FileText, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UploadConfirmationDialog } from './UploadConfirmationDialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface UploadFile {
  id: string;
  file: File;
  status: 'idle' | 'validating' | 'uploading' | 'processing' | 'complete' | 'error' | 'cancelled';
  progress: number;
  error?: string;
  retryCount: number;
}

interface StandardDocumentUploadProps {
  leadId: string;
  documentTypeId: string;
  documentTypeName: string;
  maxFileSize?: number;
  acceptedFormats?: string[];
  onUploadSuccess?: () => void;
  existingDocument?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  allowMultiple?: boolean;
}

export const StandardDocumentUpload = ({
  leadId,
  documentTypeId,
  documentTypeName,
  maxFileSize = 10 * 1024 * 1024, // 10MB as per requirements
  acceptedFormats = ['pdf', 'docx', 'jpg', 'png'],
  onUploadSuccess,
  existingDocument = false,
  variant = 'default',
  size = 'sm',
  allowMultiple = true
}: StandardDocumentUploadProps) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationType, setConfirmationType] = useState<'replace' | 'large' | 'multiple'>('replace');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const generateFileId = () => Math.random().toString(36).substring(2, 15);

  const validateFile = useCallback((file: File): string | null => {
    // File size validation
    if (file.size > maxFileSize) {
      return `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`;
    }

    // File type validation
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      return `Please upload files in these formats: ${acceptedFormats.join(', ')}`;
    }

    // Check for potential security issues
    const suspiciousExtensions = ['exe', 'bat', 'cmd', 'com', 'scr', 'vbs', 'js'];
    if (suspiciousExtensions.includes(fileExtension)) {
      return 'File type not allowed for security reasons';
    }

    return null;
  }, [maxFileSize, acceptedFormats]);

  const checkForDuplicates = useCallback((files: File[]): boolean => {
    const existingNames = uploadFiles.map(f => f.file.name);
    return files.some(file => existingNames.includes(file.name));
  }, [uploadFiles]);

  const handleFileSelection = useCallback((files: File[]) => {
    // Check if replacing existing document
    if (existingDocument && files.length > 0) {
      setPendingFiles(files);
      setConfirmationType('replace');
      setShowConfirmation(true);
      return;
    }

    // Check for large files (>5MB)
    const hasLargeFiles = files.some(file => file.size > 5 * 1024 * 1024);
    if (hasLargeFiles) {
      setPendingFiles(files);
      setConfirmationType('large');
      setShowConfirmation(true);
      return;
    }

    // Check for multiple files
    if (files.length > 1 && !allowMultiple) {
      toast({
        variant: 'destructive',
        title: 'Multiple files not allowed',
        description: 'Please select only one file at a time for this document type.'
      });
      return;
    }

    if (files.length > 3) {
      setPendingFiles(files);
      setConfirmationType('multiple');
      setShowConfirmation(true);
      return;
    }

    processFiles(files);
  }, [existingDocument, allowMultiple, toast]);

  const processFiles = useCallback((files: File[]) => {
    const validFiles: UploadFile[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          id: generateFileId(),
          file,
          status: 'idle',
          progress: 0,
          retryCount: 0
        });
      }
    });

    if (errors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Validation failed',
        description: errors.join('\n')
      });
    }

    if (validFiles.length > 0) {
      // Check for duplicates
      if (checkForDuplicates(validFiles.map(f => f.file))) {
        toast({
          variant: 'destructive',
          title: 'Duplicate files detected',
          description: 'Some files have the same name as existing uploads.'
        });
        return;
      }

      setUploadFiles(prev => [...prev, ...validFiles]);
      validFiles.forEach(uploadFile => uploadSingleFile(uploadFile));
    }
  }, [validateFile, checkForDuplicates, toast]);

  const uploadSingleFile = async (uploadFile: UploadFile) => {
    const updateFileStatus = (id: string, updates: Partial<UploadFile>) => {
      setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    try {
      updateFileStatus(uploadFile.id, { status: 'validating' });
      
      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateFileStatus(uploadFile.id, { status: 'uploading', progress: 5 });

      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('lead_id', leadId);
      formData.append('document_type_id', documentTypeId);

      // Create smooth progress tracking
      let currentProgress = 5;
      const progressInterval = setInterval(() => {
        if (currentProgress < 85) {
          currentProgress += Math.random() * 10;
          updateFileStatus(uploadFile.id, { 
            progress: Math.min(currentProgress, 85)
          });
        }
      }, 300);

      const { data, error } = await supabase.functions.invoke('upload-document', {
        body: formData,
      });

      clearInterval(progressInterval);

      if (error) {
        // Try to parse error response body for detailed message
        let errorMessage = 'Upload failed. Please try again.';
        
        if (error.message?.includes('non-2xx')) {
          // Edge function returned an error response
          try {
            const errorData = data as any;
            if (errorData?.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = 'Connection lost. Check your internet and try again.';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'Upload is taking too long. Try with a smaller file.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      // Check if the response indicates an error
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error((data as any).error);
      }

      clearInterval(progressInterval);

      if (error) {
        // Extract user-friendly error message from edge function response
        const errorMessage = error.message || 'Upload failed. Please try again.';
        throw new Error(errorMessage);
      }

      // Check if the response contains an error
      if (data && data.error) {
        throw new Error(data.error);
      }

      updateFileStatus(uploadFile.id, { 
        status: 'processing', 
        progress: 90 
      });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateFileStatus(uploadFile.id, { 
        status: 'complete', 
        progress: 100 
      });

      toast({
        title: 'Upload successful',
        description: `${documentTypeName} uploaded successfully`
      });

      // Auto-remove completed files after 3 seconds
      setTimeout(() => {
        setUploadFiles(prev => prev.filter(f => f.id !== uploadFile.id));
        onUploadSuccess?.();
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      
      // Parse and display user-friendly error messages
      let userFriendlyMessage = 'Upload failed. Please try again.';
      
      if (error instanceof Error) {
        // Use the error message from the edge function
        userFriendlyMessage = error.message;
        
        // Add helpful context for common errors
        if (error.message.includes('network') || error.message.includes('fetch')) {
          userFriendlyMessage = 'Connection lost. Check your internet and try again.';
        } else if (error.message.includes('timeout')) {
          userFriendlyMessage = 'Upload timed out. Try a smaller file or better connection.';
        } else if (error.message.includes('lead no longer exists')) {
          userFriendlyMessage = 'This lead was deleted. Please refresh the page.';
        }
      }
      
      updateFileStatus(uploadFile.id, { 
        status: 'error', 
        error: userFriendlyMessage,
        progress: 0
      });
      
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: userFriendlyMessage
      });
    }
  };

  const retryUpload = useCallback((fileId: string) => {
    const file = uploadFiles.find(f => f.id === fileId);
    if (file && file.retryCount < 3) {
      const updatedFile = { 
        ...file, 
        status: 'idle' as const, 
        progress: 0, 
        error: undefined,
        retryCount: file.retryCount + 1
      };
      setUploadFiles(prev => prev.map(f => f.id === fileId ? updatedFile : f));
      uploadSingleFile(updatedFile);
    } else {
      toast({
        variant: 'destructive',
        title: 'Max retries exceeded',
        description: 'Please remove and re-add the file to try again.'
      });
    }
  }, [uploadFiles, toast]);

  const cancelUpload = useCallback((fileId: string) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'cancelled' as const } : f
    ));
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isMobile) {
      setIsDragOver(true);
    }
  }, [isMobile]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (isMobile) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files);
    }
  }, [isMobile, handleFileSelection]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelection(files);
    }
    // Reset input value
    e.target.value = '';
  }, [handleFileSelection]);

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'validating':
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'complete':
        return 'text-success';
      case 'error':
        return 'text-destructive';
      case 'cancelled':
        return 'text-muted-foreground';
      default:
        return 'text-primary';
    }
  };

  const isUploading = uploadFiles.some(f => 
    ['validating', 'uploading', 'processing'].includes(f.status)
  );

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          multiple={allowMultiple}
          accept={acceptedFormats.map(format => `.${format}`).join(',')}
          onChange={handleFileInput}
          disabled={isUploading}
          className="hidden"
        />
        
        {!isMobile && uploadFiles.length === 0 ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-colors duration-200 hover:bg-accent/50
              ${isDragOver ? 'border-primary bg-accent/50' : 'border-border'}
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptedFormats.map(f => f.toUpperCase()).join(', ')} • Max {Math.round(maxFileSize / (1024 * 1024))}MB
            </p>
          </div>
        ) : (
          <Button
            variant={variant}
            size={size}
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {existingDocument ? `Replace ${documentTypeName}` : `Upload ${documentTypeName}`}
          </Button>
        )}
      </div>

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          {uploadFiles.map((uploadFile) => (
            <div
              key={uploadFile.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center space-x-3 flex-1">
                {getStatusIcon(uploadFile.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadFile.file.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                    <Badge variant="outline" className={getStatusColor(uploadFile.status)}>
                      {uploadFile.status}
                    </Badge>
                  </div>
                   {uploadFile.status === 'uploading' && (
                    <div className="space-y-1 mt-2">
                      <Progress value={uploadFile.progress} className="w-full h-2" />
                      <p className="text-xs text-muted-foreground">{uploadFile.progress}% uploaded</p>
                    </div>
                  )}
                  {uploadFile.status === 'processing' && (
                    <div className="space-y-1 mt-2">
                      <Progress value={uploadFile.progress} className="w-full h-2" />
                      <p className="text-xs text-muted-foreground">Processing document...</p>
                    </div>
                  )}
                  {uploadFile.error && (
                    <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                      <p className="text-xs text-destructive font-medium">{uploadFile.error}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {uploadFile.status === 'error' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => retryUpload(uploadFile.id)}
                    disabled={uploadFile.retryCount >= 3}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(uploadFile.id)}
                  disabled={['uploading', 'processing'].includes(uploadFile.status)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <UploadConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        type={confirmationType}
        fileCount={pendingFiles.length}
        documentName={documentTypeName}
        onConfirm={() => {
          processFiles(pendingFiles);
          setShowConfirmation(false);
          setPendingFiles([]);
        }}
        onCancel={() => {
          setShowConfirmation(false);
          setPendingFiles([]);
        }}
      />
    </div>
  );
};