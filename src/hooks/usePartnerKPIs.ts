import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PartnerKPIs } from '@/types/partner';

// Status mappings for 18-step process
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
  
  // Debounce timer ref for real-time updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialFetchRef = useRef(true);

  const fetchKPIs = useCallback(async (showLoading = true) => {
    try {
      if (showLoading && isInitialFetchRef.current) {
        setLoading(true);
      }
      
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
      });

      setKpis({
        totalLeads: totalLeads || 0,
        inPipeline,
        sanctioned,
        disbursed,
      });
      setLastUpdated(new Date());
      isInitialFetchRef.current = false;

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

  // Debounced refetch for real-time updates (500ms debounce for KPIs)
  const debouncedRefetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchKPIs(false); // Don't show loading for real-time updates
    }, 500);
  }, [fetchKPIs]);

  const refetch = useCallback(() => {
    isInitialFetchRef.current = true;
    fetchKPIs(true);
  }, [fetchKPIs]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  // Set up real-time subscription with debouncing
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
          debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [partnerId, isAdmin, debouncedRefetch]);

  return { kpis, loading, lastUpdated, refetch };
};
