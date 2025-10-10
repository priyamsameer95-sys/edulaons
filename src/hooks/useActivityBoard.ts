import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/** Priority levels for activity items */
export type ActivityPriority = 'URGENT' | 'ATTENTION' | 'INFO' | 'SUCCESS';

/** Types of activities that can occur */
export type ActivityType = 'document' | 'status' | 'lead' | 'system';

/** Main activity item interface */
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

/** Statistics for the activity board */
interface ActivityBoardStats {
  urgentCount: number;
  attentionCount: number;
  todayActivitiesCount: number;
  activePartnersCount: number;
}

/** Database response types with proper typing */
interface LeadWithRelations {
  id: string;
  case_id: string;
  created_at: string;
  partner_id: string | null;
  student_id: string;
  partners: { name: string } | null;
  students: { name: string } | null;
}

interface StatusChangeWithRelations {
  id: string;
  created_at: string;
  old_status: string | null;
  new_status: string;
  change_reason: string | null;
  lead_id: string;
  leads_new: LeadWithRelations | null;
}

/** Configuration constants */
const ACTIVITY_CONFIG = {
  LOOKBACK_DAYS: 7,
  MAX_STATUS_ITEMS: 100,
  MAX_LEAD_ITEMS: 50,
} as const;

/** Priority order for sorting (lower number = higher priority) */
const PRIORITY_ORDER: Record<ActivityPriority, number> = {
  URGENT: 0,
  ATTENTION: 1,
  INFO: 2,
  SUCCESS: 3,
} as const;

/**
 * Determines priority based on the new status
 */
const getPriorityFromStatus = (newStatus: string): ActivityPriority => {
  if (newStatus === 'rejected') return 'URGENT';
  if (newStatus === 'approved') return 'SUCCESS';
  return 'ATTENTION';
};

/**
 * Safely extracts partner name from lead data
 */
const getPartnerName = (lead: LeadWithRelations | null): string => {
  return lead?.partners?.name || 'Unknown Partner';
};

/**
 * Safely extracts student name from lead data
 */
const getStudentName = (lead: LeadWithRelations | null): string => {
  return lead?.students?.name || 'Unknown Student';
};

/**
 * Calculates the cutoff date for activities
 */
