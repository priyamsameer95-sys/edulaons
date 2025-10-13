import { useState } from 'react';
import { Menu, Users, Shield, LogOut, Plus, LayoutDashboard, Building2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface AdminActionsDrawerProps {
  userRole: 'admin' | 'super_admin';
  activeTab: string;
  onCreatePartner: () => void;
  onSignOut: () => void;
  onTabChange: (tab: string) => void;
}

export function AdminActionsDrawer({ 
  userRole, 
  activeTab,
  onCreatePartner, 
  onSignOut,
  onTabChange 
}: AdminActionsDrawerProps) {
  const [open, setOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="hover:bg-accent">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px]">
        <SheetHeader>
          <SheetTitle className="text-xl">Admin Menu</SheetTitle>
          <SheetDescription>
            Quick access to admin functions
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-8 space-y-6">
          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Quick Actions</p>
            <Button 
              variant="ghost" 
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => handleAction(onCreatePartner)}
            >
              <Plus className="mr-3 h-4 w-4" />
              Create New Partner
            </Button>
          </div>

          <Separator />

          {/* Navigation */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Navigation</p>
            
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start transition-colors",
                activeTab === 'overview' ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
              onClick={() => handleTabChange('overview')}
            >
              <LayoutDashboard className="mr-3 h-4 w-4" />
              Overview
            </Button>

            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start transition-colors",
                activeTab === 'partners' ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
              onClick={() => handleTabChange('partners')}
            >
              <Building2 className="mr-3 h-4 w-4" />
              Partners
            </Button>

            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start transition-colors",
                activeTab === 'lenders' ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
              onClick={() => handleTabChange('lenders')}
            >
              <DollarSign className="mr-3 h-4 w-4" />
              Lenders
            </Button>

            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start transition-colors",
                activeTab === 'leads' ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
              onClick={() => handleTabChange('leads')}
            >
              <Users className="mr-3 h-4 w-4" />
              All Leads
            </Button>
          </div>

          <Separator />

          {/* Management */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Management</p>
            
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start transition-colors",
                activeTab === 'users' ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
              onClick={() => handleTabChange('users')}
            >
              <Users className="mr-3 h-4 w-4" />
              User Management
            </Button>
            
            {userRole === 'super_admin' && (
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full justify-start transition-colors",
                  activeTab === 'audit' ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                )}
                onClick={() => handleTabChange('audit')}
              >
                <Shield className="mr-3 h-4 w-4" />
                Audit Logs
              </Button>
            )}
          </div>

          <Separator />

          {/* Account */}
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => handleAction(onSignOut)}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
