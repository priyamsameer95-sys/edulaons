import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, Bell, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface StudentNavBarProps {
  studentName?: string;
}

export const StudentNavBar = ({ studentName }: StudentNavBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Get first name from studentName prop or user email
  const displayName = studentName || user?.email?.split('@')[0] || 'Student';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Left: Logo */}
          <button
            onClick={() => navigate('/student')}
            className="flex items-center space-x-2 text-lg md:text-xl font-bold text-foreground hover:text-primary transition-colors"
          >
            <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <span className="hidden sm:inline">EduLoanPro</span>
          </button>

          {/* Center: Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Button
              variant={isActive('/student') ? 'secondary' : 'ghost'}
              onClick={() => navigate('/student')}
              size="sm"
            >
              Dashboard
            </Button>
          </div>

          {/* Right: Notifications and Profile */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative" title="Notifications">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                1
              </Badge>
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 md:px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium text-foreground max-w-[100px] truncate">
                    {displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-2 animate-fade-in">
            <Button
              variant={isActive('/student') ? 'secondary' : 'ghost'}
              onClick={() => {
                navigate('/student');
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start"
            >
              Dashboard
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
