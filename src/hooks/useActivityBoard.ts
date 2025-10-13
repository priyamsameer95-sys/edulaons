import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/** Priority levels for activity items */
export type ActivityPriority = 'URGENT' | 'ATTENTION' | 'INFO' | 'SUCCESS';

/** Types of activities that can occur */
export type ActivityType = 'document' | 'status' | 'lead' | 'lender' | 'system';

/** Filter type for activities */
export type ActivityFilter = 'all' | ActivityPriority | ActivityType;

/** Main activity item interface */
export interface ActivityItem {
  id: string;
  priority: ActivityPriority;
  type: ActivityType;
  activityType: 'status_change' | 'document_pending' | 'new_lead' | 'lender_assignment';
  timestamp: string;
  leadId: string;
  leadCaseId: string;
  partnerId: string;
  partnerName: string;
  studentName: string;
  message: string;
  lead?: {
    status?: string;
    student_name?: string;
  };
  details?: {
    oldStatus?: string;
    newStatus?: string;
    documentType?: string;
    changeReason?: string;
    changedBy?: string;
  };
  actionable: boolean;
  actionType?: 'verify_document' | 'update_status' | 'view_lead' | 'contact_partner';
  // Phase 1 enhancements
  impactAmount?: number;
  timeRemaining?: number; // hours until escalation
  conversionProbability?: number; // percentage
  recommendedAction?: string;
}

/** Statistics for the activity board */
interface ActivityBoardStats {
  urgentCount: number;
  attentionCount: number;
  todayActivitiesCount: number;
  activePartnersCount: number;
  urgentTrend: number;
  attentionTrend: number;
  todayTrend: number;
  partnersTrend: number;
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

interface DocumentWithRelations {
  id: string;
  uploaded_at: string;
  verification_status: string;
  document_type_id: string;
  lead_id: string;
  document_types: { name: string } | null;
  leads_new: LeadWithRelations | null;
}

interface LenderAssignmentWithRelations {
  id: string;
  created_at: string;
  old_lender_id: string | null;
  new_lender_id: string;
  change_reason: string | null;
  assignment_notes: string | null;
  lead_id: string;
  old_lender: { name: string } | null;
  new_lender: { name: string } | null;
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
 * Determines priority based on the new status with time-based escalation
 */
const getPriorityFromStatus = (newStatus: string, createdAt: string): ActivityPriority => {
  const hoursSinceCreation = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  
  if (newStatus === 'rejected') return 'URGENT';
  if (newStatus === 'approved') return 'SUCCESS';
  if (newStatus === 'new' && hoursSinceCreation > 48) return 'URGENT';
  if (newStatus === 'new' && hoursSinceCreation > 24) return 'ATTENTION';
  if (newStatus === 'in_progress' && hoursSinceCreation > 72) return 'ATTENTION';
  
  return 'INFO';
};

/**
 * Determines priority for document verification with time-based escalation
 */
const getDocumentPriority = (status: string, uploadedAt: string): ActivityPriority => {
  const hoursSinceUpload = (Date.now() - new Date(uploadedAt).getTime()) / (1000 * 60 * 60);
  
  if (status === 'rejected' || status === 'resubmission_required') return 'URGENT';
  if (status === 'verified') return 'SUCCESS';
  if (status === 'pending' && hoursSinceUpload > 24) return 'URGENT';
  if (status === 'pending') return 'ATTENTION';
  if (status === 'uploaded') return 'ATTENTION';
  
  return 'INFO';
};

/**
 * Determines priority for new leads with time-based escalation
 */
const getNewLeadPriority = (createdAt: string): ActivityPriority => {
  const hoursSinceCreation = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceCreation > 48) return 'URGENT';
  if (hoursSinceCreation > 24) return 'ATTENTION';
  
  return 'INFO';
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
 * Calculates statistics from activities with trend comparison
 */
const calculateStats = (activities: ActivityItem[], previousActivities: ActivityItem[]): ActivityBoardStats => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  
  const urgentCount = activities.filter(a => a.priority === 'URGENT').length;
  const attentionCount = activities.filter(a => a.priority === 'ATTENTION').length;
  const todayActivitiesCount = activities.filter(a => 
    new Date(a.timestamp).toDateString() === today
  ).length;
  const activePartnersCount = new Set(activities.map(a => a.partnerId)).size;
  
