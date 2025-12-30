/**
 * Document Status Cards
 * 
 * Four cards showing document status overview.
 * Clickable filters with calm, confident colors.
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
      label: 'Required',
      count: pendingCount,
      icon: FileText,
      activeColor: 'text-amber-600 dark:text-amber-400',
      activeBg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700',
    },
    {
      id: 'uploaded' as const,
      label: 'Uploaded',
      count: uploadedCount,
      icon: Upload,
      activeColor: 'text-blue-600 dark:text-blue-400',
      activeBg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700',
    },
    {
      id: 'attention' as const,
      label: 'Review Required',
      count: attentionCount,
      icon: AlertCircle,
      activeColor: 'text-rose-600 dark:text-rose-400',
      activeBg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700',
    },
    {
      id: 'verified' as const,
      label: 'Verified',
      count: verifiedCount,
      icon: CheckCircle2,
      activeColor: 'text-emerald-600 dark:text-emerald-400',
      activeBg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700',
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-sm font-medium text-muted-foreground">
        Document Status
      </h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const isActive = activeFilter === card.id;
          const Icon = card.icon;

          return (
            <button
              key={card.id}
              onClick={() => onFilterChange(isActive ? 'all' : card.id)}
              className={cn(
                "flex flex-col items-center justify-center p-5 lg:p-6 rounded-xl",
                "border transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                isActive 
                  ? card.activeBg 
                  : "bg-card border-border hover:border-muted-foreground/40"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 mb-3",
                isActive ? card.activeColor : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-3xl font-bold tabular-nums",
                isActive ? card.activeColor : "text-foreground"
              )}>
                {card.count}
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-1.5">
                {card.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentStatusCards;
