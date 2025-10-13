import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ActivityTooltip } from './ActivityTooltip';
import { ActivityMotivation } from './ActivityMotivation';
import { ActivityCelebration } from './ActivityCelebration';
import { SmartActionsPanel } from './SmartActionsPanel';
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Eye,
  Shield,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Filter,
  TrendingDown,
  Minus,
  DollarSign,
} from 'lucide-react';
import { 
  useActivityBoard, 
  ActivityItem, 
  ActivityPriority,
  ActivityFilter,
  ActivityType 
} from '@/hooks/useActivityBoard';
import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { SmartAction } from './SmartActionsPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '@/utils/logger';

/**
 * Props for the AdminActivityBoard component
 */
interface AdminActivityBoardProps {
  /** Callback when viewing a lead */
  onViewLead?: (leadId: string) => void;
  /** Callback when updating lead status */
  onUpdateStatus?: (leadId: string) => void;
  /** Callback when verifying a document */
  onVerifyDocument?: (documentId: string, leadId: string) => void;
}

/**
 * Configuration for activity priority levels
 * Maps priority to display properties (color, icon, label)
 */
const priorityConfig: Record<ActivityPriority, {
  color: string;
  bgColor: string;
  icon: typeof AlertTriangle;
  label: string;
}> = {
  URGENT: {
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/20',
    icon: AlertTriangle,
    label: 'Urgent',
  },
  ATTENTION: {
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/20',
    icon: Clock,
    label: 'Needs Attention',
  },
  INFO: {
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/20',
    icon: FileText,
    label: 'Info',
  },
  SUCCESS: {
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/20',
    icon: CheckCircle2,
    label: 'Success',
  },
};

/**
 * Formats a timestamp into a human-readable "time ago" string
 * @param timestamp - The timestamp to format
 * @returns Formatted string (e.g., "2 hours ago") or "Unknown time" on error
 */
