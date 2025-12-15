import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from './useErrorHandler';
import { PartnerStats } from '@/types/partner';

export type { PartnerStats } from '@/types/partner';

export const usePartnerStats = () => {
  const [stats, setStats] = useState<PartnerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { handleDatabaseError } = useErrorHandler();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch partners with all details
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select('id, name, partner_code, email, phone, address, is_active, created_at, updated_at');

      if (partnersError) throw partnersError;

      // Fetch lead counts per partner
      const { data: leadCounts, error: leadsError } = await supabase
        .from('leads_new')
        .select('partner_id');

      if (leadsError) throw leadsError;

      // Count leads per partner
      const leadCountMap = new Map<string, number>();
      leadCounts?.forEach(lead => {
        const count = leadCountMap.get(lead.partner_id) || 0;
        leadCountMap.set(lead.partner_id, count + 1);
      });

      // Combine data
      const partnerStats: PartnerStats[] = partners?.map(partner => {
        const leadCount = leadCountMap.get(partner.id) || 0;
        return {
          id: partner.id,
          name: partner.name,
          partner_code: partner.partner_code,
          email: partner.email,
          phone: partner.phone,
          address: partner.address,
          is_active: partner.is_active,
          created_at: partner.created_at,
          lead_count: leadCount,
          totalLeads: leadCount,
          activeLenders: 1,
          recentActivity: partner.updated_at,
          last_activity: partner.updated_at,
        };
      }) || [];

      setStats(partnerStats);
    } catch (error) {
      handleDatabaseError(error, { 
        description: 'Failed to load partner statistics',
        showToast: false
      });
    } finally {
      setLoading(false);
    }
  }, [handleDatabaseError]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
};
