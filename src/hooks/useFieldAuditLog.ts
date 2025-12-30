import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FieldAuditEntry {
  id: string;
  lead_id: string;
  table_name: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by_id: string | null;
  changed_by_name: string | null;
  changed_by_type: string;
  change_source: string;
  change_reason: string | null;
  created_at: string;
}

export function useFieldAuditLog(leadId: string | undefined) {
  return useQuery({
    queryKey: ['field-audit-log', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from('field_audit_log')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching field audit log:', error);
        throw error;
      }
      
      return data as FieldAuditEntry[];
    },
    enabled: !!leadId,
  });
}
