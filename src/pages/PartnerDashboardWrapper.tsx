import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import PartnerDashboard from './PartnerDashboard';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Partner } from '@/types/partner';

const PartnerDashboardWrapper = () => {
  const { partnerCode } = useParams<{ partnerCode: string }>();
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartner = async () => {
      if (!partnerCode) {
        setError('Partner code is required');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .eq('partner_code', partnerCode)
          .single();

        if (error) {
          console.error('Error fetching partner:', error);
          setError('Partner not found');
          toast({
            title: "Partner Not Found",
            description: `No partner found with code: ${partnerCode}`,
            variant: "destructive",
          });
          return;
        }

        // Check if user has access to this partner
        if (appUser?.role === 'partner') {
          if (appUser.partner_id !== data.id) {
            setError('Access denied to this partner dashboard');
            toast({
              title: "Access Denied",
              description: "You don't have permission to access this partner dashboard",
              variant: "destructive",
            });
            return;
          }
        }

        setPartner(data);
      } catch (err) {
        console.error('Error in fetchPartner:', err);
        setError('Failed to load partner information');
        toast({
          title: "Error",
          description: "Failed to load partner information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [partnerCode, appUser, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading partner dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground">{error || 'Partner not found'}</p>
        </div>
      </div>
    );
  }

  return <PartnerDashboard partner={partner} />;
};

export default PartnerDashboardWrapper;
