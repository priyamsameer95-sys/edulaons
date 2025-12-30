/**
 * Document Status Cards
 * 
 * Four horizontal cards showing document status overview.
 * Clickable to filter the document table below.
 * Desktop-first grid layout.
 */
import { FileText, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DocumentFilter = 'all' | 'pending' | 'uploaded' | 'attention' | 'verified';

interface DocumentStatusCardsProps {
  pendingCount: number;
  uploadedCount: number;
  attentionCount: number;
  verifiedCount: number;
  activeFilter: DocumentFilter;
  onFilterChange: (filter: DocumentFilter) => void;
  className?: string;
}

const DocumentStatusCards = ({
  pendingCount,
  uploadedCount,
  attentionCount,
  verifiedCount,
  activeFilter,
  onFilterChange,
  className,
}: DocumentStatusCardsProps) => {
  const cards = [
    {
      id: 'pending' as const,
      label: 'Pending',
      count: pendingCount,
      icon: FileText,
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/30',
      borderActiveClass: 'border-amber-500',
    },
    {
      id: 'uploaded' as const,
      label: 'Uploaded',
      count: uploadedCount,
      icon: Upload,
      colorClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-950/30',
      borderActiveClass: 'border-blue-500',
    },
    {
      id: 'attention' as const,
      label: 'Need Attention',
      count: attentionCount,
      icon: AlertCircle,
      colorClass: 'text-red-600 dark:text-red-400',
      bgClass: 'bg-red-50 dark:bg-red-950/30',
      borderActiveClass: 'border-red-500',
    },
    {
      id: 'verified' as const,
      label: 'Verified',
      count: verifiedCount,
      icon: CheckCircle2,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderActiveClass: 'border-emerald-500',
    },
  ];

  return (
    <div className={cn(
      "grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4",
      className
    )}>
      {cards.map((card) => {
        const isActive = activeFilter === card.id;
        const Icon = card.icon;

        return (
          <button
            key={card.id}
            onClick={() => onFilterChange(isActive ? 'all' : card.id)}
            className={cn(
              "flex flex-col items-center justify-center p-4 lg:p-5 rounded-xl",
              "border-2 transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              isActive ? [card.bgClass, card.borderActiveClass] : "bg-card border-border hover:border-muted-foreground/30"
            )}
          >
            <Icon className={cn("w-5 h-5 mb-2", card.colorClass)} />
            <span className={cn(
              "text-2xl lg:text-3xl font-bold",
              isActive ? card.colorClass : "text-foreground"
            )}>
              {card.count}
            </span>
            <span className="text-xs font-medium text-muted-foreground mt-1">
              {card.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DocumentStatusCards;
