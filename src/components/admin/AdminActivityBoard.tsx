import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
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
} from 'lucide-react';
import { useActivityBoard, ActivityItem, ActivityPriority } from '@/hooks/useActivityBoard';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface AdminActivityBoardProps {
  onViewLead?: (leadId: string) => void;
  onUpdateStatus?: (leadId: string) => void;
  onVerifyDocument?: (documentId: string, leadId: string) => void;
}

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

const ActivityCard = ({ 
  activity, 
  onViewLead,
  onUpdateStatus,
  onVerifyDocument,
}: { 
  activity: ActivityItem;
  onViewLead?: (leadId: string) => void;
  onUpdateStatus?: (leadId: string) => void;
  onVerifyDocument?: (documentId: string, leadId: string) => void;
}) => {
  const config = priorityConfig[activity.priority];
  const Icon = config.icon;

  return (
    <Card className={`p-4 border-l-4 ${config.bgColor} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`mt-1 ${config.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={config.color}>
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </span>
            </div>
            
            <p className="font-medium text-sm mb-1">{activity.message}</p>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{activity.partnerName}</span>
              <span>•</span>
              <span>{activity.studentName}</span>
              <span>•</span>
              <span className="font-mono">{activity.leadCaseId}</span>
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
                onClick={() => onVerifyDocument?.(activity.id, activity.leadId)}
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
              onClick={() => onUpdateStatus?.(activity.leadId)}
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

export function AdminActivityBoard({
  onViewLead,
  onUpdateStatus,
  onVerifyDocument,
}: AdminActivityBoardProps) {
  const { activities, stats, loading, error } = useActivityBoard();
  const [groupByPartner, setGroupByPartner] = useState(true);
  const [expandedPartners, setExpandedPartners] = useState<Set<string>>(new Set());

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

  const togglePartner = (partnerId: string) => {
    const newExpanded = new Set(expandedPartners);
    if (newExpanded.has(partnerId)) {
      newExpanded.delete(partnerId);
    } else {
      newExpanded.add(partnerId);
    }
    setExpandedPartners(newExpanded);
  };

  const groupedActivities = groupByPartner
    ? activities.reduce((acc, activity) => {
        // Skip activities without a valid partner ID
        const partnerId = activity.partnerId || 'unknown';
        if (!partnerId || partnerId === 'unknown') {
          console.warn('[ActivityBoard] Activity missing partnerId:', activity.id);
        }
        
        if (!acc[partnerId]) {
          acc[partnerId] = {
            partnerName: activity.partnerName || 'Unknown Partner',
            activities: [],
          };
        }
        acc[partnerId].activities.push(activity);
        return acc;
      }, {} as Record<string, { partnerName: string; activities: ActivityItem[] }>)
    : null;

  return (
    <Card className="flex flex-col h-full">
      <div className="p-6 border-b space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Activity Board</h2>
            <p className="text-sm text-muted-foreground">
              Real-time notifications and actionable insights
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGroupByPartner(!groupByPartner)}
          >
            {groupByPartner ? 'View All' : 'Group by Partner'}
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 bg-destructive/10 border-destructive/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.urgentCount}</p>
                <p className="text-xs text-muted-foreground">Urgent Items</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-warning/10 border-warning/20">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{stats.attentionCount}</p>
                <p className="text-xs text-muted-foreground">Needs Attention</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-primary/10 border-primary/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.todayActivitiesCount}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-success/10 border-success/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{stats.activePartnersCount}</p>
                <p className="text-xs text-muted-foreground">Active Partners</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {activities.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No Recent Activity"
              description="There are no recent activities to display. New leads, status changes, and document uploads will appear here."
            />
          ) : groupByPartner && groupedActivities && Object.keys(groupedActivities).length > 0 ? (
            Object.entries(groupedActivities).map(([partnerId, group]) => {
              const isExpanded = expandedPartners.has(partnerId);
              const urgentCount = group.activities.filter(a => a.priority === 'URGENT').length;
              const attentionCount = group.activities.filter(a => a.priority === 'ATTENTION').length;
              
              return (
                <div key={partnerId} className="space-y-3">
                  <button
                    onClick={() => togglePartner(partnerId)}
                    className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <h3 className="font-semibold">{group.partnerName}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{group.activities.length} activities</span>
                          {urgentCount > 0 && (
                            <Badge variant="outline" className="text-destructive border-destructive">
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
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="space-y-3 ml-4">
                      {group.activities.map((activity) => (
                        <ActivityCard
                          key={activity.id}
                          activity={activity}
                          onViewLead={onViewLead}
                          onUpdateStatus={onUpdateStatus}
                          onVerifyDocument={onVerifyDocument}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onViewLead={onViewLead}
                onUpdateStatus={onUpdateStatus}
                onVerifyDocument={onVerifyDocument}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
