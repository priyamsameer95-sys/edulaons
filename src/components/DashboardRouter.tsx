import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';

interface DashboardRouterProps {
  children?: React.ReactNode;
}

const DashboardRouter = ({ children }: DashboardRouterProps) => {
  const { user, appUser, loading } = useAuth();
  const location = useLocation();
  const [partnerCode, setPartnerCode] = useState<string | null>(null);
  const [fetchingPartnerCode, setFetchingPartnerCode] = useState(false);

  useEffect(() => {
    const fetchPartnerCode = async () => {
      if (appUser?.role === 'partner') {
        if (!appUser.partner_id) {
          logger.error('Partner user has no partner_id assigned');
          setFetchingPartnerCode(false);
          return;
        }
        
        if (!partnerCode) {
          setFetchingPartnerCode(true);
          try {
            const { data: partner, error } = await supabase
              .from('partners')
              .select('partner_code')
              .eq('id', appUser.partner_id)
              .single();
            
            if (error) {
              logger.error('Error fetching partner code:', error);
              setFetchingPartnerCode(false);
            } else if (partner) {
              setPartnerCode(partner.partner_code);
              setFetchingPartnerCode(false);
            } else {
              logger.error('No partner found with id:', appUser.partner_id);
              setFetchingPartnerCode(false);
            }
          } catch (error) {
            logger.error('Error in fetchPartnerCode:', error);
            setFetchingPartnerCode(false);
          }
        }
      }
    };

    fetchPartnerCode();
  }, [appUser, partnerCode]);

  // Debug logging - only in development
  logger.debug('DashboardRouter:', { loading, fetchingPartnerCode, hasUser: !!user, hasAppUser: !!appUser });

  if (loading || fetchingPartnerCode) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Build returnTo param from current location
  const returnTo = encodeURIComponent(location.pathname + location.search);

  if (!user || !appUser) {
    // Redirect to appropriate login page with returnTo
    // Detect intended role from URL path
    if (location.pathname.startsWith('/dashboard/admin') || location.pathname.startsWith('/admin')) {
      return <Navigate to={`/admin?returnTo=${returnTo}`} replace />;
    }
    if (location.pathname.startsWith('/partner') || location.pathname.startsWith('/dashboard')) {
      return <Navigate to={`/partner/login?returnTo=${returnTo}`} replace />;
    }
    // Default: student login
    return <Navigate to={`/student/auth?returnTo=${returnTo}`} replace />;
  }

  if (!appUser.is_active) {
    console.log('DashboardRouter: User is inactive, showing inactive message');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Account Inactive</h1>
          <p className="text-muted-foreground">Your account has been deactivated. Please contact support.</p>
        </div>
      </div>
    );
  }

  // Route based on user role
  if (appUser.role === 'admin' || appUser.role === 'super_admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  if (appUser.role === 'student' as any) {
    return <Navigate to="/dashboard/student" replace />;
  }

  if (appUser.role === 'partner') {
    if (!appUser.partner_id) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Configuration Error</h1>
            <p className="text-muted-foreground">Your partner account is not properly configured. Please contact support.</p>
          </div>
        </div>
      );
    }
    
    if (partnerCode) {
      return <Navigate to={`/partner/${partnerCode}`} replace />;
    } else if (fetchingPartnerCode) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    } else {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Error Loading Dashboard</h1>
            <p className="text-muted-foreground">Unable to load your partner dashboard. Please try refreshing.</p>
          </div>
        </div>
      );
    }
  }

  // Fallback to student auth if no valid route found
  return <Navigate to={`/student/auth?returnTo=${returnTo}`} replace />;
};

export default DashboardRouter;