const formatTimeAgo = (timestamp: string | null | undefined): string => {
  try {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      logger.warn('[ActivityCard] Invalid timestamp:', timestamp);
      return 'Unknown time';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (err) {
    logger.error('[ActivityCard] Error formatting date:', err);
    return 'Unknown time';
  }
};

/**
 * Props for ActivityCard component
 */
interface ActivityCardProps {
  activity: ActivityItem;
  onViewLead?: (leadId: string) => void;
  onUpdateStatus?: (leadId: string) => void;
  onVerifyDocument?: (documentId: string, leadId: string) => void;
  onCelebrate?: (activityType: string, impactAmount?: number) => void;
}

/**
 * Individual activity card displaying a single activity with actions
 */
const ActivityCard = ({ 
  activity, 
  onViewLead,
  onUpdateStatus,
  onVerifyDocument,
  onCelebrate,
}: ActivityCardProps) => {
  const config = priorityConfig[activity.priority];
  const Icon = config.icon;
  const timeAgo = formatTimeAgo(activity.timestamp);

  return (
    <Card className={`p-6 border-l-4 ${config.bgColor} hover:shadow-lg hover-lift transition-all duration-300 animate-slide-in-right`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={`mt-1 p-2 rounded-lg bg-background/50 ${config.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={config.color}>
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {timeAgo}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm">{activity.message}</p>
              {activity.priority === 'URGENT' && activity.impactAmount && (
                <ActivityTooltip
                  activityType={activity.activityType}
                  priority={activity.priority}
                  impactAmount={activity.impactAmount}
                  timeRemaining={activity.timeRemaining}
                  recommendedAction={activity.recommendedAction}
                  conversionProbability={activity.conversionProbability}
                />
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{activity.partnerName}</span>
              <span>•</span>
              <span>{activity.studentName}</span>
              <span>•</span>
              <span className="font-mono">{activity.leadCaseId}</span>
              {activity.impactAmount && activity.impactAmount > 0 && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-primary">
                    ₹{(activity.impactAmount / 100000).toFixed(1)}L at risk
                  </span>
                </>
              )}
              {activity.timeRemaining && activity.timeRemaining > 0 && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-warning">
                    {activity.timeRemaining}h remaining
                  </span>
                </>
              )}
            </div>

            {activity.details && (
              <div className="mt-2 text-xs space-y-1">
                {activity.details.oldStatus && activity.details.newStatus && (
                  <div className="flex items-center gap-2">
                    <span className="text-destructive font-medium">{activity.details.oldStatus}</span>
                    <span>→</span>
                    <span className="text-success font-medium">{activity.details.newStatus}</span>
                  </div>
                )}
                {activity.details.changeReason && (
                  <p className="text-muted-foreground italic">
                    Reason: {activity.details.changeReason}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {activity.actionable && activity.actionType === 'view_lead' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewLead?.(activity.leadId)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
          
          {activity.actionable && activity.actionType === 'verify_document' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onVerifyDocument?.(activity.id, activity.leadId);
                  onCelebrate?.('document_pending', activity.impactAmount);
                }}
              >
                <Shield className="h-4 w-4 mr-1" />
                Verify
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onViewLead?.(activity.leadId)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </>
          )}
          
          {activity.actionable && activity.actionType === 'update_status' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onUpdateStatus?.(activity.leadId);
                onCelebrate?.('status_change', activity.impactAmount);
              }}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Update
            </Button>
          )}
          
          {activity.actionable && activity.actionType === 'contact_partner' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {/* TODO: Implement contact partner */}}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Contact
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * AdminActivityBoard - Displays real-time activity feed with filtering and grouping
 * 
 * Shows recent activities including lead creation, status changes, and document uploads.
 * Activities can be grouped by partner and filtered by priority level.
 */
export function AdminActivityBoard({
  onViewLead,
  onUpdateStatus,
  onVerifyDocument,
}: AdminActivityBoardProps) {
  const { user } = useAuth();
  const { activities, stats, loading, error } = useActivityBoard();
  const [groupByPartner, setGroupByPartner] = useState(true);
  const [expandedPartners, setExpandedPartners] = useState<Set<string>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<ActivityFilter>('all');
  const [typeFilter, setTypeFilter] = useState<ActivityFilter>('all');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    activityType?: string;
    impactAmount?: number;
  }>({});
  const [recentCompletions, setRecentCompletions] = useState(0);

  /**
   * Toggle expand/collapse state for a partner group
   */
  const togglePartner = useCallback((partnerId: string) => {
    setExpandedPartners(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(partnerId)) {
        newExpanded.delete(partnerId);
      } else {
        newExpanded.add(partnerId);
      }
      return newExpanded;
    });
  }, []);

  /**
   * Filter activities based on priority and type
   */
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      if (priorityFilter !== 'all' && activity.priority !== priorityFilter) return false;
      if (typeFilter !== 'all' && activity.type !== typeFilter) return false;
      return true;
    });
  }, [activities, priorityFilter, typeFilter]);

  /**
   * Generate smart actions from urgent activities
   */
  const generateSmartActions = useMemo((): SmartAction[] => {
    const urgentActivities = filteredActivities.filter(a => a.priority === 'URGENT');
    
    const actionsByType = urgentActivities.reduce((acc, activity) => {
      const type = activity.activityType;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          impact: 0,
          activities: []
        };
      }
      acc[type].count++;
      acc[type].impact += activity.impactAmount || 0;
      acc[type].activities.push(activity);
      return acc;
    }, {} as Record<string, { count: number; impact: number; activities: ActivityItem[] }>);

    return Object.entries(actionsByType)
      .map(([type, data]) => ({
        title: type === 'status_change' ? 'Status Changes Required' 
             : type === 'document_pending' ? 'Documents Pending Verification'
             : type === 'new_lead' ? 'New Leads Need Attention'
             : 'Lender Assignment Needed',
        description: `${data.count} ${data.count === 1 ? 'item' : 'items'} requiring immediate action`,
        count: data.count,
        impactAmount: data.impact,
        estimatedTime: data.count * 5,
        priority: 'URGENT' as const,
        onClick: () => {
          const firstActivity = data.activities[0];
          if (type === 'status_change' && onUpdateStatus) {
            onUpdateStatus(firstActivity.leadId);
          } else if (type === 'document_pending' && onVerifyDocument) {
            onVerifyDocument(firstActivity.id, firstActivity.leadId);
          } else if (onViewLead) {
            onViewLead(firstActivity.leadId);
          }
        }
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [filteredActivities, onUpdateStatus, onVerifyDocument, onViewLead]);

  /**
   * Group activities by partner for organized display
   * Returns null if grouping is disabled
   */
  const groupedActivities = useMemo(() => {
    if (!groupByPartner) return null;
    
    return filteredActivities.reduce((acc, activity) => {
      const partnerId = activity.partnerId || 'unknown';
      const partnerName = activity.partnerName || 'Unknown Partner';
      
      if (!acc[partnerId]) {
        acc[partnerId] = {
          partnerName,
          activities: [],
        };
      }
      acc[partnerId].activities.push(activity);
      return acc;
    }, {} as Record<string, { partnerName: string; activities: ActivityItem[] }>);
  }, [groupByPartner, filteredActivities]);

  /**
   * Render trend indicator
   */
  const renderTrend = (trend: number) => {
    if (trend === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
    if (trend > 0) return (
      <div className="flex items-center text-success">
        <TrendingUp className="h-3 w-3 mr-1" />
        <span className="text-xs font-medium">+{trend}</span>
      </div>
    );
    return (
      <div className="flex items-center text-destructive">
        <TrendingDown className="h-3 w-3 mr-1" />
        <span className="text-xs font-medium">{trend}</span>
      </div>
    );
  };
  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Error loading activities: {error}</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {user?.id && (
        <ActivityMotivation 
          userId={user.id} 
          recentCompletions={recentCompletions}
        />
      )}
      
      <Card className="flex flex-col h-full shadow-lg">
        <div className="p-8 border-b space-y-6 bg-gradient-to-r from-card to-card/50">
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold">Activity Board</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time notifications and actionable insights • {filteredActivities.length} activities
              </p>
            </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hover-lift">
                  <Filter className="h-4 w-4 mr-2" />
                  Priority: {priorityFilter === 'all' ? 'All' : priorityFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPriorityFilter('all')}>
                  All Priorities
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter('URGENT')}>
                  <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                  Urgent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter('ATTENTION')}>
                  <Clock className="h-4 w-4 mr-2 text-warning" />
                  Attention
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter('INFO')}>
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  Info
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter('SUCCESS')}>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                  Success
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hover-lift">
                  <Filter className="h-4 w-4 mr-2" />
                  Type: {typeFilter === 'all' ? 'All' : typeFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                  All Types
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('lead')}>
                  🆕 New Leads
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('status')}>
                  📊 Status Changes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('document')}>
                  📄 Documents
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('lender')}>
                  🏦 Lender Changes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setGroupByPartner(!groupByPartner)}
              className="hover-lift"
            >
              {groupByPartner ? 'View All' : 'Group by Partner'}
            </Button>
          </div>
        </div>
        </div>

        <div className="p-8">
        <div className="grid grid-cols-4 gap-6">
          <Card className="p-5 bg-destructive/10 border-destructive/20 hover-lift stagger-fade-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.urgentCount}</p>
                  <p className="text-xs text-muted-foreground">Urgent Items</p>
                </div>
              </div>
              {renderTrend(stats.urgentTrend)}
            </div>
          </Card>
          
          <Card className="p-5 bg-warning/10 border-warning/20 hover-lift stagger-fade-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{stats.attentionCount}</p>
                  <p className="text-xs text-muted-foreground">Needs Attention</p>
                </div>
              </div>
              {renderTrend(stats.attentionTrend)}
            </div>
          </Card>
          
          <Card className="p-5 bg-primary/10 border-primary/20 hover-lift stagger-fade-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.todayActivitiesCount}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
              </div>
              {renderTrend(stats.todayTrend)}
            </div>
          </Card>
          
          <Card className="p-5 bg-success/10 border-success/20 hover-lift stagger-fade-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/20">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{stats.activePartnersCount}</p>
                  <p className="text-xs text-muted-foreground">Active Partners</p>
                </div>
              </div>
              {renderTrend(stats.partnersTrend)}
            </div>
          </Card>
        </div>
        </div>
        
        {generateSmartActions.length > 0 && (
          <SmartActionsPanel actions={generateSmartActions} />
        )}

        <ScrollArea className="flex-1 p-8">
        <div className="space-y-6">
          {filteredActivities.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No Recent Activity"
              description="There are no recent activities to display. New leads, status changes, and document uploads will appear here."
            />
          ) : groupByPartner && groupedActivities ? (
            Object.keys(groupedActivities).length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No Grouped Activities"
                description="Switch to 'View All' to see ungrouped activities."
              />
            ) : (
              Object.entries(groupedActivities).map(([partnerId, group]) => {
              const isExpanded = expandedPartners.has(partnerId);
              const urgentCount = group.activities.filter(a => a.priority === 'URGENT').length;
              const attentionCount = group.activities.filter(a => a.priority === 'ATTENTION').length;
              
              return (
                <div key={partnerId} className="space-y-4 animate-fade-in">
                  <button
                    onClick={() => togglePartner(partnerId)}
                    className="w-full flex items-center justify-between p-5 bg-muted/50 rounded-lg hover:bg-muted hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">{group.partnerName}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{group.activities.length} activities</span>
                          {urgentCount > 0 && (
                            <Badge variant="outline" className="text-destructive border-destructive animate-glow">
                              {urgentCount} urgent
                            </Badge>
                          )}
                          {attentionCount > 0 && (
                            <Badge variant="outline" className="text-warning border-warning">
                              {attentionCount} attention
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 transition-transform" />
                    ) : (
                      <ChevronDown className="h-5 w-5 transition-transform" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="space-y-4 ml-6 animate-fade-in">
                      {group.activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onViewLead={onViewLead}
                    onUpdateStatus={onUpdateStatus}
                    onVerifyDocument={onVerifyDocument}
                    onCelebrate={(activityType, impactAmount) => {
                      setCelebrationData({ activityType, impactAmount });
                      setShowCelebration(true);
                      setRecentCompletions(prev => prev + 1);
                    }}
                  />
                      ))}
                    </div>
                  )}
                </div>
              );
            }))
           ) : (
            filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onViewLead={onViewLead}
                onUpdateStatus={onUpdateStatus}
                onVerifyDocument={onVerifyDocument}
                onCelebrate={(activityType, impactAmount) => {
                  setCelebrationData({ activityType, impactAmount });
                  setShowCelebration(true);
                  setRecentCompletions(prev => prev + 1);
                }}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
    
    <ActivityCelebration
      show={showCelebration}
      onClose={() => setShowCelebration(false)}
      activityType={celebrationData.activityType}
      impactAmount={celebrationData.impactAmount}
    />
  </>
  );
}
