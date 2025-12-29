import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw } from 'lucide-react';
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell';

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
  return (
    <header className="border-b bg-card px-6 py-4 shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage leads and partners</p>
        </div>
        <div className="flex items-center gap-2">
          <AdminNotificationBell onOpenLead={onOpenLead} />
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
});
