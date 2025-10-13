import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LoanBand {
  min_percent: number;
  max_percent: number;
}

export interface RateTier {
  min: number;
  max: number;
  score_threshold: number;
}

export interface LenderConfig {
  id?: string;
  lender_id: string;
  max_loan_amount: number;
  loan_bands: {
    '90-100': LoanBand;
    '75-89': LoanBand;
    '60-74': LoanBand;
    '0-59': LoanBand;
  };
  rate_config: {
    excellent: RateTier;
    good: RateTier;
    average: RateTier;
    below_average: RateTier;
  };
  university_grade_mapping: Record<string, string>;
}

const DEFAULT_CONFIG: Omit<LenderConfig, 'id' | 'lender_id'> = {
  max_loan_amount: 5000000,
  loan_bands: {
    '90-100': { min_percent: 90, max_percent: 100 },
    '75-89': { min_percent: 75, max_percent: 89 },
    '60-74': { min_percent: 60, max_percent: 74 },
    '0-59': { min_percent: 0, max_percent: 59 },
  },
  rate_config: {
    excellent: { min: 11.0, max: 12.0, score_threshold: 90 },
    good: { min: 12.0, max: 13.5, score_threshold: 75 },
    average: { min: 13.5, max: 15.0, score_threshold: 60 },
    below_average: { min: 15.0, max: 16.0, score_threshold: 0 },
  },
  university_grade_mapping: {},
};

export const useLenderConfig = (lenderId: string | null) => {
  const [config, setConfig] = useState<LenderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (lenderId) {
      fetchConfig();
    }
  }, [lenderId]);

  const fetchConfig = async () => {
    if (!lenderId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lender_config')
        .select('*')
        .eq('lender_id', lenderId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          id: data.id,
          lender_id: data.lender_id,
          max_loan_amount: data.max_loan_amount,
          loan_bands: data.loan_bands as any,
          rate_config: data.rate_config as any,
          university_grade_mapping: (data.university_grade_mapping as any) || {},
        });
      } else {
        // Create default config if none exists
        const defaultConfig = {
          lender_id: lenderId,
          ...DEFAULT_CONFIG,
        };
        setConfig(defaultConfig);
      }
    } catch (error: any) {
      console.error('Error fetching lender config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lender configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updatedConfig: Partial<LenderConfig>) => {
    if (!lenderId) return false;

    try {
      const configToSave = { ...config, ...updatedConfig, lender_id: lenderId };

      const { error } = await supabase
        .from('lender_config')
        .upsert({
          lender_id: configToSave.lender_id,
          max_loan_amount: configToSave.max_loan_amount,
          loan_bands: configToSave.loan_bands as any,
          rate_config: configToSave.rate_config as any,
          university_grade_mapping: configToSave.university_grade_mapping as any,
        }, { onConflict: 'lender_id' });

      if (error) throw error;

      setConfig(configToSave as LenderConfig);
      
      toast({
        title: 'Success',
        description: 'Lender configuration updated successfully',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating lender config:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lender configuration',
        variant: 'destructive',
      });
      return false;
    }
  };

  return { config, loading, updateConfig, refetch: fetchConfig };
};
