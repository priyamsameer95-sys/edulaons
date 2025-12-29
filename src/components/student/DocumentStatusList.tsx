/**
 * Document Status List
 * 
 * Collapsible list showing uploaded and pending documents with clear status indicators.
 * Shows rejection reasons and upload timestamps for better clarity.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Circle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface DocumentItem {
  id: string;
  name: string;
  status: 'required' | 'pending' | 'uploaded' | 'verified' | 'rejected' | 'resubmission_required';
  filename?: string;
  uploadedAt?: string;
  rejectionReason?: string;
  aiNotes?: string;
}

interface DocumentStatusListProps {
  title: string;
  documents: DocumentItem[];
  variant: 'uploaded' | 'pending';
  defaultExpanded?: boolean;
}

const DocumentStatusList = ({
  title,
  documents,
  variant,
  defaultExpanded = true,
}: DocumentStatusListProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (documents.length === 0) return null;

  const getStatusIcon = (status: DocumentItem['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'pending':
      case 'uploaded':
        return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'rejected':
      case 'resubmission_required':
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'required':
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: DocumentItem['status']) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'pending':
      case 'uploaded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            Pending Review
          </span>
        );
      case 'rejected':
      case 'resubmission_required':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <RefreshCw className="h-3 w-3" />
            Re-upload Required
          </span>
        );
      case 'required':
      default:
        return (
          <span className="text-xs font-medium text-muted-foreground">
            Required
          </span>
        );
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        className="w-full h-auto py-3 px-4 justify-between hover:bg-muted/50 rounded-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-sm font-medium text-foreground">
          {title} ({documents.length})
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {isExpanded && (
        <div className="border-t border-border divide-y divide-border">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                "py-3 px-4",
                variant === 'pending' && "bg-muted/30",
                doc.status === 'rejected' && "bg-red-50/50 dark:bg-red-900/10"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">
                    {getStatusIcon(doc.status)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {doc.name}
                    </p>
                    {doc.filename && (
                      <p className="text-xs text-muted-foreground truncate">
                        {doc.filename}
                      </p>
                    )}
                    {doc.uploadedAt && (
                      <p className="text-xs text-muted-foreground">
                        Uploaded {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                      </p>
                    )}
                    {/* Rejection reason */}
                    {(doc.status === 'rejected' || doc.status === 'resubmission_required') && doc.rejectionReason && (
                      <div className="flex items-start gap-1.5 mt-1 p-2 bg-red-100/50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{doc.rejectionReason}</span>
                      </div>
                    )}
                    {/* Pending review message */}
                    {(doc.status === 'pending' || doc.status === 'uploaded') && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Our team will verify this within 24 hours
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  {getStatusBadge(doc.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentStatusList;
