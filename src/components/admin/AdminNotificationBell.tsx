import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, FileText, UserPlus, RefreshCw, CheckCircle, XCircle, Target, AlertTriangle, MessageCircle, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: 'lead_created' | 'document_uploaded' | 'status_change' | 'document_verified' | 'document_rejected' | 'lender_assigned' | 'notification';
  title: string;
  message: string;
  created_at: string;
  lead_id: string | null;
  is_read: boolean;
  is_notification: boolean; // true if from notifications table (can be marked read)
  metadata?: Record<string, any>;
}

interface AdminNotificationBellProps {
  onOpenLead?: (leadId: string, tab?: string) => void;
}

export function AdminNotificationBell({ onOpenLead }: AdminNotificationBellProps) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const unreadCount = activities.filter(a => !a.is_read && a.is_notification).length;
  const totalCount = activities.length;

  const fetchActivities = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);
      const last24HoursISO = last24Hours.toISOString();

      // Fetch all data sources in parallel
      const [notificationsRes, leadsRes, documentsRes, statusHistoryRes] = await Promise.all([
        // 1. Existing notifications
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.user.id)
          .gte("created_at", last24HoursISO)
          .order("created_at", { ascending: false })
          .limit(50),
        
        // 2. New leads created
        supabase
          .from("leads_new")
          .select("id, case_id, created_at, student:students(name)")
          .gte("created_at", last24HoursISO)
          .order("created_at", { ascending: false })
          .limit(20),
        
        // 3. Documents uploaded/verified
        supabase
          .from("lead_documents")
          .select("id, lead_id, verification_status, created_at, updated_at, document_type:document_types(name), lead:leads_new(case_id, student:students(name))")
          .gte("created_at", last24HoursISO)
          .order("created_at", { ascending: false })
          .limit(30),
        
        // 4. Status changes
        supabase
          .from("lead_status_history")
          .select("id, lead_id, old_status, new_status, created_at, lead:leads_new(case_id, student:students(name))")
          .gte("created_at", last24HoursISO)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const allActivities: ActivityItem[] = [];

      // Transform notifications
      if (notificationsRes.data) {
        for (const n of notificationsRes.data) {
          const metadata = typeof n.metadata === 'object' && n.metadata !== null ? n.metadata as Record<string, any> : undefined;
          allActivities.push({
            id: `notif-${n.id}`,
            type: n.notification_type as ActivityItem['type'],
            title: n.title,
            message: n.message,
            created_at: n.created_at,
            lead_id: n.lead_id,
            is_read: n.is_read || false,
            is_notification: true,
            metadata,
          });
        }
      }

      // Transform new leads (avoid duplicates with notifications)
      const notificationLeadIds = new Set(
        notificationsRes.data?.filter(n => n.notification_type === 'lead_created' && n.lead_id).map(n => n.lead_id) || []
      );
      
      if (leadsRes.data) {
        for (const lead of leadsRes.data) {
          if (notificationLeadIds.has(lead.id)) continue; // Skip if already have notification
          const studentName = (lead.student as any)?.name || 'Unknown';
          allActivities.push({
            id: `lead-${lead.id}`,
            type: 'lead_created',
            title: 'New Lead Created',
            message: `${lead.case_id} - ${studentName}`,
            created_at: lead.created_at,
            lead_id: lead.id,
            is_read: true, // Activity items are read-only
            is_notification: false,
          });
        }
      }

      // Transform documents
      const notificationDocIds = new Set(
        notificationsRes.data?.filter(n => {
          const meta = typeof n.metadata === 'object' && n.metadata !== null ? n.metadata as Record<string, any> : null;
          return n.notification_type === 'document_uploaded' && meta?.document_id;
        }).map(n => {
          const meta = n.metadata as Record<string, any>;
          return meta?.document_id;
        }) || []
      );
      
      if (documentsRes.data) {
        for (const doc of documentsRes.data) {
          if (notificationDocIds.has(doc.id)) continue; // Skip if already have notification
          const docTypeName = (doc.document_type as any)?.name || 'Document';
          const studentName = (doc.lead as any)?.student?.name || 'Unknown';
          const caseId = (doc.lead as any)?.case_id || '';
          
          allActivities.push({
            id: `doc-${doc.id}`,
            type: 'document_uploaded',
            title: `${docTypeName} Uploaded`,
            message: `${studentName}${caseId ? ` (${caseId})` : ''}`,
            created_at: doc.created_at || doc.updated_at || new Date().toISOString(),
            lead_id: doc.lead_id,
            is_read: true,
            is_notification: false,
          });
        }
      }

      // Transform status changes
      const notificationStatusIds = new Set(
        notificationsRes.data?.filter(n => {
          const meta = typeof n.metadata === 'object' && n.metadata !== null ? n.metadata as Record<string, any> : null;
          return n.notification_type === 'status_change' && meta?.history_id;
        }).map(n => {
          const meta = n.metadata as Record<string, any>;
          return meta?.history_id;
        }) || []
      );
      
      if (statusHistoryRes.data) {
        for (const status of statusHistoryRes.data) {
          if (notificationStatusIds.has(status.id)) continue;
          const studentName = (status.lead as any)?.student?.name || 'Unknown';
          const caseId = (status.lead as any)?.case_id || '';
          const oldStatus = formatStatus(status.old_status);
          const newStatus = formatStatus(status.new_status);
          
          allActivities.push({
            id: `status-${status.id}`,
            type: 'status_change',
            title: 'Status Changed',
            message: `${caseId}: ${oldStatus} → ${newStatus}`,
            created_at: status.created_at,
            lead_id: status.lead_id,
            is_read: true,
            is_notification: false,
            metadata: { old_status: status.old_status, new_status: status.new_status },
          });
        }
      }

      // Sort by created_at descending
      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivities(allActivities.slice(0, 50));
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();

    // Subscribe to realtime notifications
    const setupChannel = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const channel = supabase
        .channel("admin-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.user.id}`,
          },
          () => {
            // Refetch all activities on new notification
            fetchActivities();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "leads_new",
          },
          () => {
            fetchActivities();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "lead_documents",
          },
          () => {
            fetchActivities();
          }
        )
        .subscribe();

      return channel;
    };

    let channel: ReturnType<typeof supabase.channel> | undefined;
    setupChannel().then(c => { channel = c; });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchActivities]);

  const markAsRead = async (activityId: string) => {
    // Only mark notifications as read
    if (!activityId.startsWith('notif-')) return;
    
    const notifId = activityId.replace('notif-', '');
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notifId);

    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, is_read: true } : a))
    );
  };

  const markAllAsRead = async () => {
    const unreadNotifIds = activities
      .filter(a => !a.is_read && a.is_notification)
      .map(a => a.id.replace('notif-', ''));
    
    if (unreadNotifIds.length === 0) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadNotifIds);

    setActivities((prev) => prev.map((a) => 
      a.is_notification ? { ...a, is_read: true } : a
    ));
  };

  const handleActivityClick = async (activity: ActivityItem) => {
    // Mark as read if it's a notification
    if (!activity.is_read && activity.is_notification) {
      await markAsRead(activity.id);
    }

    setOpen(false);

    // Navigate to lead detail if lead_id exists
    if (activity.lead_id) {
      const tab = getTabFromType(activity.type);
      if (onOpenLead) {
        onOpenLead(activity.lead_id, tab);
      }
    }
  };

  const getTabFromType = (type: string): string => {
    switch (type) {
      case 'document_uploaded':
      case 'document_verified':
      case 'document_rejected':
        return 'documents';
      case 'status_change':
        return 'timeline';
      case 'clarification_raised':
        return 'clarifications';
      case 'lender_assigned':
        return 'lender';
      default:
        return 'overview';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document_uploaded":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "lead_created":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "status_change":
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      case "document_verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "document_rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "lender_assigned":
        return <Target className="h-4 w-4 text-purple-500" />;
      case "action_required":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "clarification_raised":
        return <MessageCircle className="h-4 w-4 text-cyan-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: string, isNotification: boolean) => {
    const labels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      document_uploaded: { label: 'Document', variant: 'secondary' },
      lead_created: { label: 'New Lead', variant: 'default' },
      status_change: { label: 'Status', variant: 'outline' },
      document_verified: { label: 'Verified', variant: 'default' },
      document_rejected: { label: 'Rejected', variant: 'destructive' },
      lender_assigned: { label: 'Lender', variant: 'secondary' },
      action_required: { label: 'Action', variant: 'destructive' },
      clarification_raised: { label: 'Clarification', variant: 'outline' },
    };
    const config = labels[type] || { label: 'Update', variant: 'secondary' as const };
    return (
      <Badge variant={config.variant} className="text-[10px] px-1.5 py-0 h-4">
        {config.label}
      </Badge>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-1.5">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Last 24 Hours</h4>
            {totalCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalCount} {totalCount === 1 ? 'activity' : 'activities'}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1 px-2 text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              Loading activity...
            </div>
          ) : activities.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No activity in the last 24 hours</p>
              <p className="text-xs mt-1">
                All quiet! New leads, documents, and updates will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={cn(
                    "px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors group",
                    !activity.is_read && activity.is_notification && "bg-primary/5"
                  )}
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getTypeIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeBadge(activity.type, activity.is_notification)}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm line-clamp-1",
                        !activity.is_read && activity.is_notification && "font-medium"
                      )}>
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {activity.message}
                      </p>
                      {activity.lead_id && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-3 w-3" />
                          View Lead Details
                        </div>
                      )}
                    </div>
                    {!activity.is_read && activity.is_notification && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// Helper to format status for display
function formatStatus(status: string | null): string {
  if (!status) return 'Unknown';
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
