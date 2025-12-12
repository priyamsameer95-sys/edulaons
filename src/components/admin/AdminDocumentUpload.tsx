import { useState, useMemo } from 'react';
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
import { Upload, Check } from 'lucide-react';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
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
  const { documentTypes } = useDocumentTypes();
  const { toast } = useToast();

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

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
          verification_status: 'uploaded'
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
      setSelectedFile(null);
      setSelectedDocumentType('');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Upload Document for Student</DialogTitle>
          <DialogDescription>
            Upload a document on behalf of the student. Documents will still require admin verification.
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
            disabled={loading || !selectedFile || !selectedDocumentType}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {loading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}