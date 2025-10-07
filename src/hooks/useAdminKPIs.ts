import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Admin KPIs data structure
 */
export interface AdminKPIs {
  totalLeads: number;
  totalPartners: number;
  inPipeline: number;
  sanctioned: number;
  disbursed: number;
  totalLoanAmount: number;
}

/**
 * Loan amount comparison data structure
 */
export interface LoanAmountComparison {
  pipeline: number;
  sanctioned: number;
  conversionRate: number;
}

/**
 * Custom hook for fetching and managing Admin Dashboard KPIs
 * Handles all KPI-related data fetching and calculations
 * 
 * @returns {Object} KPI data, loan comparison, loading state, and fetch functions
 */
export const useAdminKPIs = () => {
  const { toast } = useToast();
  const [kpis, setKpis] = useState<AdminKPIs>({
    totalLeads: 0,
    totalPartners: 0,
    inPipeline: 0,
    sanctioned: 0,
    disbursed: 0,
    totalLoanAmount: 0,
  });
  const [loanComparison, setLoanComparison] = useState<LoanAmountComparison>({
    pipeline: 0,
    sanctioned: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(false);

  /**
   * Fetch main KPI metrics from database
   * Calculates total leads, partners, status distribution, and total loan amount
   */
  const fetchKPIs = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch total leads count
      const { count: totalLeads } = await supabase
        .from('leads_new')
        .select('*', { count: 'exact', head: true });

      // Fetch total partners count
      const { count: totalPartners } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true });

      // Fetch leads by status for detailed metrics
      const { data: leadsByStatus } = await supabase
        .from('leads_new')
        .select('status, loan_amount');

      let inPipeline = 0, sanctioned = 0, disbursed = 0, totalLoanAmount = 0;

      leadsByStatus?.forEach((lead) => {
        totalLoanAmount += Number(lead.loan_amount) || 0;
        
        switch (lead.status) {
          case 'new':
          case 'in_progress':
            inPipeline++;
            break;
          case 'approved':
            sanctioned++;
            break;
          // Note: 'disbursed' status doesn't exist in current enum
        }
      });

      setKpis({
        totalLeads: totalLeads || 0,
        totalPartners: totalPartners || 0,
        inPipeline,
        sanctioned,
        disbursed,
        totalLoanAmount,
      });
    } catch (error) {
      console.error('Error fetching admin KPIs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Fetch loan amount comparison data
   * Calculates pipeline vs sanctioned amounts and conversion rate
   */
  const fetchLoanComparison = useCallback(async () => {
    try {
      const { data: leads } = await supabase
        .from('leads_new')
        .select('status, loan_amount');

      let pipelineAmount = 0;
      let sanctionedAmount = 0;

      leads?.forEach((lead) => {
        const amount = Number(lead.loan_amount) || 0;
        if (lead.status === 'new' || lead.status === 'in_progress') {
          pipelineAmount += amount;
        } else if (lead.status === 'approved') {
          sanctionedAmount += amount;
        }
      });

      const conversionRate = pipelineAmount > 0 ? 
        Math.round((sanctionedAmount / (pipelineAmount + sanctionedAmount)) * 100) : 0;

      setLoanComparison({
        pipeline: pipelineAmount,
        sanctioned: sanctionedAmount,
        conversionRate
      });
    } catch (error) {
      console.error('Error fetching loan comparison:', error);
    }
  }, []);

  /**
   * Refresh all KPI data
   * Fetches both main KPIs and loan comparison data
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([fetchKPIs(), fetchLoanComparison()]);
  }, [fetchKPIs, fetchLoanComparison]);

  return {
    kpis,
    loanComparison,
    loading,
    fetchKPIs,
    fetchLoanComparison,
    refreshAll,
  };
};
