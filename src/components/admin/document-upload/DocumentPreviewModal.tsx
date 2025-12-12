import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl: string | null;
  fileName?: string;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  previewUrl,
  fileName
}: DocumentPreviewModalProps) {
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
