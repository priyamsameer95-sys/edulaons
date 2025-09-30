import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface NewLeadItem {
  id: string;
  case_id: string;
  student_name: string;
  partner_name: string;
  loan_amount: number;
  days_since_created: number;
  created_at: string;
}

export interface DocumentActionItem {
  id: string;
  lead_id: string;
  case_id: string;
  student_name: string;
  document_type_name: string;
  uploaded_at: string;
  verification_status: string;
  uploaded_by: string;
  days_waiting: number;
}

export interface AdminActionStats {
  newLeadsCount: number;
  documentsAwaitingCount: number;
  totalPendingValue: number;
}

export function useAdminActionItems() {
  const { user, appUser } = useAuth();
  const [newLeads, setNewLeads] = useState<NewLeadItem[]>([]);
  const [documentsAwaiting, setDocumentsAwaiting] = useState<DocumentActionItem[]>([]);
  const [stats, setStats] = useState<AdminActionStats>({
    newLeadsCount: 0,
    documentsAwaitingCount: 0,
    totalPendingValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNewLeads = async () => {
    try {
      const { data, error: leadsError } = await supabase
        .from('leads_new')
        .select(`
          id,
          case_id,
          loan_amount,
          created_at,
          students (name),
          partners (name)
        `)
        .eq('status', 'new')
        .order('created_at', { ascending: true });

      if (leadsError) throw leadsError;

      const leads: NewLeadItem[] = (data || []).map(lead => {
        const daysOld = Math.floor(
          (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return {
          id: lead.id,
          case_id: lead.case_id,
          student_name: lead.students?.name || 'N/A',
          partner_name: lead.partners?.name || 'N/A',
          loan_amount: Number(lead.loan_amount) || 0,
          days_since_created: daysOld,
          created_at: lead.created_at,
        };
      });

      setNewLeads(leads);
      return leads;
    } catch (err) {
      console.error('Error fetching new leads:', err);
      throw err;
    }
  };

  const fetchDocumentsAwaiting = async () => {
    try {
      const { data, error: docsError } = await supabase
        .from('lead_documents')
        .select(`
          id,
          lead_id,
          verification_status,
          uploaded_at,
          uploaded_by,
          leads_new!lead_id (
            case_id,
            students (name)
          ),
          document_types (name)
        `)
        .in('verification_status', ['uploaded', 'resubmission_required'])
        .order('uploaded_at', { ascending: true });

      if (docsError) throw docsError;

      const documents: DocumentActionItem[] = (data || []).map(doc => {
        const daysWaiting = Math.floor(
          (Date.now() - new Date(doc.uploaded_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: doc.id,
          lead_id: doc.lead_id,
          case_id: doc.leads_new?.case_id || 'N/A',
          student_name: doc.leads_new?.students?.name || 'N/A',
          document_type_name: doc.document_types?.name || 'Unknown Document',
          uploaded_at: doc.uploaded_at,
          verification_status: doc.verification_status,
          uploaded_by: doc.uploaded_by || 'student',
          days_waiting: daysWaiting,
        };
      });

      setDocumentsAwaiting(documents);
      return documents;
    } catch (err) {
      console.error('Error fetching documents awaiting:', err);
      throw err;
    }
  };

  const fetchData = async () => {
    // Check authentication first
    if (!user || !appUser) {
      console.log('❌ [useAdminActionItems] No authenticated user:', { user: !!user, appUser: !!appUser });
      setLoading(false);
      setError('Authentication required');
      return;
    }

    console.log('✅ [useAdminActionItems] Fetching with user:', { 
      userId: user.id, 
      role: appUser.role,
      isActive: appUser.is_active 
    });

    setLoading(true);
    setError(null);
    
    try {
      const [leads, docs] = await Promise.all([
        fetchNewLeads(),
        fetchDocumentsAwaiting(),
      ]);

      console.log('✅ [useAdminActionItems] Fetched data:', { 
        leadsCount: leads.length, 
        docsCount: docs.length 
      });

      const totalPendingValue = leads.reduce((sum, lead) => sum + lead.loan_amount, 0);

      setStats({
        newLeadsCount: leads.length,
        documentsAwaitingCount: docs.length,
        totalPendingValue,
      });
    } catch (err) {
      console.error('❌ [useAdminActionItems] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch action items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user and appUser are available
    if (user && appUser) {
      fetchData();

      // Set up real-time subscriptions
      const leadsChannel = supabase
        .channel('admin-action-leads')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads_new',
            filter: 'status=eq.new',
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      const docsChannel = supabase
        .channel('admin-action-documents')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lead_documents',
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(leadsChannel);
        supabase.removeChannel(docsChannel);
      };
    } else {
      console.log('⏳ [useAdminActionItems] Waiting for authentication...');
      setLoading(false);
    }
  }, [user, appUser]);

  return {
    newLeads,
    documentsAwaiting,
    stats,
    loading,
    error,
    refetch: fetchData,
  };
}
