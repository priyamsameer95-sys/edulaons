import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GlobalPublicHeader = () => {
  const location = useLocation();
  
  // Determine which page we're on for active states
  const isStudentAuth = location.pathname === '/student/auth' || location.pathname === '/login/student';
  const isPartnerLogin = location.pathname === '/partner/login' || location.pathname === '/login/partner';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors"
          >
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Edu<span className="text-primary">Loans</span>
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">by Cashkaro</span>
          </Link>

          {/* Auth Navigation */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant={isPartnerLogin ? "secondary" : "ghost"} 
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <Link to="/login/partner" className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Partner Login</span>
                <span className="sm:hidden">Partner</span>
              </Link>
            </Button>
            
            <Button 
              variant={isStudentAuth ? "default" : "default"}
              size="sm"
              asChild
              className="shadow-sm"
            >
              <Link to="/login/student" className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Student Login</span>
                <span className="sm:hidden">Login</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default GlobalPublicHeader;