  // Calculate previous day stats for trends
  const prevUrgentCount = previousActivities.filter(a => a.priority === 'URGENT').length;
  const prevAttentionCount = previousActivities.filter(a => a.priority === 'ATTENTION').length;
  const prevDayActivitiesCount = previousActivities.filter(a => 
    new Date(a.timestamp).toDateString() === yesterday
  ).length;
  const prevActivePartnersCount = new Set(previousActivities.map(a => a.partnerId)).size;
  
  return {
    urgentCount,
    attentionCount,
    todayActivitiesCount,
    activePartnersCount,
    urgentTrend: urgentCount - prevUrgentCount,
    attentionTrend: attentionCount - prevAttentionCount,
    todayTrend: todayActivitiesCount - prevDayActivitiesCount,
    partnersTrend: activePartnersCount - prevActivePartnersCount,
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
 * Calculate time remaining until escalation (in hours)
 */
const calculateTimeRemaining = (timestamp: string, priority: ActivityPriority): number | undefined => {
  const hoursSince = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  
  if (priority === 'URGENT') return undefined; // Already urgent
  if (priority === 'ATTENTION') {
    return Math.max(0, 24 - hoursSince); // Escalates to URGENT in 24h
  }
  return Math.max(0, 48 - hoursSince); // Escalates to ATTENTION in 48h
};

/**
 * Get recommended action based on activity type
 */
const getRecommendedAction = (type: ActivityType, priority: ActivityPriority): string => {
  if (type === 'document') {
    if (priority === 'URGENT') {
      return 'Verify this document immediately to unblock application progress.';
    }
    return 'Review and verify document to keep the application moving forward.';
  }
  if (type === 'lead') {
    if (priority === 'URGENT') {
      return 'Contact this lead now - response time is critical for conversion.';
    }
    return 'Reach out to this lead within 24h to maximize engagement.';
  }
  if (type === 'status') {
    if (priority === 'URGENT') {
      return 'Take immediate action on this status change to prevent delays.';
    }
    return 'Review status change and update stakeholders if needed.';
  }
  return 'Review this activity and take appropriate action.';
};

/**
 * Calculate conversion probability based on historical data
 */
const getConversionProbability = (type: ActivityType, hoursSince: number): number => {
  if (type === 'lead') {
    if (hoursSince < 24) return 75;
    if (hoursSince < 48) return 50;
    return 25;
  }
  if (type === 'document') {
    if (hoursSince < 24) return 85;
    if (hoursSince < 72) return 60;
    return 40;
  }
  return 50;
};

/**
 * Custom hook for managing the Activity Board
 * Fetches and manages status changes and new leads from the last 7 days
 * 
 * @returns Activity items, statistics, loading state, error state, and refetch function
 */
export function useActivityBoard() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [previousActivities, setPreviousActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityBoardStats>({
    urgentCount: 0,
    attentionCount: 0,
    todayActivitiesCount: 0,
    activePartnersCount: 0,
    urgentTrend: 0,
    attentionTrend: 0,
    todayTrend: 0,
    partnersTrend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Processes status change records into activity items
   */
  const processStatusChanges = useCallback((statusData: StatusChangeWithRelations[], leadsWithAmounts?: Map<string, number>): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    for (const status of statusData) {
      if (!status.created_at) continue;

      const lead = status.leads_new;
      if (!lead) {
        logger.warn('[ActivityBoard] No lead data for status change:', status.id);
        continue;
      }

      const hoursSince = (Date.now() - new Date(status.created_at).getTime()) / (1000 * 60 * 60);
      const priority = getPriorityFromStatus(status.new_status, status.created_at);
      const impactAmount = leadsWithAmounts?.get(lead.id) || 0;

      activities.push({
        id: status.id,
        priority,
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
        impactAmount,
        timeRemaining: calculateTimeRemaining(status.created_at, priority),
        conversionProbability: getConversionProbability('status', hoursSince),
        recommendedAction: getRecommendedAction('status', priority),
      });
    }

    return activities;
  }, []);

  /**
   * Processes new lead records into activity items
   */
  const processNewLeads = useCallback((leadsData: LeadWithRelations[], leadsWithAmounts?: Map<string, number>): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    for (const lead of leadsData) {
      if (!lead.created_at) continue;

      const hoursSince = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);
      const priority = getNewLeadPriority(lead.created_at);
      const impactAmount = leadsWithAmounts?.get(lead.id) || 0;

      activities.push({
        id: `new-${lead.id}`,
        priority,
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
        impactAmount,
        timeRemaining: calculateTimeRemaining(lead.created_at, priority),
        conversionProbability: getConversionProbability('lead', hoursSince),
        recommendedAction: getRecommendedAction('lead', priority),
      });
    }

    return activities;
  }, []);

  /**
   * Processes document records into activity items
   */
  const processDocuments = useCallback((documentsData: DocumentWithRelations[], leadsWithAmounts?: Map<string, number>): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    for (const doc of documentsData) {
      if (!doc.uploaded_at) continue;

      const lead = doc.leads_new;
      if (!lead) {
        logger.warn('[ActivityBoard] No lead data for document:', doc.id);
        continue;
      }

      const docType = doc.document_types?.name || 'Document';
      const statusEmoji = doc.verification_status === 'verified' ? '✅' : 
                         doc.verification_status === 'rejected' ? '❌' : 
                         doc.verification_status === 'pending' ? '⏳' : '📄';

      const hoursSince = (Date.now() - new Date(doc.uploaded_at).getTime()) / (1000 * 60 * 60);
      const priority = getDocumentPriority(doc.verification_status, doc.uploaded_at);
      const impactAmount = leadsWithAmounts?.get(lead.id) || 0;

      activities.push({
        id: `doc-${doc.id}`,
        priority,
        type: 'document',
        timestamp: doc.uploaded_at,
        leadId: lead.id,
        leadCaseId: lead.case_id || 'N/A',
        partnerId: lead.partner_id || 'unknown',
        partnerName: getPartnerName(lead),
        studentName: getStudentName(lead),
        message: `${statusEmoji} ${docType} - ${doc.verification_status}`,
        details: {
          documentType: docType,
        },
        actionable: doc.verification_status === 'pending' || doc.verification_status === 'uploaded',
        actionType: 'verify_document',
        impactAmount,
        timeRemaining: calculateTimeRemaining(doc.uploaded_at, priority),
        conversionProbability: getConversionProbability('document', hoursSince),
        recommendedAction: getRecommendedAction('document', priority),
      });
    }

    return activities;
  }, []);

