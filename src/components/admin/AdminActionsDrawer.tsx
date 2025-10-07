import { Menu, Users, Shield, LogOut, Plus } from 'lucide-react';
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

interface AdminActionsDrawerProps {
  userRole: 'admin' | 'super_admin';
  onCreatePartner: () => void;
  onSignOut: () => void;
  onTabChange: (tab: string) => void;
}

export function AdminActionsDrawer({ 
  userRole, 
  onCreatePartner, 
  onSignOut,
  onTabChange 
}: AdminActionsDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px]">
        <SheetHeader>
          <SheetTitle>Admin Menu</SheetTitle>
          <SheetDescription>
            Quick access to admin functions
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-2">Actions</p>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={onCreatePartner}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Partner
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-2">Management</p>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => onTabChange('users')}
            >
              <Users className="mr-2 h-4 w-4" />
              User Management
            </Button>
            
            {userRole === 'super_admin' && (
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => onTabChange('audit')}
              >
                <Shield className="mr-2 h-4 w-4" />
                Audit Logs
              </Button>
            )}
          </div>

          <Separator />

          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={onSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
