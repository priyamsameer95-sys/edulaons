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
    <div className="flex items-center gap-1 border-b border-border bg-card px-4 overflow-x-auto">
      {views.map((view) => {
        const isActive = activeView === view.id;
        const count = leadCounts?.[view.id];

        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={cn(
              'relative px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
              'hover:text-foreground focus:outline-none',
              isActive 
                ? 'text-foreground' 
                : 'text-muted-foreground'
            )}
          >
            <span className="flex items-center gap-1.5">
              {view.label}
              {count !== undefined && count > 0 && (
                <Badge 
                  variant={isActive ? 'default' : 'secondary'} 
                  className="h-5 px-1.5 text-xs font-normal"
                >
                  {count > 999 ? '999+' : count}
                </Badge>
              )}
            </span>
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
