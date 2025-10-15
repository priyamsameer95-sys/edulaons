import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from './useErrorHandler';

export interface PartnerKPIs {
  totalLeads: number;
  inPipeline: number;
  sanctioned: number;
}

export const usePartnerKPIs = (partnerId?: string, isAdmin = false) => {
  const [kpis, setKpis] = useState<PartnerKPIs>({
    totalLeads: 0,
    inPipeline: 0,
    sanctioned: 0,
  });
  const [loading, setLoading] = useState(true);
  const { handleDatabaseError } = useErrorHandler();

  const fetchKPIs = useCallback(async () => {
    try {
      setLoading(true);
      
      let totalQuery = supabase.from('leads_new').select('*', { count: 'exact', head: true });
      let statusQuery = supabase.from('leads_new').select('status, loan_amount');
      
      // Filter by partner if not admin and partner is specified
      if (!isAdmin && partnerId) {
        totalQuery = totalQuery.eq('partner_id', partnerId);
        statusQuery = statusQuery.eq('partner_id', partnerId);
      }
      
      const { count: totalLeads, error: totalError } = await totalQuery;
      if (totalError) throw totalError;

      const { data: leadsByStatus, error: statusError } = await statusQuery;
      if (statusError) throw statusError;

      let inPipeline = 0, sanctioned = 0;

      leadsByStatus?.forEach((lead) => {
        switch (lead.status) {
          case 'new':
          case 'in_progress':
          case 'contacted':
          case 'document_review':
            inPipeline++;
            break;
          case 'approved':
            sanctioned++;
            break;
        }
      });

      setKpis({
        totalLeads: totalLeads || 0,
        inPipeline,
        sanctioned,
      });
    } catch (error) {
      handleDatabaseError(error, { 
        description: 'Failed to load partner KPIs',
        showToast: false
      });
    } finally {
      setLoading(false);
    }
  }, [partnerId, isAdmin, handleDatabaseError]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  return { kpis, loading, refetch: fetchKPIs };
};
