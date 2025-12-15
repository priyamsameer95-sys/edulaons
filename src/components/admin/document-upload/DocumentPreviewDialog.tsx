import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { LeadDocument } from '@/hooks/useLeadDocuments';

interface DocumentPreviewDialogProps {
  document: LeadDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreviewDialog({ document, open, onOpenChange }: DocumentPreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && document) {
      loadPreview();
    } else {
      setPreviewUrl(null);
    }
  }, [open, document]);

  const loadPreview = async () => {
    if (!document) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('lead-documents')
        .createSignedUrl(document.file_path, 3600);
      
      if (error) throw error;
      setPreviewUrl(data.signedUrl);
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const isImage = document?.mime_type?.startsWith('image/');
  const isPdf = document?.mime_type === 'application/pdf';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document?.original_filename || 'Document Preview'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : previewUrl ? (
            <div className="space-y-4">
              {isImage && (
                <div className="flex justify-center bg-muted/30 rounded-lg p-4">
                  <img
                    src={previewUrl}
                    alt={document?.original_filename}
                    className="max-h-[60vh] object-contain rounded"
                  />
                </div>
              )}
              
              {isPdf && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">PDF Preview</p>
                  <Button variant="outline" asChild>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" asChild>
                  <a href={previewUrl} download={document?.original_filename}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Failed to load preview
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
