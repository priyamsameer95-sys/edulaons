import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'partner' | 'admin' | 'super_admin';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !appUser) {
    return <Navigate to="/login" replace />;
  }

  if (!appUser.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Account Inactive</h1>
          <p className="text-muted-foreground">Your account has been deactivated. Please contact support.</p>
        </div>
      </div>
    );
  }

  // Check role requirements
  if (requiredRole) {
    const hasRequiredRole = () => {
      switch (requiredRole) {
        case 'super_admin':
          return appUser.role === 'super_admin';
        case 'admin':
          return appUser.role === 'admin' || appUser.role === 'super_admin';
        case 'partner':
          return appUser.role === 'partner' || appUser.role === 'admin' || appUser.role === 'super_admin';
        case 'student':
          return (appUser.role as any) === 'student';
        default:
          return false;
      }
    };

    if (!hasRequiredRole()) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;