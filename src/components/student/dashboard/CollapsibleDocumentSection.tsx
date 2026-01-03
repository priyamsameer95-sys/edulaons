/**
 * CollapsibleDocumentSection - Collapsible document area
 * 
 * Header: "Documents" title + progress badge + Upload button + chevron
 * Content: Filter tabs + Document table
 */
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  Upload, 
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import DocumentTable, { type DocumentItem } from './DocumentTable';

export type DocumentFilter = 'all' | 'pending' | 'uploaded' | 'attention' | 'verified';

interface FilterConfig {
  id: DocumentFilter;
  label: string;
  icon: typeof Clock;
  activeClass: string;
}

const FILTER_CONFIGS: FilterConfig[] = [
  { id: 'all', label: 'All', icon: FileText, activeClass: 'bg-primary text-primary-foreground' },
  { id: 'pending', label: 'Pending', icon: Clock, activeClass: 'bg-amber-100 text-amber-700' },
  { id: 'uploaded', label: 'Uploaded', icon: CheckCircle2, activeClass: 'bg-blue-100 text-blue-700' },
  { id: 'attention', label: 'Attention', icon: AlertCircle, activeClass: 'bg-red-100 text-red-700' },
  { id: 'verified', label: 'Verified', icon: CheckCircle2, activeClass: 'bg-green-100 text-green-700' },
];

interface CollapsibleDocumentSectionProps {
  documents: DocumentItem[];
  pendingCount: number;
  uploadedCount: number;
  rejectedCount: number;
  verifiedCount: number;
  totalCount: number;
  onUploadClick: () => void;
  onFileUpload: (typeId: string, file: File) => void;
  uploadingId: string | null;
  className?: string;
}

const CollapsibleDocumentSection = ({
  documents,
  pendingCount,
  uploadedCount,
  rejectedCount,
  verifiedCount,
  totalCount,
  onUploadClick,
  onFileUpload,
  uploadingId,
  className,
}: CollapsibleDocumentSectionProps) => {
  const [filter, setFilter] = useState<DocumentFilter>('all');
  
  // Auto-expand if there are pending or rejected docs
  const [isOpen, setIsOpen] = useState(pendingCount > 0 || rejectedCount > 0);
  
  // Update open state when counts change
  useEffect(() => {
    if (pendingCount > 0 || rejectedCount > 0) {
      setIsOpen(true);
    }
  }, [pendingCount, rejectedCount]);

  const completedCount = uploadedCount + verifiedCount;
  const progressText = `${completedCount} of ${totalCount}`;
  const hasAttention = rejectedCount > 0;

  // Get count for each filter
  const getFilterCount = (filterId: DocumentFilter): number => {
    switch (filterId) {
      case 'all': return documents.length;
      case 'pending': return pendingCount;
      case 'uploaded': return uploadedCount;
      case 'attention': return rejectedCount;
      case 'verified': return verifiedCount;
      default: return 0;
    }
  };

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className={cn("rounded-xl border bg-card overflow-hidden", className)}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 hover:text-primary transition-colors">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Documents</span>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                isOpen && "transform rotate-180"
              )} />
            </button>
          </CollapsibleTrigger>
          
          <Badge 
            variant="secondary" 
            className={cn(
              "font-medium text-xs",
              hasAttention 
                ? "bg-red-100 text-red-700" 
                : completedCount === totalCount 
                  ? "bg-green-100 text-green-700"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {progressText} uploaded
            {hasAttention && (
              <span className="ml-1">
                • {rejectedCount} need attention
              </span>
            )}
          </Badge>
        </div>

        <Button 
          size="sm" 
          onClick={onUploadClick}
          className="h-8"
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          Upload
        </Button>
      </div>

      <CollapsibleContent>
        {/* Filter Tabs */}
        <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_CONFIGS.map((filterConfig) => {
              const count = getFilterCount(filterConfig.id);
              const isActive = filter === filterConfig.id;
              const Icon = filterConfig.icon;
              
              // Hide filters with 0 count (except 'all')
              if (count === 0 && filterConfig.id !== 'all') return null;
              
              return (
                <button
                  key={filterConfig.id}
                  onClick={() => setFilter(filterConfig.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    isActive 
                      ? filterConfig.activeClass
                      : "bg-card text-muted-foreground hover:bg-muted border border-border/50"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {filterConfig.label}
                  {count > 0 && (
                    <span className={cn(
                      "ml-0.5",
                      isActive ? "opacity-80" : "text-muted-foreground/70"
                    )}>
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Document Table */}
        <div className="p-4">
          <DocumentTable
            documents={documents}
            filter={filter}
            onUpload={onFileUpload}
            uploadingId={uploadingId}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CollapsibleDocumentSection;
