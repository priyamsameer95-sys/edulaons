import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Eye, Check, Clock, XCircle, Circle, Loader2, Download } from 'lucide-react';
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

function StatusBadge({ status, onClick }: { status: DocumentStatus; onClick?: () => void }) {
  const isClickable = onClick && status === 'pending';
  const baseClasses = "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded";
  
  switch (status) {
    case 'verified':
      return (
        <span className={cn(baseClasses, "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400")}>
          <Check className="h-3 w-3" />
        </span>
      );
    case 'pending':
      return (
        <button
          onClick={onClick}
          disabled={!isClickable}
          className={cn(
            baseClasses,
            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            isClickable && "hover:bg-amber-200 cursor-pointer"
          )}
          title={isClickable ? "Click to verify" : undefined}
        >
          <Clock className="h-3 w-3" />
        </button>
      );
    case 'rejected':
      return (
        <span className={cn(baseClasses, "bg-destructive/10 text-destructive")}>
          <XCircle className="h-3 w-3" />
        </span>
      );
    default:
      return (
        <span className={cn(baseClasses, "text-muted-foreground")}>
          <Circle className="h-3 w-3" />
        </span>
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

  return (
    <div className={cn(
      'flex items-center gap-2 py-1.5 px-2 rounded transition-colors',
      status === 'verified' && 'bg-emerald-50/40 dark:bg-emerald-900/10',
      status === 'pending' && 'bg-amber-50/40 dark:bg-amber-900/10',
      status === 'rejected' && 'bg-destructive/5',
      status === 'not_uploaded' && 'hover:bg-muted/30'
    )}>
      {/* Document Name & AI Note */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium truncate">{documentType.name}</span>
          {documentType.required && (
            <span className="text-destructive text-[10px]">*</span>
          )}
        </div>
        {/* Inline AI validation note */}
        {uploadedDocument?.ai_validation_notes && 
         (status === 'rejected' || uploadedDocument.ai_validation_status === 'manual_review') && (
          <span className={cn(
            "text-[10px] truncate max-w-[200px]",
            status === 'rejected' ? "text-destructive" : "text-amber-600 dark:text-amber-400"
          )}>
            ⚠️ {uploadedDocument.ai_validation_notes}
          </span>
        )}
      </div>

      {/* Compact Action Icons */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Upload */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isCurrentlyUploading}
        >
          {isCurrentlyUploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Upload className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
        />

        {/* Preview - only if uploaded */}
        {uploadedDocument && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onPreview(uploadedDocument)}
          >
            <Eye className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </Button>
        )}

        {/* Download - only if uploaded */}
        {uploadedDocument && onDownload && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onDownload(uploadedDocument)}
          >
            <Download className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>

      {/* Status Badge */}
      <div className="shrink-0">
        <StatusBadge 
          status={status} 
          onClick={uploadedDocument && onVerify && status === 'pending' ? () => onVerify(uploadedDocument) : undefined}
        />
      </div>
    </div>
  );
}