const getActivityCutoffDate = (): string => {
  return new Date(Date.now() - ACTIVITY_CONFIG.LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
};

/**
 * Calculates statistics from activities
 */
const calculateStats = (activities: ActivityItem[]): ActivityBoardStats => {
  const today = new Date().toDateString();
  
  return {
    urgentCount: activities.filter(a => a.priority === 'URGENT').length,
    attentionCount: activities.filter(a => a.priority === 'ATTENTION').length,
    todayActivitiesCount: activities.filter(a => 
      new Date(a.timestamp).toDateString() === today
    ).length,
    activePartnersCount: new Set(activities.map(a => a.partnerId)).size,
  };
};

/**
 * Sorts activities by priority (urgent first) and then by timestamp (newest first)
 */
const sortActivities = (activities: ActivityItem[]): ActivityItem[] => {
  return [...activities].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};

/**
 * Custom hook for managing the Activity Board
 * Fetches and manages status changes and new leads from the last 7 days
 * 
 * @returns Activity items, statistics, loading state, error state, and refetch function
 */
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

  /**
   * Processes status change records into activity items
   */
  const processStatusChanges = useCallback((statusData: StatusChangeWithRelations[]): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    for (const status of statusData) {
      if (!status.created_at) continue;

      const lead = status.leads_new;
      if (!lead) {
        logger.warn('[ActivityBoard] No lead data for status change:', status.id);
        continue;
      }

      activities.push({
        id: status.id,
        priority: getPriorityFromStatus(status.new_status),
        type: 'status',
        timestamp: status.created_at,
        leadId: lead.id,
        leadCaseId: lead.case_id || 'N/A',
        partnerId: lead.partner_id || 'unknown',
        partnerName: getPartnerName(lead),
        studentName: getStudentName(lead),
        message: `Status changed: ${status.old_status || 'none'} → ${status.new_status}`,
        details: {
          oldStatus: status.old_status || undefined,
          newStatus: status.new_status,
          changeReason: status.change_reason || undefined,
        },
        actionable: true,
        actionType: 'view_lead',
      });
    }

    return activities;
  }, []);

  /**
   * Processes new lead records into activity items
   */
  const processNewLeads = useCallback((leadsData: LeadWithRelations[]): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    for (const lead of leadsData) {
      if (!lead.created_at) continue;

      activities.push({
        id: `new-${lead.id}`,
        priority: 'INFO',
        type: 'lead',
        timestamp: lead.created_at,
        leadId: lead.id,
        leadCaseId: lead.case_id || 'N/A',
        partnerId: lead.partner_id || 'unknown',
        partnerName: getPartnerName(lead),
        studentName: getStudentName(lead),
        message: '🆕 New lead created',
        actionable: true,
        actionType: 'view_lead',
      });
    }

    return activities;
  }, []);

  /**
   * Fetches all activities from the database
   * Combines status changes and new leads from the configured lookback period
   */
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cutoffDate = getActivityCutoffDate();
      logger.info('🔍 [ActivityBoard] Starting fetch...');
      logger.info('📅 [ActivityBoard] Cutoff date:', cutoffDate);

      // Fetch status changes with joined data
      logger.info('📊 [ActivityBoard] Fetching status changes...');
      const { data: statusData, error: statusError } = await supabase
        .from('lead_status_history')
        .select(`
          id,
          created_at,
          old_status,
          new_status,
          change_reason,
          lead_id,
          leads_new!fk_lead_status_history_lead (
            id,
            case_id,
            partner_id,
            student_id,
            partners!leads_new_partner_id_fkey (name),
            students!leads_new_student_id_fkey (name)
          )
        `)
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false })
        .limit(ACTIVITY_CONFIG.MAX_STATUS_ITEMS);

      if (statusError) {
        logger.error('❌ [ActivityBoard] Status fetch error:', statusError);
        throw statusError;
      }
      
      logger.info(`✅ [ActivityBoard] Found ${statusData?.length || 0} status changes`);

      // Fetch recent leads with joined data
      logger.info('🆕 [ActivityBoard] Fetching new leads...');
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_new')
        .select(`
          id,
          case_id,
          created_at,
          partner_id,
          student_id,
          partners!leads_new_partner_id_fkey (name),
          students!leads_new_student_id_fkey (name)
        `)
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false })
        .limit(ACTIVITY_CONFIG.MAX_LEAD_ITEMS);

      if (leadsError) {
        logger.error('❌ [ActivityBoard] Leads fetch error:', leadsError);
        throw leadsError;
      }
      
      logger.info(`✅ [ActivityBoard] Found ${leadsData?.length || 0} new leads`);
      if (leadsData && leadsData.length > 0) {
        logger.info('📋 [ActivityBoard] Sample lead:', {
          id: leadsData[0].id,
          case_id: leadsData[0].case_id,
          created_at: leadsData[0].created_at,
          student: leadsData[0].students,
          partner: leadsData[0].partners
        });
      }

      // Process and combine activities
      logger.info('⚙️ [ActivityBoard] Processing activities...');
      const statusActivities = processStatusChanges(statusData as any);
      logger.info(`📊 Processed ${statusActivities.length} status activities`);
      
      const leadActivities = processNewLeads(leadsData as any);
      logger.info(`🆕 Processed ${leadActivities.length} lead activities`);
      
      const allActivities = [...statusActivities, ...leadActivities];

      // Sort activities
      const sortedActivities = sortActivities(allActivities);

      logger.info('✅ [ActivityBoard] Fetch complete:', {
        total: sortedActivities.length,
        status: statusActivities.length,
        leads: leadActivities.length,
      });

      setActivities(sortedActivities);
      setStats(calculateStats(sortedActivities));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities';
      logger.error('[ActivityBoard] Error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [processStatusChanges, processNewLeads]);

  /**
   * Manually trigger a refetch of activities
   */
  const refetch = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  /**
   * Set up real-time subscriptions for automatic updates
   * Listens to status changes and new lead insertions
   */
  useEffect(() => {
    const statusChannel = supabase
      .channel('activity_board_status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lead_status_history' },
        () => {
          logger.info('[ActivityBoard] Real-time update: status change detected');
          fetchActivities();
        }
      )
      .subscribe();

    const leadsChannel = supabase
      .channel('activity_board_leads')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads_new' },
        () => {
          logger.info('[ActivityBoard] Real-time update: new lead detected');
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(leadsChannel);
    };
  }, [fetchActivities]);

  /**
   * Memoize return value to prevent unnecessary re-renders
   */
  return useMemo(
    () => ({
      activities,
      stats,
      loading,
      error,
      refetch
    }),
    [activities, stats, loading, error, refetch]
  );
}
