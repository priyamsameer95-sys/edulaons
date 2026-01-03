/**
 * Document Table
 * 
 * Groups documents by category with collapsible sections.
 * Reduces cognitive load with clear visual hierarchy.
 */
import { useState, useMemo } from 'react';
import { Upload, Check, AlertCircle, Clock, FileText, Loader2, ChevronDown, User, Wallet, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
    label: 'Reupload',
    icon: AlertCircle,
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof User; order: number }> = {
  student: { label: 'Student Documents', icon: User, order: 1 },
  financial_co_applicant: { label: 'Co-Applicant & Financial', icon: Wallet, order: 2 },
  collateral: { label: 'Collateral Documents', icon: Building2, order: 3 },
};

const getCategoryConfig = (category: string) => {
  return CATEGORY_CONFIG[category] || { label: category, icon: FileText, order: 99 };
};

const DocumentTable = ({
  documents,
  filter,
  onUpload,
  uploadingId,
  className,
}: DocumentTableProps) => {
  // Track which categories are open (default: categories with pending/rejected docs are open)
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => {
    const categoriesWithAction = new Set<string>();
    documents.forEach(doc => {
      if (doc.status === 'required' || doc.status === 'rejected') {
        categoriesWithAction.add(doc.category);
      }
    });
    // If no action items, open first category
    if (categoriesWithAction.size === 0 && documents.length > 0) {
      categoriesWithAction.add(documents[0].category);
    }
    return categoriesWithAction;
  });

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filteredDocs = documents.filter(doc => {
    if (filter === 'all') return true;
    if (filter === 'pending') return doc.status === 'required';
    if (filter === 'uploaded') return doc.status === 'pending';
    if (filter === 'attention') return doc.status === 'rejected';
    if (filter === 'verified') return doc.status === 'verified';
    return true;
  });

  // Group by category
  const groupedDocs = useMemo(() => {
    const groups: Record<string, DocumentItem[]> = {};
    filteredDocs.forEach(doc => {
      if (!groups[doc.category]) {
        groups[doc.category] = [];
      }
      groups[doc.category].push(doc);
    });
    
    // Sort categories by order
    return Object.entries(groups).sort((a, b) => {
      const orderA = getCategoryConfig(a[0]).order;
      const orderB = getCategoryConfig(b[0]).order;
      return orderA - orderB;
    });
  }, [filteredDocs]);

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
        "p-12 text-center bg-card border border-border rounded-xl",
        className
      )}>
        <FileText className="w-10 h-10 mx-auto mb-4 text-muted-foreground/40" />
        <p className="text-muted-foreground">
          {filter === 'all' ? 'No documents required' : 'No documents match this filter'}
        </p>
      </div>
    );
  }

  // Get category stats
  const getCategoryStats = (docs: DocumentItem[]) => {
    const pending = docs.filter(d => d.status === 'required').length;
    const rejected = docs.filter(d => d.status === 'rejected').length;
    const verified = docs.filter(d => d.status === 'verified').length;
    const uploaded = docs.filter(d => d.status === 'pending').length;
    return { pending, rejected, verified, uploaded, total: docs.length };
  };

  return (
    <div className={cn("space-y-3", className)}>
      {groupedDocs.map(([category, docs]) => {
        const categoryConfig = getCategoryConfig(category);
        const CategoryIcon = categoryConfig.icon;
        const isOpen = openCategories.has(category);
        const stats = getCategoryStats(docs);
        const hasAction = stats.pending > 0 || stats.rejected > 0;
        const isComplete = stats.verified === stats.total;

        return (
          <Collapsible
            key={category}
            open={isOpen}
            onOpenChange={() => toggleCategory(category)}
            className="border border-border rounded-xl overflow-hidden bg-card"
          >
            {/* Category Header */}
            <CollapsibleTrigger asChild>
              <button className={cn(
                "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                isComplete && "bg-emerald-50/50 dark:bg-emerald-950/20"
              )}>
                <div className="flex items-center gap-3">
                  <CategoryIcon className={cn(
                    "w-4 h-4",
                    isComplete ? "text-emerald-600" : "text-muted-foreground"
                  )} />
                  <span className="font-medium text-sm">{categoryConfig.label}</span>
                  
                  {/* Stats badges */}
                  <div className="flex items-center gap-1.5">
                    {isComplete ? (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0">
                        <Check className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    ) : (
                      <>
                        {stats.rejected > 0 && (
                          <Badge variant="secondary" className="bg-rose-100 text-rose-700 text-xs px-2 py-0">
                            {stats.rejected} need attention
                          </Badge>
                        )}
                        {stats.pending > 0 && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs px-2 py-0">
                            {stats.pending} pending
                          </Badge>
                        )}
                        {stats.verified > 0 && (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0">
                            {stats.verified}/{stats.total}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  isOpen && "transform rotate-180"
                )} />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="border-t border-border divide-y divide-border">
                {docs.map((doc) => {
                  const config = STATUS_CONFIG[doc.status];
                  const StatusIcon = config.icon;
                  const isUploading = uploadingId === doc.id;

                  return (
                    <div 
                      key={doc.id}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 gap-4",
                        doc.status === 'verified' && "bg-emerald-50/30 dark:bg-emerald-950/10"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                        {doc.status === 'rejected' && doc.rejectionReason && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                            {doc.rejectionReason}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge variant="outline" className={cn("gap-1 text-xs", config.badgeClass)}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="hidden sm:inline">{config.label}</span>
                        </Badge>

                        {doc.status === 'verified' ? (
                          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 w-20 justify-end">
                            <Check className="w-3.5 h-3.5" />
                            Done
                          </span>
                        ) : doc.status === 'pending' ? (
                          <span className="text-xs text-muted-foreground w-20 text-right">
                            Reviewing
                          </span>
                        ) : (
                          <Button
                            variant={doc.status === 'rejected' ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handleFileSelect(doc.id)}
                            disabled={isUploading}
                            className={cn(
                              "h-7 text-xs w-20",
                              doc.status === 'rejected' && "border-rose-300 text-rose-600 hover:bg-rose-50"
                            )}
                          >
                            {isUploading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5 mr-1" />
                                Upload
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default DocumentTable;
