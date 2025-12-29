/**
 * Document Status List
 * 
 * Collapsible list showing uploaded and pending documents.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentItem {
  id: string;
  name: string;
  status: 'required' | 'pending' | 'verified' | 'rejected';
  filename?: string;
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
        return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'required':
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: DocumentItem['status']) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Needs Reupload';
      case 'required':
      default:
        return 'Required';
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
                "flex items-center justify-between py-2.5 px-4",
                variant === 'pending' && "bg-muted/30"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {getStatusIcon(doc.status)}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {doc.name}
                  </p>
                  {doc.filename && (
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.filename}
                    </p>
                  )}
                </div>
              </div>
              <span className={cn(
                "text-xs font-medium shrink-0 ml-2",
                doc.status === 'verified' && "text-emerald-600 dark:text-emerald-400",
                doc.status === 'pending' && "text-amber-600 dark:text-amber-400",
                doc.status === 'rejected' && "text-red-600 dark:text-red-400",
                doc.status === 'required' && "text-muted-foreground"
              )}>
                {getStatusText(doc.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentStatusList;
