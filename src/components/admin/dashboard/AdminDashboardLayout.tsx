import { ReactNode, useState } from 'react';
import { CollapsibleSidebar } from '@/components/admin/navigation/CollapsibleSidebar';
import { TopNavigationBar } from '@/components/admin/navigation/TopNavigationBar';
import { cn } from '@/lib/utils';

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

export const AdminDashboardLayout = ({ children }: AdminDashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Top Navigation */}
      <TopNavigationBar
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
