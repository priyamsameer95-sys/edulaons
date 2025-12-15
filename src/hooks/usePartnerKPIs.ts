import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PartnerKPIs } from '@/types/partner';

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
