import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from './useErrorHandler';

export interface PartnerStats {
  id: string;
  name: string;
  partner_code: string;
  totalLeads: number;
  activeLenders: number;
  recentActivity: string;
}

export const usePartnerStats = () => {
  const [stats, setStats] = useState<PartnerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { handleDatabaseError } = useErrorHandler();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch partners with their lead counts
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select(`
          id,
          name,
          partner_code,
          updated_at
        `);

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
      const partnerStats: PartnerStats[] = partners?.map(partner => ({
        id: partner.id,
        name: partner.name,
        partner_code: partner.partner_code,
        totalLeads: leadCountMap.get(partner.id) || 0,
        activeLenders: 1, // Simplified for now
        recentActivity: partner.updated_at,
      })) || [];

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
