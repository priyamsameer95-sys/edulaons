import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Eye, Check, Clock, XCircle, Circle, Loader2, FileText } from 'lucide-react';
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
        <div className="flex items-center gap-1.5 text-emerald-600">
          <Check className="h-4 w-4" />
          <span className="text-xs font-medium">Verified</span>
        </div>
      );
    case 'pending':
      return (
        <div className="flex items-center gap-1.5 text-amber-600">
          <Clock className="h-4 w-4" />
          <span className="text-xs font-medium">Pending</span>
        </div>
      );
    case 'rejected':
      return (
        <div className="flex items-center gap-1.5 text-destructive">
          <XCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Re-upload</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Circle className="h-4 w-4" />
          <span className="text-xs">Not uploaded</span>
        </div>
      );
  }
}

export function DocumentChecklistRow({
  documentType,
  uploadedDocument,
  onUpload,
  onPreview,
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
        'flex items-center gap-3 py-2.5 px-3 rounded-md border transition-colors',
        status === 'verified' && 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800',
        status === 'pending' && 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800',
        status === 'rejected' && 'bg-destructive/5 border-destructive/30',
        status === 'not_uploaded' && 'bg-card border-border hover:bg-muted/50'
      )}
    >
      {/* Document Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{documentType.name}</span>
          {documentType.required && status === 'not_uploaded' && (
            <span className="text-destructive text-xs">*</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          jpg, pdf, png
          {documentType.required ? ' • Required' : ' • Optional'}
        </p>
      </div>

      {/* Upload Button */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3"
        onClick={handleUploadClick}
        disabled={isCurrentlyUploading}
      >
        {isCurrentlyUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Upload className="h-4 w-4 mr-1.5" />
            <span className="text-xs">{status !== 'not_uploaded' ? 'Replace' : 'Upload'}</span>
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
        className="h-8 w-8 p-0"
        disabled={!uploadedDocument}
        onClick={() => uploadedDocument && onPreview(uploadedDocument)}
      >
        <Eye className={cn('h-4 w-4', uploadedDocument ? 'text-foreground' : 'text-muted-foreground/40')} />
      </Button>

      {/* Status */}
      <div className="w-24 flex justify-end">
        <StatusIndicator status={status} />
      </div>
    </div>
  );
}
