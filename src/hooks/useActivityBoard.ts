import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ActivityPriority = 'URGENT' | 'ATTENTION' | 'INFO' | 'SUCCESS';
export type ActivityType = 'document' | 'status' | 'lead' | 'system';

export interface ActivityItem {
  id: string;
  priority: ActivityPriority;
  type: ActivityType;
  timestamp: string;
  leadId: string;
  leadCaseId: string;
  partnerId: string;
  partnerName: string;
  studentName: string;
  message: string;
  details?: {
    oldStatus?: string;
    newStatus?: string;
    documentType?: string;
    changeReason?: string;
    changedBy?: string;
  };
  actionable: boolean;
  actionType?: 'verify_document' | 'update_status' | 'view_lead' | 'contact_partner';
}

interface ActivityBoardStats {
  urgentCount: number;
  attentionCount: number;
  todayActivitiesCount: number;
  activePartnersCount: number;
}

export function useActivityBoard() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityBoardStats>({
    urgentCount: 0,
    attentionCount: 0,
    todayActivitiesCount: 0,
    activePartnersCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const todayStart = new Date(now.setHours(0, 0, 0, 0));

      // Fetch status history activities
      const { data: statusData, error: statusError } = await supabase
        .from('lead_status_history')
        .select(`
          *,
          leads_new!inner(
            id,
            case_id,
            status,
            documents_status,
            updated_at,
            partner_id,
            partners(name),
            students(name)
          )
        `)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusError) throw statusError;

      // Fetch document activities
      const { data: docData, error: docError } = await supabase
        .from('lead_documents')
        .select(`
          *,
          document_types(name),
          leads_new!inner(
            id,
            case_id,
            status,
            documents_status,
            updated_at,
            partner_id,
            partners(name),
            students(name)
          )
        `)
        .gte('uploaded_at', sevenDaysAgo.toISOString())
        .order('uploaded_at', { ascending: false })
        .limit(100);

      if (docError) throw docError;

      // Fetch leads to check for stuck ones
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_new')
        .select(`
          *,
          partners(name),
          students(name)
        `)
        .gte('updated_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: false });

      if (leadsError) throw leadsError;

      const allActivities: ActivityItem[] = [];

      // Process status change activities
      statusData?.forEach((status: any) => {
        const lead = status.leads_new;
        if (!lead) return;

        const isRegression = 
          (status.old_status === 'approved' && status.new_status !== 'approved') ||
          (status.old_status === 'in_progress' && status.new_status === 'new');

        const priority: ActivityPriority = isRegression ? 'URGENT' : 
          status.new_status === 'approved' ? 'SUCCESS' : 'ATTENTION';

        allActivities.push({
          id: status.id,
          priority,
          type: 'status',
          timestamp: status.created_at,
          leadId: lead.id,
          leadCaseId: lead.case_id,
          partnerId: lead.partner_id,
          partnerName: lead.partners?.name || 'Unknown Partner',
          studentName: lead.students?.name || 'Unknown Student',
          message: `Status changed: ${status.old_status || 'none'} → ${status.new_status}`,
          details: {
            oldStatus: status.old_status,
            newStatus: status.new_status,
            changeReason: status.change_reason,
            changedBy: status.changed_by,
          },
          actionable: isRegression || status.new_status === 'new',
          actionType: 'view_lead',
        });
      });

      // Process document activities
      docData?.forEach((doc: any) => {
        const lead = doc.leads_new;
        if (!lead) return;

        const isPending = doc.verification_status === 'pending';
        const isRejected = doc.verification_status === 'rejected';

        const priority: ActivityPriority = isRejected ? 'URGENT' :
          isPending ? 'ATTENTION' :
          doc.verification_status === 'verified' ? 'SUCCESS' : 'INFO';

        allActivities.push({
          id: doc.id,
          priority,
          type: 'document',
          timestamp: doc.uploaded_at,
          leadId: lead.id,
          leadCaseId: lead.case_id,
          partnerId: lead.partner_id,
          partnerName: lead.partners?.name || 'Unknown Partner',
          studentName: lead.students?.name || 'Unknown Student',
          message: `Document ${doc.verification_status}: ${doc.document_types?.name || 'Unknown'}`,
          details: {
            documentType: doc.document_types?.name,
          },
          actionable: isPending || isRejected,
          actionType: 'verify_document',
        });
      });

      // Check for stuck leads (no activity in 7+ days, not approved/rejected)
      leadsData?.forEach((lead: any) => {
        const lastUpdate = new Date(lead.updated_at);
        const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceUpdate >= 7 && lead.status !== 'approved' && lead.status !== 'rejected') {
          allActivities.push({
            id: `stuck-${lead.id}`,
            priority: 'URGENT',
            type: 'lead',
            timestamp: lead.updated_at,
            leadId: lead.id,
            leadCaseId: lead.case_id,
            partnerId: lead.partner_id,
            partnerName: lead.partners?.name || 'Unknown Partner',
            studentName: lead.students?.name || 'Unknown Student',
            message: `⚠️ Lead stuck for ${daysSinceUpdate} days`,
            actionable: true,
            actionType: 'view_lead',
          });
        }
      });

      // Sort by priority and then by timestamp
      const priorityOrder: Record<ActivityPriority, number> = {
        URGENT: 0,
        ATTENTION: 1,
        INFO: 2,
        SUCCESS: 3,
      };

      allActivities.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setActivities(allActivities);

      // Calculate stats
      const urgentCount = allActivities.filter(a => a.priority === 'URGENT').length;
      const attentionCount = allActivities.filter(a => a.priority === 'ATTENTION').length;
      const todayActivitiesCount = allActivities.filter(
        a => new Date(a.timestamp) >= todayStart
      ).length;
      const activePartners = new Set(allActivities.map(a => a.partnerId)).size;

      setStats({
        urgentCount,
        attentionCount,
        todayActivitiesCount,
        activePartnersCount: activePartners,
      });

    } catch (err) {
      console.error('Error fetching activity board:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Set up real-time subscriptions
    const statusChannel = supabase
      .channel('activity_board_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_status_history',
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    const docChannel = supabase
      .channel('activity_board_docs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_documents',
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    const leadsChannel = supabase
      .channel('activity_board_leads')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads_new',
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(docChannel);
      supabase.removeChannel(leadsChannel);
    };
  }, []);

  return {
    activities,
    stats,
    loading,
    error,
    refetch: fetchActivities,
  };
}
