/**
 * Document Category Group
 * 
 * Collapsible group of documents by category.
 * Shows pending count and category status.
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, Upload, CheckCircle2, Clock, AlertCircle, X, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DocumentItem {
  id: string;
  name: string;
  description?: string | null;
  status: 'required' | 'pending' | 'verified' | 'rejected';
  uploadedFilename?: string;
}

interface DocumentCategoryGroupProps {
  category: string;
  categoryLabel: string;
  categoryIcon: React.ElementType;
  documents: DocumentItem[];
  onUpload: (docTypeId: string, file: File) => void;
  uploadingId: string | null;
  defaultExpanded?: boolean;
}

const STATUS_CONFIG = {
  required: {
    icon: AlertCircle,
    className: 'text-muted-foreground',
    bgClass: 'bg-muted/30 border-border',
    label: 'Required',
  },
  pending: {
    icon: Clock,
    className: 'text-amber-600',
    bgClass: 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800',
    label: 'Pending Review',
  },
  verified: {
    icon: CheckCircle2,
    className: 'text-emerald-600',
    bgClass: 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800',
    label: 'Verified',
  },
  rejected: {
    icon: X,
    className: 'text-red-600',
    bgClass: 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
    label: 'Re-upload Required',
  },
};

const DocumentCategoryGroup = ({
  category,
  categoryLabel,
  categoryIcon: CategoryIcon,
  documents,
  onUpload,
  uploadingId,
  defaultExpanded = true,
}: DocumentCategoryGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  
  const pendingCount = documents.filter(d => d.status === 'required' || d.status === 'rejected').length;
  const verifiedCount = documents.filter(d => d.status === 'verified').length;
  const isComplete = pendingCount === 0 && documents.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
          "hover:bg-muted/50 border",
          isComplete ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20" : "border-border"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isComplete ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-primary/10"
            )}>
              <CategoryIcon className={cn(
                "w-4 h-4",
                isComplete ? "text-emerald-600" : "text-primary"
              )} />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">{categoryLabel}</p>
              <p className="text-xs text-muted-foreground">
                {verifiedCount}/{documents.length} completed
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {pendingCount} pending
              </span>
            )}
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-2 space-y-2 pl-2">
          {documents.map((doc) => {
            const statusConfig = STATUS_CONFIG[doc.status];
            const StatusIcon = statusConfig.icon;
            const isUploading = uploadingId === doc.id;
            const needsUpload = doc.status === 'required' || doc.status === 'rejected';

            return (
              <div
                key={doc.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all",
                  statusConfig.bgClass
                )}
              >
                <StatusIcon className={cn("w-4 h-4 flex-shrink-0", statusConfig.className)} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground truncate">
                      {doc.name}
                    </span>
                    {doc.description && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help flex-shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px]">
                            <p className="text-xs">{doc.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  {doc.uploadedFilename && doc.status !== 'required' && (
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.uploadedFilename}
                    </p>
                  )}
                </div>

                {needsUpload ? (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUpload(doc.id, file);
                      }}
                      disabled={isUploading}
                    />
                    <Button 
                      variant={doc.status === 'rejected' ? 'destructive' : 'secondary'} 
                      size="sm" 
                      className="h-8 px-3" 
                      asChild
                    >
                      <span>
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Upload
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                ) : (
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded",
                    doc.status === 'verified' 
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" 
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                  )}>
                    {doc.status === 'verified' ? '✓ Verified' : '⏳ Reviewing'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default DocumentCategoryGroup;
