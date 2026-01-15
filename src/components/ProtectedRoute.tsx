/**
 * Protected Route Component
 * 
 * AUTH HYDRATION GUARD:
 * - NEVER render protected content until auth is FULLY resolved
 * - Show loading spinner during session validation
 * - Only redirect to login if session explicitly returns null
 * 
 * This prevents the "Access Denied" flash on refresh.
 */
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
  const { user, appUser, loading, sessionState } = useAuth();
  const location = useLocation();

  // Build returnTo param
  const returnTo = encodeURIComponent(location.pathname + location.search);

  // Determine the appropriate login path based on required role
  const getLoginPath = () => {
    if (requiredRole === 'admin' || requiredRole === 'super_admin') return '/login/partner';
    if (requiredRole === 'partner') return '/login/partner';
    if (requiredRole === 'student') return '/login/student';
    return '/login/student';
  };

  // ════════════════════════════════════════════════════════════════════════════
  // AUTH HYDRATION GUARD: Core Logic
  // ════════════════════════════════════════════════════════════════════════════
  // 
  // The bug was: on refresh, we'd render children BEFORE appUser was fetched,
  // causing "Cannot read properties of undefined" when children access appUser.role
  //
  // NEW RULE: Show spinner until BOTH conditions are true:
  // 1. Session validation is complete (not 'validating' or 'unknown')
  // 2. If there IS a user, appUser must also be loaded
  // ════════════════════════════════════════════════════════════════════════════

  // STATE 1: Auth not initialized yet - ALWAYS show spinner
  if (sessionState === 'unknown') {
    return <AuthLoadingScreen />;
  }

  // STATE 2: Session is being validated - ALWAYS show spinner
  if (sessionState === 'validating') {
    return <AuthLoadingScreen />;
  }

  // STATE 3: Loading flag is true - ALWAYS show spinner
  if (loading) {
    return <AuthLoadingScreen />;
  }

  // STATE 4: Session expired with no user - redirect to login
  if (sessionState === 'expired' && !user) {
    const loginPath = getLoginPath();
    return <Navigate to={`${loginPath}?returnTo=${returnTo}`} replace />;
  }

  // STATE 5: No user after auth completed - redirect to login
  if (!user) {
    const loginPath = getLoginPath();
    return <Navigate to={`${loginPath}?returnTo=${returnTo}`} replace />;
  }

  // STATE 6: User exists but appUser not yet loaded - show spinner
  // This is critical! Children might access appUser.role which would crash
  if (user && !appUser) {
    return <AuthLoadingScreen />;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // At this point: user exists AND appUser exists - safe to check roles
  // ════════════════════════════════════════════════════════════════════════════

  // Check if account is active
  if (!appUser.is_active) {
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

  // All checks passed - render protected content
  return <>{children}</>;
}
