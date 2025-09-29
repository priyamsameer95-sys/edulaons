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
      if (appUser?.role === 'partner' && appUser.partner_id && !partnerCode) {
        setFetchingPartnerCode(true);
        try {
          const { data: partner, error } = await supabase
            .from('partners')
            .select('partner_code')
            .eq('id', appUser.partner_id)
            .single();
          
          if (error) {
            console.error('Error fetching partner code:', error);
          } else if (partner) {
            setPartnerCode(partner.partner_code);
          }
        } catch (error) {
          console.error('Error in fetchPartnerCode:', error);
        } finally {
          setFetchingPartnerCode(false);
        }
      }
    };

    fetchPartnerCode();
  }, [appUser, partnerCode]);

  if (loading || fetchingPartnerCode) {
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

  // Route based on user role
  if (appUser.role === 'admin' || appUser.role === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  if (appUser.role === 'partner' && partnerCode) {
    return <Navigate to={`/partner/${partnerCode}`} replace />;
  }

  // If we have a partner but no code yet, show loading
  if (appUser.role === 'partner' && !partnerCode) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Fallback to login if no valid route found
  return <Navigate to="/login" replace />;
};

export default DashboardRouter;