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
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{documentType.name}</h4>
          {documentType.required && (
            <Badge variant="secondary" className="text-xs">Required</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{documentType.description}</p>
        <p className="text-xs text-muted-foreground">
          Max size: {(documentType.max_file_size_pdf / (1024 * 1024)).toFixed(1)}MB (PDF), {' '}
          {(documentType.max_file_size_image / (1024 * 1024)).toFixed(1)}MB (Images)
        </p>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          'hover:border-primary/50 hover:bg-accent/5',
          isDragActive && 'border-primary bg-accent/10',
          disabled && 'opacity-50 cursor-not-allowed',
          'border-border'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm">
            {isDragActive ? (
              <p className="text-primary">Drop the file here...</p>
            ) : (
              <div>
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {documentType.accepted_formats.map(f => f.toUpperCase()).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          {uploadedFiles.map((uploadedFile) => (
            <div
              key={uploadedFile.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-card"
            >
              <div className="flex-shrink-0">
                {uploadedFile.file.type.startsWith('image/') ? (
                  <Image className="h-5 w-5 text-blue-500" />
                ) : (
                  <File className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadedFile.file.size)}
                </p>
                
                {uploadedFile.status === 'uploading' && (
                  <Progress value={uploadedFile.progress} className="mt-2 h-1" />
                )}
                
                {uploadedFile.status === 'error' && (
                  <p className="text-xs text-destructive mt-1">{uploadedFile.error}</p>
                )}
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                {uploadedFile.status === 'completed' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {uploadedFile.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(uploadedFile.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}