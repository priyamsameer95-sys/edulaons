import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QuickStats {
  totalLeads: number;
  newThisWeek: number;
  inPipeline: number;
  disbursed: number;
  totalPipelineValue: number;
  disbursedValue: number;
}

const PIPELINE_STATUSES = [
  'lead_intake', 'first_contact', 'lenders_mapped', 'checklist_shared',
  'docs_uploading', 'docs_submitted', 'docs_verified', 'logged_with_lender',
  'counselling_done', 'pd_scheduled', 'pd_completed', 'additional_docs_pending',
  'property_verification', 'credit_assessment', 'sanctioned', 'pf_pending', 'pf_paid'
];

export const useQuickStats = () => {
  const [stats, setStats] = useState<QuickStats>({
    totalLeads: 0,
    newThisWeek: 0,
    inPipeline: 0,
    disbursed: 0,
    totalPipelineValue: 0,
    disbursedValue: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // Get all leads with status and loan_amount
      const { data: leads, error } = await supabase
        .from('leads_new')
        .select('status, loan_amount, created_at');

      if (error) throw error;

      // Calculate stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      let totalLeads = 0;
      let newThisWeek = 0;
      let inPipeline = 0;
      let disbursed = 0;
      let totalPipelineValue = 0;
      let disbursedValue = 0;

      leads?.forEach(lead => {
        totalLeads++;
        
        const createdAt = new Date(lead.created_at);
        if (createdAt >= oneWeekAgo) {
          newThisWeek++;
        }

        if (lead.status === 'disbursed') {
          disbursed++;
          disbursedValue += lead.loan_amount || 0;
        } else if (PIPELINE_STATUSES.includes(lead.status)) {
          inPipeline++;
          totalPipelineValue += lead.loan_amount || 0;
        }
      });

      setStats({
        totalLeads,
        newThisWeek,
        inPipeline,
        disbursed,
        totalPipelineValue,
        disbursedValue,
      });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
};
