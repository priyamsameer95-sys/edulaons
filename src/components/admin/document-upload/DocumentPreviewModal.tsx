import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAccessLogger } from '@/hooks/useAccessLogger';

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl: string | null;
  fileName?: string;
  leadId?: string;
  documentId?: string;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  previewUrl,
  fileName,
  leadId,
  documentId
}: DocumentPreviewModalProps) {
  const { logDocumentPreview } = useAccessLogger();

  // Silent background logging when preview opens
  useEffect(() => {
    if (open && leadId && documentId) {
      logDocumentPreview(leadId, documentId);
    }
  }, [open, leadId, documentId, logDocumentPreview]);

  if (!previewUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <div className="p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-medium truncate pr-8">
              {fileName || 'Document Preview'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            <img 
              src={previewUrl} 
              alt="Document preview" 
              className="max-h-[70vh] max-w-full object-contain rounded"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
