/**
 * Hook to trigger AI lender recommendation
 * 
 * Automatically calls suggest-lender edge function:
 * - On lead creation
 * - On key field changes (loan_amount, university, intake, etc.)
 */

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TriggerOptions {
  leadId: string;
  studyDestination?: string;
  loanAmount?: number;
  silent?: boolean; // Don't show toast
}

interface UseLenderRecommendationTriggerReturn {
  triggerRecommendation: (options: TriggerOptions) => Promise<void>;
  isTriggering: boolean;
}

// Debounce delay in ms
const DEBOUNCE_DELAY = 2000;

// Key fields that should trigger re-run
export const RECOMMENDATION_TRIGGER_FIELDS = [
  'loan_amount',
  'study_destination',
  'loan_type',
  'loan_classification',
  'intake_month',
  'intake_year',
] as const;

export function useLenderRecommendationTrigger(): UseLenderRecommendationTriggerReturn {
  const { toast } = useToast();
  const triggeringRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerRecommendation = useCallback(async (options: TriggerOptions) => {
    const { leadId, studyDestination, loanAmount, silent = false } = options;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the trigger
    debounceTimerRef.current = setTimeout(async () => {
      if (triggeringRef.current) return;
      
      triggeringRef.current = true;
      
      try {
        console.log('[LenderRecommendation] Triggering for lead:', leadId);
        
        const { data, error } = await supabase.functions.invoke('suggest-lender', {
          body: { leadId, studyDestination, loanAmount },
        });

        if (error) throw error;

        console.log('[LenderRecommendation] Result:', data);

        if (!silent && data?.recommendation) {
          toast({
            title: 'AI Analysis Updated',
            description: `Evaluated ${data.recommendation.all_lenders_output?.length || 0} lenders`,
          });
        }
      } catch (err) {
        console.error('[LenderRecommendation] Error:', err);
        if (!silent) {
          toast({
            title: 'AI Analysis',
            description: 'Background analysis will complete shortly',
            variant: 'default',
          });
        }
      } finally {
        triggeringRef.current = false;
      }
    }, DEBOUNCE_DELAY);
  }, [toast]);

  return {
    triggerRecommendation,
    isTriggering: triggeringRef.current,
  };
}

/**
 * Check if a field change should trigger recommendation re-run
 */
export function shouldTriggerRecommendation(
  changedField: string,
  oldValue: unknown,
  newValue: unknown
): boolean {
  // Only trigger for specific fields
  if (!RECOMMENDATION_TRIGGER_FIELDS.includes(changedField as any)) {
    return false;
  }

  // Don't trigger if values are the same
  if (oldValue === newValue) {
    return false;
  }

  // For loan_amount, only trigger if change is significant (>10%)
  if (changedField === 'loan_amount' && typeof oldValue === 'number' && typeof newValue === 'number') {
    const changePercent = Math.abs((newValue - oldValue) / oldValue) * 100;
    return changePercent >= 10;
  }

  return true;
}

export default useLenderRecommendationTrigger;
