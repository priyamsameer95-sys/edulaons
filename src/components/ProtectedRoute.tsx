import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { AlertCircle } from 'lucide-react';

type AppRole = 'admin' | 'partner' | 'student' | 'super_admin';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, appUser, loading, hasStoredSession, sessionState } = useAuth();
  const location = useLocation();

  // Determine the appropriate login path based on required role
  const getLoginPath = () => {
    if (requiredRole === 'admin' || requiredRole === 'super_admin') return '/login/partner';
    if (requiredRole === 'partner') return '/login/partner';
    if (requiredRole === 'student') return '/login/student';
    return '/login/student';
  };

  // Build returnTo param
  const returnTo = encodeURIComponent(location.pathname + location.search);

  // Optimistic rendering: if we have a stored session, render children immediately
  // while validation happens in the background
  const shouldShowLoadingSpinner = loading && !hasStoredSession;

  // If loading with no stored session hint, show loading screen
  if (shouldShowLoadingSpinner) {
    return <AuthLoadingScreen />;
  }

  // If session is definitely expired and no user, redirect immediately
  if (sessionState === 'expired' && !user) {
    const loginPath = getLoginPath();
    return <Navigate to={`${loginPath}?returnTo=${returnTo}`} replace />;
  }

  // If still validating but we have a stored session, render children optimistically
  // EXCEPT for student routes - they need a confirmed user to fetch data correctly
  if (sessionState === 'validating' && hasStoredSession) {
    if (requiredRole === 'student' && !user) {
      // For student routes, wait until user is confirmed to prevent empty dashboard
      return <AuthLoadingScreen />;
    }
    return <>{children}</>;
  }

  // If we have a user but still loading app user data, render children
  if (user && !appUser && loading) {
    return <>{children}</>;
  }

  // No user after loading complete - redirect
  if (!user) {
    const loginPath = getLoginPath();
    return <Navigate to={`${loginPath}?returnTo=${returnTo}`} replace />;
  }

  // Check if account is active
  if (appUser && !appUser.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card p-8 rounded-lg shadow-lg text-center max-w-md border border-border">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Account Inactive</h2>
          <p className="text-muted-foreground mb-4">
            Your account has been deactivated. Please contact support.
          </p>
          <a href="/" className="text-primary hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // Role check
  if (requiredRole && appUser) {
    const hasRequiredRole = () => {
      switch (requiredRole) {
        case 'super_admin':
          return appUser.role === 'super_admin';
        case 'admin':
          return appUser.role === 'admin' || appUser.role === 'super_admin';
        case 'partner':
          return appUser.role === 'partner' || appUser.role === 'admin' || appUser.role === 'super_admin';
        case 'student':
          return appUser.role === 'student';
        default:
          return false;
      }
    };

    if (!hasRequiredRole()) {
      // Redirect to correct dashboard based on actual role
      if (appUser.role === 'admin' || appUser.role === 'super_admin') {
        return <Navigate to="/dashboard/admin" replace />;
      }
      if (appUser.role === 'partner') {
        return <Navigate to="/dashboard" replace />;
      }
      if (appUser.role === 'student') {
        return <Navigate to="/dashboard/student" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
