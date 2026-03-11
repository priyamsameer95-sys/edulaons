import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw, GraduationCap, Command } from 'lucide-react';
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AdminDashboardHeaderProps {
  onRefresh: () => void;
  onSignOut: () => void;
  onOpenLead: (leadId: string, tab?: string) => void;
}

export const AdminDashboardHeader = React.memo(function AdminDashboardHeader({
  onRefresh,
  onSignOut,
  onOpenLead,
}: AdminDashboardHeaderProps) {
  const { appUser } = useAuth();
  const adminName = appUser?.email?.split('@')[0]?.replace(/[._-]/g, ' ')?.split(' ')[0] || 'Admin';
  const displayName = adminName.charAt(0).toUpperCase() + adminName.slice(1).toLowerCase();

  return (
    <header className="border-b bg-card px-6 py-3.5 shrink-0">
      <div className="flex items-center justify-between">
        {/* Left: Logo + Greeting */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base leading-tight">EduLoans</span>
              <span className="text-[10px] text-muted-foreground leading-none">by CashKaro</span>
            </div>
          </div>
          <div className="hidden md:block h-6 w-px bg-border" />
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-medium text-foreground">
              Welcome, {displayName}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                {appUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Keyboard shortcut hint */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex text-xs text-muted-foreground gap-1.5 h-8"
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              >
                <Command className="h-3 w-3" />
                <span>Search</span>
                <kbd className="pointer-events-none ml-1 inline-flex h-5 items-center rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open command palette</TooltipContent>
          </Tooltip>

          <AdminNotificationBell onOpenLead={onOpenLead} />
          <Button variant="outline" size="sm" onClick={onRefresh} className="h-8">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={onSignOut} className="h-8 text-muted-foreground">
            <LogOut className="h-3.5 w-3.5 mr-1" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
});
