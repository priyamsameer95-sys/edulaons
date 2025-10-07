import { Users, LayoutDashboard, FileText, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: 'admin' | 'super_admin';
}

export function AdminSidebar({ activeTab, onTabChange, userRole }: AdminSidebarProps) {
  const menuItems = [
    {
      id: 'leads',
      label: 'Leads',
      icon: LayoutDashboard,
      roles: ['admin', 'super_admin'],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: FileText,
      roles: ['admin', 'super_admin'],
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      roles: ['admin', 'super_admin'],
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      icon: Shield,
      roles: ['super_admin'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      roles: ['admin', 'super_admin'],
    },
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-2">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Admin Console</h2>
          <p className="text-sm text-muted-foreground">Manage your platform</p>
        </div>
        
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
