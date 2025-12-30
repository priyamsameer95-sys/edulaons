import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DataAccessEntry {
  id: string;
  user_id: string | null;
  user_email: string;
  user_role: string;
  table_name: string;
  action: string;
  record_count: number | null;
  accessed_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  partner_id: string | null;
}

export function useDataAccessLog(leadId: string | undefined) {
  return useQuery({
    queryKey: ['data-access-log', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      // Query data_access_logs for this specific lead
      // The action field contains 'view_lead' and we need to filter for this lead
      const { data, error } = await supabase
        .from('data_access_logs')
        .select('*')
        .eq('table_name', 'leads_new')
        .eq('action', 'view_lead')
        .order('accessed_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching data access log:', error);
        throw error;
      }
      
      // Note: Currently data_access_logs doesn't store lead_id directly
      // In a future migration, we could add a lead_id column for better filtering
      return data as DataAccessEntry[];
    },
    enabled: !!leadId,
  });
}
