import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from './useErrorHandler';

export interface AdminKPIs {
  totalLeads: number;
  totalPartners: number;
  inPipeline: number;
  sanctioned: number;
  totalLoanAmount: number;
}

export const useAdminKPIs = () => {
  const [kpis, setKpis] = useState<AdminKPIs>({
    totalLeads: 0,
    totalPartners: 0,
    inPipeline: 0,
    sanctioned: 0,
    totalLoanAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const { handleDatabaseError } = useErrorHandler();

  const fetchKPIs = useCallback(async () => {
    try {
      setLoading(true);
      
      // Total leads count
      const { count: totalLeads, error: leadsError } = await supabase
        .from('leads_new')
        .select('*', { count: 'exact', head: true });

      if (leadsError) throw leadsError;

      // Total partners
      const { count: totalPartners, error: partnersError } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true });

      if (partnersError) throw partnersError;

      // Leads by status and loan amounts
      const { data: statusData, error: statusError } = await supabase
        .from('leads_new')
        .select('status, loan_amount');

      if (statusError) throw statusError;

      let inPipeline = 0, sanctioned = 0, totalLoanAmount = 0;
      
      statusData?.forEach(lead => {
        totalLoanAmount += lead.loan_amount || 0;
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
        totalPartners: totalPartners || 0,
        inPipeline,
        sanctioned,
        totalLoanAmount,
      });
    } catch (error) {
      handleDatabaseError(error, { 
        description: 'Failed to load admin KPIs',
        showToast: false
      });
    } finally {
      setLoading(false);
    }
  }, [handleDatabaseError]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  return { kpis, loading, refetch: fetchKPIs };
};
