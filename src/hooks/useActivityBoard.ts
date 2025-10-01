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

      console.log('[ActivityBoard] Starting to fetch activities...');

      // Use UTC dates consistently
      const now = new Date();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      console.log('[ActivityBoard] Date range:', {
        now: now.toISOString(),
        sevenDaysAgo: sevenDaysAgo.toISOString(),
        thirtyDaysAgo: thirtyDaysAgo.toISOString(),
      });

      // Fetch status history activities - use explicit foreign key
      const { data: statusData, error: statusError } = await supabase
        .from('lead_status_history')
        .select(`
          *,
          leads_new!lead_status_history_lead_id_fkey(
            id,
            case_id,
            status,
            documents_status,
            updated_at,
            created_at,
            partner_id,
            partners!leads_new_partner_id_fkey(name),
            students!leads_new_student_id_fkey(name)
          )
        `)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusError) {
        console.error('[ActivityBoard] Status history error:', statusError);
        throw statusError;
      }
      console.log('[ActivityBoard] Status data fetched:', statusData?.length || 0, 'records');

      // Fetch document activities - specify the foreign key relationship
      const { data: docData, error: docError } = await supabase
        .from('lead_documents')
        .select(`
          *,
          document_types(name),
          leads_new!lead_documents_lead_id_fkey(
            id,
            case_id,
            status,
            documents_status,
            updated_at,
            created_at,
            partner_id,
            partners!leads_new_partner_id_fkey(name),
            students!leads_new_student_id_fkey(name)
          )
        `)
        .gte('uploaded_at', sevenDaysAgo.toISOString())
        .order('uploaded_at', { ascending: false })
        .limit(100);

      if (docError) {
        console.error('[ActivityBoard] Document error:', docError);
        throw docError;
      }
      console.log('[ActivityBoard] Document data fetched:', docData?.length || 0, 'records');

      // Fetch leads - use created_at to catch new leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_new')
        .select(`
          *,
          partners!leads_new_partner_id_fkey(name),
          students!leads_new_student_id_fkey(name)
        `)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.error('[ActivityBoard] Leads error:', leadsError);
        throw leadsError;
      }
      console.log('[ActivityBoard] Leads data fetched:', leadsData?.length || 0, 'records');

      const allActivities: ActivityItem[] = [];

      console.log('[ActivityBoard] Processing activities...');

      // Process status change activities
      statusData?.forEach((status: any) => {
        const lead = status.leads_new;
        if (!lead) {
          console.warn('[ActivityBoard] Status change missing lead relationship:', status.id);
          return;
        }

        // Validate partner and student data
        const partnerName = lead.partners?.name || 'Unknown Partner';
        const studentName = lead.students?.name || 'Unknown Student';
        const partnerId = lead.partner_id || 'unknown';

        // Skip if status didn't actually change
        if (status.old_status === status.new_status) return;
        
        // Skip if both old and new status are null/undefined
        if (!status.old_status && !status.new_status) return;

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
          leadCaseId: lead.case_id || 'N/A',
          partnerId,
          partnerName,
          studentName,
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
        if (!lead) {
          console.warn('[ActivityBoard] Document missing lead relationship:', doc.id);
          return;
        }

        // Validate partner and student data
        const partnerName = lead.partners?.name || 'Unknown Partner';
        const studentName = lead.students?.name || 'Unknown Student';
        const partnerId = lead.partner_id || 'unknown';

        const isPending = doc.verification_status === 'pending';
        const isRejected = doc.verification_status === 'rejected';

        const priority: ActivityPriority = isRejected ? 'URGENT' :
          isPending ? 'ATTENTION' :
          doc.verification_status === 'verified' ? 'SUCCESS' : 'INFO';

        allActivities.push({
          id: doc.id,
          priority,
          type: 'document',
          timestamp: doc.uploaded_at || new Date().toISOString(),
          leadId: lead.id,
          leadCaseId: lead.case_id || 'N/A',
          partnerId,
          partnerName,
          studentName,
          message: `Document ${doc.verification_status}: ${doc.document_types?.name || 'Unknown'}`,
          details: {
            documentType: doc.document_types?.name,
          },
          actionable: isPending || isRejected,
          actionType: 'verify_document',
        });
      });

      // Process leads for new and stuck activities
      leadsData?.forEach((lead: any) => {
        // Validate partner and student data
        const partnerName = lead.partners?.name || 'Unknown Partner';
        const studentName = lead.students?.name || 'Unknown Student';
        const partnerId = lead.partner_id || 'unknown';

        // Safely parse dates with validation
        const lastUpdate = lead.updated_at ? new Date(lead.updated_at) : new Date();
        const createdDate = lead.created_at ? new Date(lead.created_at) : new Date();
        
        // Validate dates
        if (isNaN(lastUpdate.getTime()) || isNaN(createdDate.getTime())) {
          console.warn('[ActivityBoard] Invalid date for lead:', lead.id);
          return;
        }

        const nowTime = Date.now();
        const daysSinceUpdate = Math.floor((nowTime - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceCreation = Math.floor((nowTime - createdDate.getTime()) / (1000 * 60 * 60 * 24));

        // Show newly created leads (within last 7 days)
        if (daysSinceCreation <= 7) {
          console.log(`[ActivityBoard] New lead detected: ${lead.case_id}, created ${daysSinceCreation} days ago`);
          allActivities.push({
            id: `new-${lead.id}`,
            priority: lead.status === 'new' ? 'ATTENTION' : 'INFO',
            type: 'lead',
            timestamp: lead.created_at,
            leadId: lead.id,
            leadCaseId: lead.case_id || 'N/A',
            partnerId,
            partnerName,
            studentName,
            message: `🆕 New lead created`,
            actionable: lead.status === 'new',
            actionType: 'view_lead',
          });
        }

        // Check for stuck leads (no activity in 7+ days, not approved/rejected)
        if (daysSinceUpdate >= 7 && lead.status !== 'approved' && lead.status !== 'rejected') {
          console.log(`[ActivityBoard] Stuck lead detected: ${lead.case_id}, no update for ${daysSinceUpdate} days`);
          allActivities.push({
            id: `stuck-${lead.id}`,
            priority: 'URGENT',
            type: 'lead',
            timestamp: lead.updated_at,
            leadId: lead.id,
            leadCaseId: lead.case_id || 'N/A',
            partnerId,
            partnerName,
            studentName,
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

      console.log('[ActivityBoard] Total activities processed:', allActivities.length);
      console.log('[ActivityBoard] Activities by priority:', {
        URGENT: allActivities.filter(a => a.priority === 'URGENT').length,
        ATTENTION: allActivities.filter(a => a.priority === 'ATTENTION').length,
        INFO: allActivities.filter(a => a.priority === 'INFO').length,
        SUCCESS: allActivities.filter(a => a.priority === 'SUCCESS').length,
      });

      setActivities(allActivities);

      // Calculate stats
      const urgentCount = allActivities.filter(a => a.priority === 'URGENT').length;
      const attentionCount = allActivities.filter(a => a.priority === 'ATTENTION').length;
      const todayActivitiesCount = allActivities.filter(
        a => a.timestamp && new Date(a.timestamp) >= todayStart
      ).length;
      const activePartners = new Set(
        allActivities.map(a => a.partnerId).filter(id => id && id !== 'unknown')
      ).size;

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
