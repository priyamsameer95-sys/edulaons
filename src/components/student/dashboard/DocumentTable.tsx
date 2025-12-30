/**
 * Document Table
 * 
 * Clean, scannable table for documents.
 * Clear status and actions. Verified = done, locked.
 */
import { Upload, Check, AlertCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DocumentFilter } from './DocumentStatusCards';

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  status: 'required' | 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  uploadedFilename?: string;
}

interface DocumentTableProps {
  documents: DocumentItem[];
  filter: DocumentFilter;
  onUpload: (docId: string, file: File) => void;
  uploadingId: string | null;
  className?: string;
}

const STATUS_CONFIG = {
  required: {
    label: 'Required',
    icon: Clock,
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  pending: {
    label: 'Uploaded',
    icon: FileText,
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  verified: {
    label: 'Verified',
    icon: Check,
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  rejected: {
    label: 'Reupload Needed',
    icon: AlertCircle,
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
};

const DocumentTable = ({
  documents,
  filter,
  onUpload,
  uploadingId,
  className,
}: DocumentTableProps) => {
  const filteredDocs = documents.filter(doc => {
    if (filter === 'all') return true;
    if (filter === 'pending') return doc.status === 'required';
    if (filter === 'uploaded') return doc.status === 'pending';
    if (filter === 'attention') return doc.status === 'rejected';
    if (filter === 'verified') return doc.status === 'verified';
    return true;
  });

  const handleFileSelect = (docId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onUpload(docId, file);
    };
    input.click();
  };

  if (filteredDocs.length === 0) {
    return (
      <div className={cn(
        "p-12 text-center bg-card border border-border rounded-2xl",
        className
      )}>
        <FileText className="w-10 h-10 mx-auto mb-4 text-muted-foreground/40" />
        <p className="text-muted-foreground">
          {filter === 'all' ? 'No documents required' : 'No documents match this filter'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("bg-card border border-border rounded-2xl overflow-hidden", className)}>
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                Document
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                Category
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                Status
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredDocs.map((doc) => {
              const config = STATUS_CONFIG[doc.status];
              const StatusIcon = config.icon;
              const isUploading = uploadingId === doc.id;

              return (
                <tr 
                  key={doc.id}
                  className={cn(
                    "transition-colors hover:bg-muted/20",
                    doc.status === 'verified' && "bg-emerald-50/30 dark:bg-emerald-950/10"
                  )}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">{doc.name}</p>
                        {doc.status === 'rejected' && doc.rejectionReason && (
                          <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">
                            {doc.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span className="text-sm text-muted-foreground">{doc.category}</span>
                  </td>

                  <td className="px-6 py-5">
                    <Badge variant="outline" className={cn("gap-1.5 font-medium", config.badgeClass)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </Badge>
                  </td>

                  <td className="px-6 py-5 text-right">
                    {doc.status === 'verified' ? (
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        Done
                      </span>
                    ) : doc.status === 'pending' ? (
                      <span className="text-sm text-muted-foreground">
                        Under Review
                      </span>
                    ) : (
                      <Button
                        variant={doc.status === 'rejected' ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleFileSelect(doc.id)}
                        disabled={isUploading}
                        className={cn(
                          "h-9",
                          doc.status === 'rejected' && "border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400"
                        )}
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-1.5" />
                            {doc.status === 'rejected' ? 'Reupload' : 'Upload'}
                          </>
                        )}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-border">
        {filteredDocs.map((doc) => {
          const config = STATUS_CONFIG[doc.status];
          const StatusIcon = config.icon;
          const isUploading = uploadingId === doc.id;

          return (
            <div 
              key={doc.id}
              className={cn(
                "p-4",
                doc.status === 'verified' && "bg-emerald-50/30 dark:bg-emerald-950/10"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{doc.category}</p>
                  {doc.status === 'rejected' && doc.rejectionReason && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">
                      {doc.rejectionReason}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className={cn("gap-1 text-xs flex-shrink-0", config.badgeClass)}>
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </Badge>
              </div>
              
              <div className="mt-3">
                {doc.status === 'verified' ? (
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Done
                  </span>
                ) : doc.status === 'pending' ? (
                  <span className="text-sm text-muted-foreground">Under Review</span>
                ) : (
                  <Button
                    variant={doc.status === 'rejected' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => handleFileSelect(doc.id)}
                    disabled={isUploading}
                    className={cn(
                      "h-8 w-full",
                      doc.status === 'rejected' && "border-rose-300 text-rose-600 hover:bg-rose-50"
                    )}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-1.5" />
                        {doc.status === 'rejected' ? 'Reupload' : 'Upload'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentTable;
