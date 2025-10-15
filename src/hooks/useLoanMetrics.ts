import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from './useErrorHandler';

export interface LoanAmountComparison {
  pipeline: number;
  sanctioned: number;
  conversionRate: number;
}

export const useLoanMetrics = () => {
  const [metrics, setMetrics] = useState<LoanAmountComparison>({
    pipeline: 0,
    sanctioned: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const { handleDatabaseError } = useErrorHandler();

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);

      const { data: leads, error } = await supabase
        .from('leads_new')
        .select('status, loan_amount');

      if (error) throw error;

      let pipelineAmount = 0;
      let sanctionedAmount = 0;

      leads?.forEach(lead => {
        const amount = lead.loan_amount || 0;
        if (lead.status === 'new' || lead.status === 'in_progress' || lead.status === 'contacted' || lead.status === 'document_review') {
          pipelineAmount += amount;
        } else if (lead.status === 'approved') {
          sanctionedAmount += amount;
        }
      });

      const conversionRate = pipelineAmount > 0 
        ? (sanctionedAmount / (pipelineAmount + sanctionedAmount)) * 100
        : 0;

      setMetrics({
        pipeline: pipelineAmount,
        sanctioned: sanctionedAmount,
        conversionRate: Math.round(conversionRate * 10) / 10
      });
    } catch (error) {
      handleDatabaseError(error, { 
        description: 'Failed to load loan metrics',
        showToast: false
      });
    } finally {
      setLoading(false);
    }
  }, [handleDatabaseError]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, refetch: fetchMetrics };
};
