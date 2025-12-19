import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, HelpCircle, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const StudentNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <button
              onClick={() => navigate('/student')}
              className="flex items-center space-x-2 text-xl font-bold text-gray-900 hover:text-primary transition-colors"
            >
              <GraduationCap className="h-8 w-8 text-primary" />
              <span>EduLoanPro</span>
            </button>
            
            <div className="hidden md:flex items-center space-x-1">
              <Button
                variant="ghost"
                onClick={() => navigate('/student')}
                className={isActive('/student') ? 'bg-muted' : ''}
              >
                Dashboard
              </Button>
              <Button variant="ghost" className="text-muted-foreground cursor-not-allowed">
                Applications
              </Button>
              <Button variant="ghost" className="text-muted-foreground cursor-not-allowed">
                Documents
              </Button>
            </div>
          </div>

          {/* Right: Help and Profile */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" title="Help & Support">
              <HelpCircle className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-not-allowed opacity-50">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-not-allowed opacity-50">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
