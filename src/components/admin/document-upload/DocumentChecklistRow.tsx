import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Eye, Check, Clock, XCircle, Circle, Loader2, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeadDocument } from '@/hooks/useLeadDocuments';

interface DocumentChecklistRowProps {
  documentType: {
    id: string;
    name: string;
    category: string;
    required?: boolean;
  };
  uploadedDocument?: LeadDocument;
  onUpload: (file: File, documentTypeId: string) => void;
  onPreview: (document: LeadDocument) => void;
  onDownload?: (document: LeadDocument) => void;
  onVerify?: (document: LeadDocument) => void;
  isUploading?: boolean;
  uploadingDocTypeId?: string;
}

type DocumentStatus = 'verified' | 'pending' | 'rejected' | 'not_uploaded';

function getDocumentStatus(doc?: LeadDocument): DocumentStatus {
  if (!doc) return 'not_uploaded';
  if (doc.verification_status === 'verified') return 'verified';
  if (doc.verification_status === 'rejected' || doc.ai_validation_status === 'rejected') return 'rejected';
  return 'pending';
}

function StatusIndicator({ status }: { status: DocumentStatus }) {
  switch (status) {
    case 'verified':
      return (
        <div className="flex items-center gap-1 text-emerald-600">
          <Check className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium">Verified</span>
        </div>
      );
    case 'pending':
      return (
        <div className="flex items-center gap-1 text-amber-600">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium">Pending</span>
        </div>
      );
    case 'rejected':
      return (
        <div className="flex items-center gap-1 text-destructive">
          <XCircle className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium">Re-upload</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Circle className="h-3.5 w-3.5" />
        </div>
      );
  }
}

export function DocumentChecklistRow({
  documentType,
  uploadedDocument,
  onUpload,
  onPreview,
  onDownload,
  onVerify,
  isUploading,
  uploadingDocTypeId,
}: DocumentChecklistRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const status = getDocumentStatus(uploadedDocument);
  const isCurrentlyUploading = isUploading && uploadingDocTypeId === documentType.id;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file, documentType.id);
    }
    e.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 py-2 px-3 rounded-md border transition-colors',
        status === 'verified' && 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800',
        status === 'pending' && 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800',
        status === 'rejected' && 'bg-destructive/5 border-destructive/30',
        status === 'not_uploaded' && 'bg-card border-border hover:bg-muted/50'
      )}
    >
      {/* Document Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{documentType.name}</span>
          {documentType.required && status === 'not_uploaded' && (
            <span className="text-destructive text-xs">*</span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          jpg, pdf, png
          {documentType.required ? ' • Required' : ' • Optional'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Upload/Replace Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={handleUploadClick}
          disabled={isCurrentlyUploading}
        >
          {isCurrentlyUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              <span className="text-[11px] ml-1 hidden sm:inline">{status !== 'not_uploaded' ? 'Replace' : 'Upload'}</span>
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
        />

        {/* Preview Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={!uploadedDocument}
          onClick={() => uploadedDocument && onPreview(uploadedDocument)}
        >
          <Eye className={cn('h-3.5 w-3.5', uploadedDocument ? 'text-foreground' : 'text-muted-foreground/40')} />
        </Button>

        {/* Download Button - only if uploaded */}
        {uploadedDocument && onDownload && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onDownload(uploadedDocument)}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Verify Button - only if uploaded and handler provided */}
        {uploadedDocument && onVerify && status !== 'verified' && (
          <Button
            variant={status === 'rejected' ? 'default' : 'outline'}
            size="sm"
            className={cn('h-7 w-7 p-0', status === 'rejected' && 'bg-amber-500 hover:bg-amber-600')}
            onClick={() => onVerify(uploadedDocument)}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Status */}
      <div className="w-16 flex justify-end shrink-0">
        <StatusIndicator status={status} />
      </div>
    </div>
  );
}
