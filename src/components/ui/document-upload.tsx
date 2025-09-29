import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

interface DocumentUploadProps {
  leadId?: string;
  documentType: DocumentType;
  onUploadSuccess: (document: any) => void;
  onUploadError: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function DocumentUpload({ 
  leadId, 
  documentType, 
  onUploadSuccess, 
  onUploadError,
  className,
  disabled = false
}: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const validateFile = useCallback((file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !documentType.accepted_formats.includes(fileExtension)) {
      return `File type not supported. Accepted formats: ${documentType.accepted_formats.join(', ')}`;
    }

    const isPdf = fileExtension === 'pdf';
    const maxSize = isPdf ? documentType.max_file_size_pdf : documentType.max_file_size_image;
    
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File too large. Maximum size: ${maxSizeMB}MB for ${isPdf ? 'PDF' : 'images'}`;
    }

    return null;
  }, [documentType]);

  const uploadFile = useCallback(async (file: File, fileId: string) => {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const storedFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = leadId ? `${leadId}/${storedFilename}` : `temp/${storedFilename}`;

      // Update progress
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 50 } : f
      ));

      const { data, error } = await supabase.storage
        .from('lead-documents')
        .upload(filePath, file);

      if (error) throw error;

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

        if (dbError) throw dbError;
        documentRecord = docData;
      }

      // Update file status
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
        title: 'Upload successful',
        description: `${file.name} has been uploaded successfully.`
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          progress: 0, 
          status: 'error' as const,
          error: errorMessage 
        } : f
      ));

      onUploadError(errorMessage);
      
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: errorMessage
      });
    }
  }, [leadId, documentType, onUploadSuccess, onUploadError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const validationError = validateFile(file);
      
      if (validationError) {
        toast({
          variant: 'destructive',
          title: 'Invalid file',
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: documentType.accepted_formats.reduce((acc, format) => {
      acc[format === 'pdf' ? 'application/pdf' : `image/${format}`] = [`.${format}`];
      return acc;
    }, {} as Record<string, string[]>),
    disabled,
    multiple: false
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Document Type Info */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Clear copy of {documentType.name.toLowerCase()}</div>
            <div className="text-sm text-muted-foreground">
              Max size: {formatFileSize(documentType.max_file_size_pdf)} (PDF), {formatFileSize(documentType.max_file_size_image)} (Images)
            </div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "relative group",
          "border-2 border-dashed rounded-2xl transition-all duration-300",
          "bg-card/50 backdrop-blur-sm",
          "hover:bg-card/70 hover:border-primary/40",
          isDragActive 
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
            : "border-border/30",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        )}
      >
        <input {...getInputProps()} />
        
        <div className="p-8 text-center">
          <div className="mb-6">
            <div className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300",
              isDragActive 
                ? "bg-primary/20 text-primary" 
                : "bg-muted/40 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
              <Upload className="h-8 w-8" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {isDragActive ? "Drop your files here" : "Click to upload or drag and drop"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {documentType.accepted_formats.join(", ").toUpperCase()}
              </p>
            </div>
            
            {!isDragActive && (
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-3 rounded-xl",
                  "text-sm font-medium transition-all duration-200",
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary/90 hover:shadow-lg",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                disabled={disabled}
              >
                <Upload className="h-4 w-4" />
                Select Files
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Queue */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">Upload Progress</h4>
            <Badge variant="outline" className="px-2 py-1">
              {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-200",
                  "bg-card/50 backdrop-blur-sm",
                  file.status === 'completed' && "border-success/30 bg-success/5",
                  file.status === 'error' && "border-destructive/30 bg-destructive/5",
                  file.status === 'uploading' && "border-primary/30 bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      file.status === 'completed' && "bg-success/20",
                      file.status === 'error' && "bg-destructive/20",
                      file.status === 'uploading' && "bg-primary/20"
                    )}>
                      {file.file.type.startsWith('image/') ? (
                        <Image className={cn(
                          "h-4 w-4",
                          file.status === 'completed' && "text-success",
                          file.status === 'error' && "text-destructive",
                          file.status === 'uploading' && "text-primary"
                        )} />
                      ) : (
                        <File className={cn(
                          "h-4 w-4",
                          file.status === 'completed' && "text-success",
                          file.status === 'error' && "text-destructive",
                          file.status === 'uploading' && "text-primary"
                        )} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-foreground truncate max-w-48">
                        {file.file.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(file.file.size)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.status === 'completed' && (
                      <div className="p-1 rounded-full bg-success/20">
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                    )}
                    {file.status === 'error' && (
                      <div className="p-1 rounded-full bg-destructive/20">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uploading...</span>
                      <span className="text-primary font-medium">{file.progress}%</span>
                    </div>
                    <Progress 
                      value={file.progress} 
                      className="h-2 bg-muted/30"
                    />
                  </div>
                )}

                {/* Error Message */}
                {file.status === 'error' && file.error && (
                  <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{file.error}</p>
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