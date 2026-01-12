import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  Handshake,
  Building2,
  FileText,
  BarChart3,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  icon: typeof Home;
  href: string;
  badge?: number;
}

const navigationItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard/admin' },
  { label: 'Leads', icon: Users, href: '/dashboard/admin?tab=leads' },
  { label: 'Partners', icon: Handshake, href: '/dashboard/admin?tab=partners' },
  { label: 'Lenders', icon: Building2, href: '/dashboard/admin?tab=lenders' },
  { label: 'Documents', icon: FileText, href: '/dashboard/admin?tab=documents' },
  { label: 'Analytics', icon: BarChart3, href: '/dashboard/admin?tab=analytics' },
  { label: 'Users', icon: User, href: '/dashboard/admin?tab=users' },
  { label: 'Settings', icon: Settings, href: '/dashboard/admin?tab=settings' },
];

interface CollapsibleSidebarProps {
  className?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const CollapsibleSidebar = ({ className, collapsed: externalCollapsed, onCollapsedChange }: CollapsibleSidebarProps) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = externalCollapsed ?? internalCollapsed;
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') {
      return location.pathname === '/dashboard/admin' && !location.search;
    }
    const tabMatch = href.match(/tab=([^&]+)/);
    if (tabMatch) {
      return location.search.includes(`tab=${tabMatch[1]}`);
    }
    return false;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">EL</span>
            </div>
            <span className="font-semibold text-foreground">Edu Loans</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const newValue = !collapsed;
            setInternalCollapsed(newValue);
            onCollapsedChange?.(newValue);
          }}
          className={cn('h-8 w-8', collapsed && 'mx-auto')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        <TooltipProvider delayDuration={0}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            const content = (
              <NavLink
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative',
                  'hover:bg-muted',
                  active && 'bg-primary/10 text-primary font-medium border-l-2 border-primary',
                  !active && 'text-muted-foreground hover:text-foreground',
                  collapsed && 'justify-center'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    active && 'text-primary'
                  )}
                />
                {!collapsed && (
                  <span className="text-sm">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {content}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{content}</div>;
          })}
        </TooltipProvider>
      </nav>
    </aside>
  );
};
