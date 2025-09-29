import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DocumentUploadButtonProps {
  leadId: string;
  documentTypeId: string;
  documentTypeName: string;
  maxFileSize?: number;
  acceptedFormats?: string[];
  onUploadSuccess?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const DocumentUploadButton = ({
  leadId,
  documentTypeId,
  documentTypeName,
  maxFileSize = 20 * 1024 * 1024, // 20MB default
  acceptedFormats = ['pdf', 'jpg', 'jpeg', 'png'],
  onUploadSuccess,
  variant = 'default',
  size = 'sm'
}: DocumentUploadButtonProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`
      });
      return;
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: `Please upload files in these formats: ${acceptedFormats.join(', ')}`
      });
      return;
    }

    setUploading(true);
    setUploadComplete(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lead_id', leadId);
      formData.append('document_type_id', documentTypeId);

      const { data, error } = await supabase.functions.invoke('upload-document', {
        body: formData,
      });

      if (error) throw error;

      setUploadComplete(true);
      toast({
        title: 'Upload successful',
        description: `${documentTypeName} uploaded successfully`
      });

      // Auto-hide success state after 2 seconds
      setTimeout(() => {
        setUploadComplete(false);
        onUploadSuccess?.();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: `Failed to upload ${documentTypeName}. Please try again.`
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        id={`upload-${documentTypeId}`}
        accept={acceptedFormats.map(format => `.${format}`).join(',')}
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
      />
      <Button
        variant={uploadComplete ? 'default' : variant}
        size={size}
        disabled={uploading}
        className={`${uploadComplete ? 'bg-success text-success-foreground' : ''}`}
        onClick={() => document.getElementById(`upload-${documentTypeId}`)?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : uploadComplete ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Uploaded!
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload {documentTypeName}
          </>
        )}
      </Button>
    </div>
  );
};