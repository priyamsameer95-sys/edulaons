import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface DashboardRouterProps {
  children?: React.ReactNode;
}

const DashboardRouter = ({ children }: DashboardRouterProps) => {
  const { user, appUser, loading } = useAuth();
  const [partnerCode, setPartnerCode] = useState<string | null>(null);
  const [fetchingPartnerCode, setFetchingPartnerCode] = useState(false);

  useEffect(() => {
    const fetchPartnerCode = async () => {
      if (appUser?.role === 'partner') {
        if (!appUser.partner_id) {
          console.error('Partner user has no partner_id assigned');
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
              console.error('Error fetching partner code:', error);
              setFetchingPartnerCode(false);
            } else if (partner) {
              setPartnerCode(partner.partner_code);
              setFetchingPartnerCode(false);
            } else {
              console.error('No partner found with id:', appUser.partner_id);
              setFetchingPartnerCode(false);
            }
          } catch (error) {
            console.error('Error in fetchPartnerCode:', error);
            setFetchingPartnerCode(false);
          }
        }
      }
    };

    fetchPartnerCode();
  }, [appUser, partnerCode]);

  // Debug logging to track routing issues
  console.log('DashboardRouter Debug:', {
    loading,
    fetchingPartnerCode,
    user: user ? { email: user.email, id: user.id } : null,
    appUser: appUser ? { email: appUser.email, role: appUser.role, partner_id: appUser.partner_id, is_active: appUser.is_active } : null,
    partnerCode,
    currentUrl: window.location.href
  });

  if (loading || fetchingPartnerCode) {
    console.log('DashboardRouter: Showing loading state');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !appUser) {
    console.log('DashboardRouter: No user or appUser, redirecting to home');
    return <Navigate to="/" replace />;
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
    console.log('DashboardRouter: Admin/Super Admin detected, redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }

  if (appUser.role === 'student' as any) {
    console.log('DashboardRouter: Student detected, redirecting to /student');
    return <Navigate to="/student" replace />;
  }

  if (appUser.role === 'partner') {
    if (!appUser.partner_id) {
      console.error('DashboardRouter: Partner has no partner_id');
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
      console.log('DashboardRouter: Partner with code, redirecting to partner dashboard:', partnerCode);
      return <Navigate to={`/partner/${partnerCode}`} replace />;
    } else if (fetchingPartnerCode) {
      console.log('DashboardRouter: Fetching partner code, showing loading');
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    } else {
      console.error('DashboardRouter: Failed to fetch partner code');
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

  // Fallback to home if no valid route found
  console.log('DashboardRouter: No valid route found, fallback to home');
  return <Navigate to="/" replace />;
};

export default DashboardRouter;