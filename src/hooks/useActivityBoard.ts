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

      console.log('🔍 [ActivityBoard] Starting fetch...');

      const allActivities: ActivityItem[] = [];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch status changes
      console.log('📊 Fetching status changes...');
      const { data: statusData, error: statusError } = await supabase
        .from('lead_status_history')
        .select('*')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusError) {
        console.error('❌ Status error:', statusError);
      } else {
        console.log('✅ Status data:', statusData?.length || 0);

        // Process status changes
        for (const status of statusData || []) {
          if (!status.created_at) continue;

          // Fetch lead info separately
          const { data: leadData, error: leadError } = await supabase
            .from('leads_new')
            .select('id, case_id, partner_id, student_id')
            .eq('id', status.lead_id)
            .maybeSingle();

          if (leadError) {
            console.error('❌ Lead fetch error:', leadError, 'for lead_id:', status.lead_id);
            continue;
          }
          if (!leadData) {
            console.warn('⚠️ No lead data found for lead_id:', status.lead_id);
            continue;
          }

          // Fetch partner info
          const { data: partnerData, error: partnerError } = await supabase
            .from('partners')
            .select('name')
            .eq('id', leadData.partner_id)
            .maybeSingle();

          if (partnerError) {
            console.error('❌ Partner fetch error:', partnerError, 'for partner_id:', leadData.partner_id);
          }

          // Fetch student info
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('name')
            .eq('id', leadData.student_id)
            .maybeSingle();

          if (studentError) {
            console.error('❌ Student fetch error:', studentError, 'for student_id:', leadData.student_id);
          }

          const priority: ActivityPriority =
            status.new_status === 'rejected' ? 'URGENT' :
            status.new_status === 'approved' ? 'SUCCESS' :
            'ATTENTION';

          allActivities.push({
            id: status.id,
            priority,
            type: 'status',
            timestamp: status.created_at,
            leadId: leadData.id,
            leadCaseId: leadData.case_id || 'N/A',
            partnerId: leadData.partner_id || 'unknown',
            partnerName: partnerData?.name || 'Unknown Partner',
            studentName: studentData?.name || 'Unknown Student',
            message: `Status changed: ${status.old_status || 'none'} → ${status.new_status}`,
            details: {
              oldStatus: status.old_status,
              newStatus: status.new_status,
              changeReason: status.change_reason,
            },
            actionable: true,
            actionType: 'view_lead',
          });
        }
        console.log('✅ Processed status activities:', allActivities.filter(a => a.type === 'status').length);
      }

      // Fetch leads for new lead activities
      console.log('📋 Fetching leads...');
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_new')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (leadsError) {
        console.error('❌ Leads error:', leadsError);
      } else {
        console.log('✅ Leads data:', leadsData?.length || 0);

        for (const lead of leadsData || []) {
          if (!lead.created_at) continue;

          const createdDate = new Date(lead.created_at);
          const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

          // Show leads created in last 7 days
          if (daysSinceCreation <= 7) {
            // Fetch partner info
            const { data: partnerData, error: partnerError } = await supabase
              .from('partners')
              .select('name')
              .eq('id', lead.partner_id)
              .maybeSingle();

            if (partnerError) {
              console.error('❌ Partner fetch error for lead:', partnerError, 'partner_id:', lead.partner_id);
            }

            // Fetch student info
            const { data: studentData, error: studentError } = await supabase
              .from('students')
              .select('name')
              .eq('id', lead.student_id)
              .maybeSingle();

            if (studentError) {
              console.error('❌ Student fetch error for lead:', studentError, 'student_id:', lead.student_id);
            }

            allActivities.push({
              id: `new-${lead.id}`,
              priority: 'INFO',
              type: 'lead',
              timestamp: lead.created_at,
              leadId: lead.id,
              leadCaseId: lead.case_id || 'N/A',
              partnerId: lead.partner_id || 'unknown',
              partnerName: partnerData?.name || 'Unknown Partner',
              studentName: studentData?.name || 'Unknown Student',
              message: '🆕 New lead created',
              actionable: true,
              actionType: 'view_lead',
            });
          }
        }
        console.log('✅ Processed lead activities:', allActivities.filter(a => a.type === 'lead').length);
      }

      // Sort by priority and timestamp
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

      console.log('✅ Total activities:', allActivities.length);
      console.log('📈 Breakdown:', {
        URGENT: allActivities.filter(a => a.priority === 'URGENT').length,
        ATTENTION: allActivities.filter(a => a.priority === 'ATTENTION').length,
        INFO: allActivities.filter(a => a.priority === 'INFO').length,
        SUCCESS: allActivities.filter(a => a.priority === 'SUCCESS').length,
      });

      setActivities(allActivities);

      // Calculate stats
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      setStats({
        urgentCount: allActivities.filter(a => a.priority === 'URGENT').length,
        attentionCount: allActivities.filter(a => a.priority === 'ATTENTION').length,
        todayActivitiesCount: allActivities.filter(
          a => new Date(a.timestamp) >= todayStart
        ).length,
        activePartnersCount: new Set(
          allActivities.map(a => a.partnerId).filter(id => id && id !== 'unknown')
        ).size,
      });

    } catch (err) {
      console.error('❌ Critical error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
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
        { event: '*', schema: 'public', table: 'lead_status_history' },
        () => fetchActivities()
      )
      .subscribe();

    const leadsChannel = supabase
      .channel('activity_board_leads')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads_new' },
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
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