  /**
   * Processes lender assignment records into activity items
   */
  const processLenderAssignments = useCallback((assignmentsData: LenderAssignmentWithRelations[]): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    for (const assignment of assignmentsData) {
      if (!assignment.created_at) continue;

      const lead = assignment.leads_new;
      if (!lead) {
        logger.warn('[ActivityBoard] No lead data for lender assignment:', assignment.id);
        continue;
      }

      const oldLenderName = assignment.old_lender?.name || 'None';
      const newLenderName = assignment.new_lender?.name || 'Unknown';

      activities.push({
        id: `lender-${assignment.id}`,
        priority: 'ATTENTION',
        type: 'lender',
        timestamp: assignment.created_at,
        leadId: lead.id,
        leadCaseId: lead.case_id || 'N/A',
        partnerId: lead.partner_id || 'unknown',
        partnerName: getPartnerName(lead),
        studentName: getStudentName(lead),
        message: `🏦 Lender changed: ${oldLenderName} → ${newLenderName}`,
        details: {
          changeReason: assignment.change_reason || undefined,
        },
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

      // Fetch documents with pending or recent uploads
      logger.info('📄 [ActivityBoard] Fetching documents...');
      const { data: documentsData, error: docsError } = await supabase
        .from('lead_documents')
        .select(`
          id,
          uploaded_at,
          verification_status,
          document_type_id,
          lead_id,
          document_types!lead_documents_document_type_id_fkey (name),
          leads_new!lead_documents_lead_id_fkey (
            id,
            case_id,
            partner_id,
            student_id,
            partners!leads_new_partner_id_fkey (name),
            students!leads_new_student_id_fkey (name)
          )
        `)
        .gte('uploaded_at', cutoffDate)
        .order('uploaded_at', { ascending: false })
        .limit(100);

      if (docsError) {
        logger.error('❌ [ActivityBoard] Documents fetch error:', docsError);
      } else {
        logger.info(`✅ [ActivityBoard] Found ${documentsData?.length || 0} documents`);
      }

      // Fetch lender assignments
      logger.info('🏦 [ActivityBoard] Fetching lender assignments...');
      const { data: assignmentsData, error: assignError } = await supabase
        .from('lender_assignment_history')
        .select(`
          id,
          created_at,
          old_lender_id,
          new_lender_id,
          change_reason,
          assignment_notes,
          lead_id,
          old_lender:lenders!lender_assignment_history_old_lender_id_fkey (name),
          new_lender:lenders!lender_assignment_history_new_lender_id_fkey (name),
          leads_new!lender_assignment_history_lead_id_fkey (
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
        .limit(50);

      if (assignError) {
        logger.error('❌ [ActivityBoard] Lender assignments fetch error:', assignError);
      } else {
        logger.info(`✅ [ActivityBoard] Found ${assignmentsData?.length || 0} lender assignments`);
      }

      // Fetch loan amounts for all leads to calculate impact
      logger.info('💰 [ActivityBoard] Fetching loan amounts...');
      const allLeadIds = new Set<string>();
      
      statusData?.forEach(s => s.leads_new?.id && allLeadIds.add(s.leads_new.id));
      leadsData?.forEach(l => l.id && allLeadIds.add(l.id));
      documentsData?.forEach(d => d.leads_new?.id && allLeadIds.add(d.leads_new.id));

      const leadsWithAmounts = new Map<string, number>();
      
      if (allLeadIds.size > 0) {
        const { data: loanData } = await supabase
          .from('leads_new')
          .select('id, loan_amount')
          .in('id', Array.from(allLeadIds));
        
        loanData?.forEach(lead => {
          if (lead.loan_amount) {
            leadsWithAmounts.set(lead.id, Number(lead.loan_amount));
          }
        });
      }

      // Process and combine activities
      logger.info('⚙️ [ActivityBoard] Processing activities...');
      const statusActivities = processStatusChanges(statusData as any, leadsWithAmounts);
      logger.info(`📊 Processed ${statusActivities.length} status activities`);
      
      const leadActivities = processNewLeads(leadsData as any, leadsWithAmounts);
      logger.info(`🆕 Processed ${leadActivities.length} lead activities`);

      const documentActivities = documentsData ? processDocuments(documentsData as any, leadsWithAmounts) : [];
      logger.info(`📄 Processed ${documentActivities.length} document activities`);

      const lenderActivities = assignmentsData ? processLenderAssignments(assignmentsData as any) : [];
      logger.info(`🏦 Processed ${lenderActivities.length} lender activities`);
      
      const allActivities = [
        ...statusActivities, 
        ...leadActivities, 
        ...documentActivities,
        ...lenderActivities
      ];

      // Sort activities
      const sortedActivities = sortActivities(allActivities);

      logger.info('✅ [ActivityBoard] Fetch complete:', {
        total: sortedActivities.length,
        status: statusActivities.length,
        leads: leadActivities.length,
        documents: documentActivities.length,
        lenders: lenderActivities.length,
      });

      // Store current as previous for trend calculation
      setPreviousActivities(activities);
      setActivities(sortedActivities);
      setStats(calculateStats(sortedActivities, activities));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities';
      logger.error('[ActivityBoard] Error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [processStatusChanges, processNewLeads, processDocuments, processLenderAssignments]);

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
   * Listens to status changes, new leads, documents, and lender assignments
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

    const documentsChannel = supabase
      .channel('activity_board_documents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lead_documents' },
        () => {
          logger.info('[ActivityBoard] Real-time update: document activity detected');
          fetchActivities();
        }
      )
      .subscribe();

    const lenderChannel = supabase
      .channel('activity_board_lenders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lender_assignment_history' },
        () => {
          logger.info('[ActivityBoard] Real-time update: lender assignment detected');
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(lenderChannel);
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
