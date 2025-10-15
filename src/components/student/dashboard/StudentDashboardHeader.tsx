import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface StudentDashboardHeaderProps {
  applicationsCount: number;
  onSignOut: () => void;
}

export const StudentDashboardHeader = ({ applicationsCount, onSignOut }: StudentDashboardHeaderProps) => (
  <div className="flex items-center justify-between mb-8">
    <div>
      <h1 className="text-3xl font-bold">My Applications</h1>
      <p className="text-muted-foreground mt-1">{applicationsCount} application(s)</p>
    </div>
    <Button variant="outline" onClick={onSignOut}>
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  </div>
);
