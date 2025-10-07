import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LenderLogoUploadProps {
  currentLogoUrl?: string;
  onLogoChange: (url: string) => void;
  lenderCode: string;
}

export function LenderLogoUpload({ currentLogoUrl, onLogoChange, lenderCode }: LenderLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentLogoUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, WebP, or SVG image',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5242880) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${lenderCode.toLowerCase()}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lender-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('lender-logos')
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onLogoChange(publicUrl);

      toast({
        title: 'Logo uploaded',
        description: 'Lender logo uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setPreviewUrl('');
    onLogoChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div
          className={cn(
            "relative flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            previewUrl ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25 bg-muted/50"
          )}
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Lender logo"
                className="h-full w-full object-contain rounded-lg p-2"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full shadow-lg"
                onClick={handleRemoveLogo}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
          )}
        </div>

        {/* Upload button */}
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : previewUrl ? 'Change Logo' : 'Upload Logo'}
          </Button>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP or SVG. Max size 5MB.
          </p>
        </div>
      </div>
    </div>
  );
}
