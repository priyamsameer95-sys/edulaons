import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut } from 'lucide-react';

interface AdminHeaderProps {
  userRole: string;
  onSignOut: () => void;
}

export const AdminHeader = ({ userRole, onSignOut }: AdminHeaderProps) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <Badge variant="outline" className="mt-2">{userRole}</Badge>
    </div>
    <Button variant="outline" onClick={onSignOut}>
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  </div>
);
