import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Clarification {
  id: string;
  lead_id: string;
  question_type: 'document' | 'information' | 'lender_specific' | 'conditional';
  question_text: string;
  question_context: string | null;
  document_id: string | null;
  field_name: string | null;
  created_by: string | null;
  created_by_role: 'admin' | 'partner' | 'system' | null;
  created_at: string;
  response_type: 'text' | 'document' | 'both';
  response_text: string | null;
  response_document_id: string | null;
  responded_at: string | null;
  status: 'pending' | 'answered' | 'resolved' | 'dismissed';
  is_blocking: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  updated_at: string;
}

export interface ClarificationTemplate {
  id: string;
  category: 'document' | 'personal' | 'academic' | 'co_applicant' | 'lender';
  question_text: string;
  question_context: string | null;
  requires_document: boolean;
  expected_document_type: string | null;
  response_type: 'text' | 'document' | 'both';
  display_order: number;
}

interface UseClarificationsOptions {
  leadId?: string | null;
  statusFilter?: 'pending' | 'answered' | 'resolved' | 'dismissed' | 'all';
}

export function useClarifications(options: UseClarificationsOptions = {}) {
  const { leadId, statusFilter = 'all' } = options;
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [templates, setTemplates] = useState<ClarificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchClarifications = useCallback(async () => {
    if (!leadId) {
      setClarifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('student_clarifications')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setClarifications((data || []) as Clarification[]);
    } catch (err: any) {
      console.error('Error fetching clarifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [leadId, statusFilter]);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('clarification_templates')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;
      setTemplates((data || []) as ClarificationTemplate[]);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
    }
  }, []);

  useEffect(() => {
    fetchClarifications();
    fetchTemplates();
  }, [fetchClarifications, fetchTemplates]);

  const createClarification = async (data: {
    lead_id: string;
    question_type: Clarification['question_type'];
    question_text: string;
    question_context?: string;
    response_type?: Clarification['response_type'];
    is_blocking?: boolean;
    priority?: Clarification['priority'];
    due_date?: string;
    document_id?: string;
    field_name?: string;
    created_by?: string;
    created_by_role?: 'admin' | 'partner' | 'system';
  }) => {
    try {
      const { data: result, error: insertError } = await supabase
        .from('student_clarifications')
        .insert({
          lead_id: data.lead_id,
          question_type: data.question_type,
          question_text: data.question_text,
          question_context: data.question_context || null,
          response_type: data.response_type || 'text',
          is_blocking: data.is_blocking || false,
          priority: data.priority || 'normal',
          due_date: data.due_date || null,
          document_id: data.document_id || null,
          field_name: data.field_name || null,
          created_by: data.created_by || null,
          created_by_role: data.created_by_role || 'admin',
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: 'Clarification Created',
        description: 'The student will be notified about this question.',
      });

      await fetchClarifications();
      return result as Clarification;
    } catch (err: any) {
      console.error('Error creating clarification:', err);
      toast({
        title: 'Error',
        description: 'Failed to create clarification.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const respondToClarification = async (
    clarificationId: string,
    response: { text?: string; document_id?: string }
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('student_clarifications')
        .update({
          response_text: response.text || null,
          response_document_id: response.document_id || null,
          responded_at: new Date().toISOString(),
          status: 'answered',
        })
        .eq('id', clarificationId);

      if (updateError) throw updateError;

      toast({
        title: 'Response Submitted',
        description: 'Your response has been recorded.',
      });

      await fetchClarifications();
    } catch (err: any) {
      console.error('Error responding to clarification:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit response.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const resolveClarification = async (
    clarificationId: string,
    notes?: string,
    resolvedBy?: string
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('student_clarifications')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy || null,
          resolution_notes: notes || null,
        })
        .eq('id', clarificationId);

      if (updateError) throw updateError;

      toast({
        title: 'Clarification Resolved',
        description: 'The clarification has been marked as resolved.',
      });

      await fetchClarifications();
    } catch (err: any) {
      console.error('Error resolving clarification:', err);
      toast({
        title: 'Error',
        description: 'Failed to resolve clarification.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const dismissClarification = async (clarificationId: string, reason?: string) => {
    try {
      const { error: updateError } = await supabase
        .from('student_clarifications')
        .update({
          status: 'dismissed',
          resolution_notes: reason || 'Dismissed by admin',
        })
        .eq('id', clarificationId);

      if (updateError) throw updateError;

      toast({
        title: 'Clarification Dismissed',
        description: 'The clarification has been dismissed.',
      });

      await fetchClarifications();
    } catch (err: any) {
      console.error('Error dismissing clarification:', err);
      throw err;
    }
  };

  const pendingCount = clarifications.filter((c) => c.status === 'pending').length;
  const blockingCount = clarifications.filter((c) => c.is_blocking && c.status === 'pending').length;

  return {
    clarifications,
    templates,
    loading,
    error,
    pendingCount,
    blockingCount,
    refetch: fetchClarifications,
    createClarification,
    respondToClarification,
    resolveClarification,
    dismissClarification,
  };
}

// Hook for fetching field audit log
export function useFieldAuditLog(leadId: string | null) {
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuditLog() {
      if (!leadId) {
        setAuditLog([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('field_audit_log')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAuditLog(data || []);
      } catch (err) {
        console.error('Error fetching audit log:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAuditLog();
  }, [leadId]);

  return { auditLog, loading };
}
