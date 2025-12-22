import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ViewConfig {
  id: string;
  label: string;
  filters: {
    status?: string | null;
    partnerId?: string | null;
    documentsStatus?: string | null;
  };
  count?: number;
}

interface ViewTabsProps {
  views: ViewConfig[];
  activeView: string;
  onViewChange: (viewId: string) => void;
  leadCounts?: Record<string, number>;
}

// Default views
export const DEFAULT_VIEWS: ViewConfig[] = [
  { id: 'all', label: 'All', filters: {} },
  { id: 'new', label: 'New', filters: { status: 'lead_intake' } },
  { id: 'pending-docs', label: 'Pending Docs', filters: { documentsStatus: 'pending' } },
  { id: 'docs-uploaded', label: 'Docs Uploaded', filters: { documentsStatus: 'uploaded' } },
  { id: 'with-lender', label: 'With Lender', filters: { status: 'logged_with_lender' } },
  { id: 'sanctioned', label: 'Sanctioned', filters: { status: 'sanctioned' } },
  { id: 'disbursed', label: 'Disbursed', filters: { status: 'disbursed' } },
  { id: 'rejected', label: 'Rejected', filters: { status: 'rejected' } },
];

export function ViewTabs({ views, activeView, onViewChange, leadCounts }: ViewTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg mx-4 my-2 overflow-x-auto">
      {views.map((view) => {
        const isActive = activeView === view.id;
        const count = leadCounts?.[view.id];

        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <span className="flex items-center gap-1.5">
              {view.label}
              {count !== undefined && count > 0 && (
                <Badge 
                  variant={isActive ? 'default' : 'outline'} 
                  className={cn(
                    "h-5 px-1.5 text-xs font-medium",
                    !isActive && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {count > 999 ? '999+' : count}
                </Badge>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
