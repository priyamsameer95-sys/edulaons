import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PartnerKPIs } from '@/types/partner';

const IN_PIPELINE_STATUSES = [
  'contacted', 'in_progress', 'document_review',
  'logged_with_lender', 'counselling_done', 'pd_scheduled', 'pd_completed',
  'additional_docs_pending', 'property_verification', 'credit_assessment'
];

const SANCTIONED_STATUSES = [
  'approved', 'sanctioned', 'pf_pending', 'pf_paid', 'sanction_letter_issued'
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchKPIs = useCallback(async () => {
    try {
      setLoading(true);
      
      let totalQuery = supabase.from('leads_new').select('*', { count: 'exact', head: true });
      let statusQuery = supabase.from('leads_new').select('status, loan_amount');
      
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
        if (IN_PIPELINE_STATUSES.includes(status)) {
          inPipeline++;
        } else if (SANCTIONED_STATUSES.includes(status)) {
          sanctioned++;
        } else if (status === 'disbursed') {
          disbursed++;
        }
      });

      setKpis({ totalLeads: totalLeads || 0, inPipeline, sanctioned, disbursed });
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

  const refetch = useCallback(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  // Initial fetch
  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  // Real-time subscription with debouncing
  useEffect(() => {
    const channelName = partnerId ? `kpi_partner_${partnerId}` : 'kpi_all';
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads_new',
          ...(partnerId && !isAdmin ? { filter: `partner_id=eq.${partnerId}` } : {})
        },
        () => {
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }
          debounceRef.current = setTimeout(() => {
            fetchKPIs();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [partnerId, isAdmin, fetchKPIs]);

  return { kpis, loading, lastUpdated, refetch };
};
