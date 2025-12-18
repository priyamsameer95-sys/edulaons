import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PartnerKPIs } from '@/types/partner';

// Status mappings for 18-step process
const PRE_LOGIN_STATUSES = [
  'new', 'lead_intake', 'first_contact', 'lenders_mapped', 
  'checklist_shared', 'docs_uploading', 'docs_submitted', 'docs_verified'
];

const IN_PIPELINE_STATUSES = [
  'contacted', 'in_progress', 'document_review',
  'logged_with_lender', 'counselling_done', 'pd_scheduled', 'pd_completed',
  'additional_docs_pending', 'property_verification', 'credit_assessment'
];

const SANCTIONED_STATUSES = [
  'approved', 'sanctioned', 'pf_pending', 'pf_paid', 'sanction_letter_issued'
];

const DISBURSEMENT_STATUSES = [
  'docs_dispatched', 'security_creation', 'ops_verification', 'disbursed'
];

export const usePartnerKPIs = (partnerId?: string, isAdmin = false) => {
  const [kpis, setKpis] = useState<PartnerKPIs>({
    totalLeads: 0,
    inPipeline: 0,
    sanctioned: 0,
    disbursed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();

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

      let inPipeline = 0, sanctioned = 0, disbursed = 0;

      leadsByStatus?.forEach((lead) => {
        const status = lead.status;
        
        // Check each status category
        if (IN_PIPELINE_STATUSES.includes(status)) {
          inPipeline++;
        } else if (SANCTIONED_STATUSES.includes(status)) {
          sanctioned++;
        } else if (status === 'disbursed') {
          disbursed++;
        }
        // PRE_LOGIN_STATUSES are not counted in any bucket (pre-pipeline)
        // Terminal statuses (rejected, withdrawn) are also not counted
      });

      setKpis({
        totalLeads: totalLeads || 0,
        inPipeline,
        sanctioned,
        disbursed,
      });
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching KPIs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [partnerId, isAdmin, toast]);

  useEffect(() => {
    fetchKPIs();

    // Set up real-time subscription
    const channel = supabase
      .channel('kpi-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads_new'
        },
        () => {
          fetchKPIs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchKPIs]);

  return { kpis, loading, lastUpdated, refetch: fetchKPIs };
};
