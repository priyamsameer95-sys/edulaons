/**
 * Document Table
 * 
 * Desktop-friendly table layout for documents.
 * Shows name, status badge, and action.
 * Verified rows have calm green styling.
 */
import { useState } from 'react';
import { Upload, Check, AlertCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    label: 'Pending',
    icon: Clock,
    variant: 'outline' as const,
    className: 'border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20',
  },
  pending: {
    label: 'Uploaded',
    icon: FileText,
    variant: 'outline' as const,
    className: 'border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20',
  },
  verified: {
    label: 'Verified',
    icon: Check,
    variant: 'outline' as const,
    className: 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20',
  },
  rejected: {
    label: 'Reupload',
    icon: AlertCircle,
    variant: 'outline' as const,
    className: 'border-red-500/50 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20',
  },
};

const DocumentTable = ({
  documents,
  filter,
  onUpload,
  uploadingId,
  className,
}: DocumentTableProps) => {
  // Filter documents based on active filter
  const filteredDocs = documents.filter(doc => {
    if (filter === 'all') return true;
    if (filter === 'pending') return doc.status === 'required';
    if (filter === 'uploaded') return doc.status === 'pending';
    if (filter === 'attention') return doc.status === 'rejected';
    if (filter === 'verified') return doc.status === 'verified';
    return true;
  });

  // Group by category
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const category = doc.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, DocumentItem[]>);

  const categoryOrder = ['KYC', 'Academic', 'Financial', 'Co-Applicant', 'Collateral', 'Other'];
  const sortedCategories = Object.keys(groupedDocs).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
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
        "p-8 text-center bg-card border border-border rounded-2xl",
        className
      )}>
        <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          {filter === 'all' ? 'No documents required' : `No documents in "${filter}" status`}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("bg-card border border-border rounded-2xl overflow-hidden", className)}>
      <TooltipProvider>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Document Name
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4 hidden sm:table-cell">
                  Category
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Status
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedCategories.map(category => (
                groupedDocs[category].map((doc) => {
                  const config = STATUS_CONFIG[doc.status];
                  const StatusIcon = config.icon;
                  const isUploading = uploadingId === doc.id;
                  const needsAction = doc.status === 'required' || doc.status === 'rejected';

                  return (
                    <tr 
                      key={doc.id}
                      className={cn(
                        "transition-colors",
                        doc.status === 'rejected' && "bg-red-50/30 dark:bg-red-950/10",
                        doc.status === 'verified' && "bg-emerald-50/30 dark:bg-emerald-950/10"
                      )}
                    >
                      {/* Document Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">{doc.name}</p>
                            {doc.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 hidden lg:block">
                                {doc.description}
                              </p>
                            )}
                            {doc.status === 'rejected' && doc.rejectionReason && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">{category}</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <Badge variant={config.variant} className={cn("gap-1", config.className)}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        {doc.status === 'verified' ? (
                          <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ Complete
                          </span>
                        ) : doc.status === 'pending' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm text-muted-foreground cursor-help">
                                Under Review
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{doc.uploadedFilename}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            variant={doc.status === 'rejected' ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => handleFileSelect(doc.id)}
                            disabled={isUploading}
                            className="h-8"
                          >
                            {isUploading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                                {doc.status === 'rejected' ? 'Re-upload' : 'Upload'}
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ))}
            </tbody>
          </table>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default DocumentTable;
