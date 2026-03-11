import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ViewConfig {
  id: string;
  label: string;
  filters: {
    status?: string | null;
    partnerId?: string | null;
    documentsStatus?: string | null;
    isQuickLead?: boolean | null;
  };
  count?: number;
}

interface ViewTabsProps {
  views: ViewConfig[];
  activeView: string;
  onViewChange: (viewId: string) => void;
  leadCounts?: Record<string, number>;
}

// Color mapping for view status indicators
const VIEW_COLORS: Record<string, string> = {
  'new': 'bg-blue-500',
  'quick-leads': 'bg-violet-500',
  'pending-docs': 'bg-amber-500',
  'docs-uploaded': 'bg-cyan-500',
  'with-lender': 'bg-indigo-500',
  'sanctioned': 'bg-emerald-500',
  'disbursed': 'bg-green-600',
  'rejected': 'bg-red-500',
};

// Default views
// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_VIEWS: ViewConfig[] = [
  { id: 'all', label: 'All', filters: {} },
  { id: 'quick-leads', label: 'Quick Leads', filters: { isQuickLead: true } },
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
        const dotColor = VIEW_COLORS[view.id];

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
              {dotColor && (
                <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor, !isActive && "opacity-60")} />
              )}
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

