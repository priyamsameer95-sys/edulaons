import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/utils/logger';

interface DashboardRouterProps {
  children?: ReactNode;
}

export default function DashboardRouter({ children }: DashboardRouterProps) {
  const { 
    user, 
    appUser, 
    loading, 
    hasStoredSession, 
    sessionState,
    getCachedPartnerCode,
    setCachedPartnerCode 
  } = useAuth();
  const location = useLocation();
  
  // Use cached partner code for instant routing
  const [partnerCode, setPartnerCode] = useState<string | null>(() => getCachedPartnerCode());
  const [fetchingPartnerCode, setFetchingPartnerCode] = useState(false);

  // Fetch partner code in background and cache it
  useEffect(() => {
    const fetchPartnerCode = async () => {
      if (appUser?.role !== 'partner' || !appUser.partner_id) return;
      
      // If we already have a cached code, use it immediately
      const cached = getCachedPartnerCode();
      if (cached) {
        setPartnerCode(cached);
        return; // Don't fetch if we have cache
      }
      
      setFetchingPartnerCode(true);
      
      try {
        const { data, error } = await supabase
          .from('partners')
          .select('partner_code')
          .eq('id', appUser.partner_id)
          .single();

        if (error) {
          logger.error('[DashboardRouter] Error fetching partner code:', error);
        } else if (data?.partner_code) {
          setPartnerCode(data.partner_code);
          setCachedPartnerCode(data.partner_code);
        }
      } catch (error) {
        logger.error('[DashboardRouter] Exception fetching partner code:', error);
      } finally {
        setFetchingPartnerCode(false);
      }
    };

    fetchPartnerCode();
  }, [appUser?.role, appUser?.partner_id, getCachedPartnerCode, setCachedPartnerCode]);

  // Build returnTo param
  const returnTo = encodeURIComponent(location.pathname + location.search);

  // Optimistic rendering - don't show spinner if we have a stored session
  const shouldShowLoadingSpinner = loading && !hasStoredSession;

  if (shouldShowLoadingSpinner) {
    return <AuthLoadingScreen />;
  }

  // If session is definitely expired, redirect based on current path
  if (sessionState === 'expired' && !user) {
    const path = location.pathname;
    
    if (path.includes('/admin') || path.includes('/dashboard/admin')) {
      return <Navigate to={`/login/admin?returnTo=${returnTo}`} replace />;
    }
    if (path.includes('/partner')) {
      return <Navigate to={`/login/partner?returnTo=${returnTo}`} replace />;
    }
    return <Navigate to={`/login/student?returnTo=${returnTo}`} replace />;
  }

  // If validating with stored session, render optimistically
  if (sessionState === 'validating' && hasStoredSession) {
    return <>{children}</>;
  }

  // User exists but no appUser yet - render children while loading
  if (user && !appUser && loading) {
    return <>{children}</>;
  }

  // No user after loading complete
  if (!user) {
    return <Navigate to={`/login/student?returnTo=${returnTo}`} replace />;
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

  // Role-based routing
  if (appUser) {
    switch (appUser.role) {
      case 'admin':
      case 'super_admin':
        if (!location.pathname.startsWith('/dashboard/admin')) {
          return <Navigate to="/dashboard/admin" replace />;
        }
        break;
        
      case 'partner':
        // Use cached partner code for instant redirect
        if (partnerCode) {
          if (!location.pathname.startsWith(`/partner/${partnerCode}`)) {
            return <Navigate to={`/partner/${partnerCode}`} replace />;
          }
        } else if (fetchingPartnerCode) {
          // Still fetching - render children or minimal loading
          return <>{children}</>;
        } else if (!appUser.partner_id) {
          logger.error('[DashboardRouter] Partner user has no partner_id');
          return (
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-destructive">Configuration Error</h1>
                <p className="text-muted-foreground">Your partner account is not properly configured.</p>
              </div>
            </div>
          );
        }
        break;
        
      case 'student':
        if (!location.pathname.startsWith('/dashboard/student')) {
          return <Navigate to="/dashboard/student" replace />;
        }
        break;
        
      default:
        return <Navigate to={`/login/student?returnTo=${returnTo}`} replace />;
    }
  }

  return <>{children}</>;
}
