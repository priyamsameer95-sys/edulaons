import { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, FileText, UserPlus, RefreshCw, CheckCircle, XCircle, Target, AlertTriangle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type TimeFilter = '24h' | '7d' | 'all';

interface ActivityItem {
  id: string;
  type: 'lead_created' | 'document_uploaded' | 'status_change' | 'document_verified' | 'document_rejected' | 'lender_assigned' | 'notification';
  title: string;
  message: string;
  created_at: string;
  lead_id: string | null;
  is_read: boolean;
  is_notification: boolean;
  metadata?: Record<string, any>;
}

interface AdminNotificationBellProps {
  onOpenLead?: (leadId: string, tab?: string) => void;
}

// Format loan amount as ₹X.XL or ₹X.XCr
const formatLoanAmount = (amount: number | undefined | null): string => {
  if (!amount) return '';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Format phone as last 4 digits
const formatPhoneShort = (phone: string | null | undefined): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 4 ? `…${digits.slice(-4)}` : '';
};

// Format status for display
function formatStatus(status: string | null): string {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function AdminNotificationBell({ onOpenLead }: AdminNotificationBellProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');

  const unreadCount = activities.filter(a => !a.is_read && a.is_notification).length;

  const getTimeFilterDate = useCallback((filter: TimeFilter) => {
    const now = new Date();
    switch (filter) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'all':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }, []);

  const filteredActivities = useMemo(() => {
    const filterDate = getTimeFilterDate(timeFilter);
    return activities.filter(a => new Date(a.created_at) >= filterDate);
  }, [activities, timeFilter, getTimeFilterDate]);

  const fetchActivities = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      const last30DaysISO = last30Days.toISOString();

      const [notificationsRes, leadsRes, documentsRes, statusHistoryRes] = await Promise.all([
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.user.id)
          .gte("created_at", last30DaysISO)
          .order("created_at", { ascending: false })
          .limit(100),
        
        // Include loan_amount in leads query
        supabase
          .from("leads_new")
          .select("id, case_id, created_at, loan_amount, student:students(name, phone)")
          .gte("created_at", last30DaysISO)
          .order("created_at", { ascending: false })
          .limit(50),
        
        // Include loan_amount via lead join
        supabase
          .from("lead_documents")
          .select("id, lead_id, verification_status, created_at, updated_at, document_type:document_types(name), lead:leads_new(case_id, loan_amount, student:students(name, phone))")
          .gte("created_at", last30DaysISO)
          .order("created_at", { ascending: false })
          .limit(50),
        
        // Include loan_amount via lead join
        supabase
          .from("lead_status_history")
          .select("id, lead_id, old_status, new_status, created_at, lead:leads_new(case_id, loan_amount, student:students(name, phone))")
          .gte("created_at", last30DaysISO)
          .order("created_at", { ascending: false })
          .limit(50),
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

      // Transform new leads
      const notificationLeadIds = new Set(
        notificationsRes.data?.filter(n => n.notification_type === 'lead_created' && n.lead_id).map(n => n.lead_id) || []
      );
      
      if (leadsRes.data) {
        for (const lead of leadsRes.data) {
          if (notificationLeadIds.has(lead.id)) continue;
          const student = lead.student as any;
          const studentName = student?.name || 'Unknown';
          const studentPhone = student?.phone || null;
          allActivities.push({
            id: `lead-${lead.id}`,
            type: 'lead_created',
            title: 'New Lead Created',
            message: `Lead ${lead.case_id} created for ${studentName}`,
            created_at: lead.created_at,
            lead_id: lead.id,
            is_read: true,
            is_notification: false,
            metadata: { 
              name: studentName, 
              phone: studentPhone, 
              case_id: lead.case_id,
              loan_amount: lead.loan_amount 
            },
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
          if (notificationDocIds.has(doc.id)) continue;
          const docTypeName = (doc.document_type as any)?.name || 'Document';
          const lead = doc.lead as any;
          const studentName = lead?.student?.name || 'Unknown';
          const studentPhone = lead?.student?.phone || null;
          const caseId = lead?.case_id || '';
          const loanAmount = lead?.loan_amount || null;
          
          allActivities.push({
            id: `doc-${doc.id}`,
            type: 'document_uploaded',
            title: `${docTypeName} Uploaded`,
            message: `${studentName}${caseId ? ` (${caseId})` : ''}`,
            created_at: doc.created_at || doc.updated_at || new Date().toISOString(),
            lead_id: doc.lead_id,
            is_read: true,
            is_notification: false,
            metadata: { 
              name: studentName, 
              phone: studentPhone, 
              case_id: caseId,
              loan_amount: loanAmount 
            },
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
          const lead = status.lead as any;
          const studentName = lead?.student?.name || 'Unknown';
          const studentPhone = lead?.student?.phone || null;
          const caseId = lead?.case_id || '';
          const loanAmount = lead?.loan_amount || null;
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
            metadata: { 
              name: studentName, 
              phone: studentPhone, 
              case_id: caseId, 
              loan_amount: loanAmount,
              old_status: status.old_status, 
              new_status: status.new_status 
            },
          });
        }
      }

      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setActivities(allActivities.slice(0, 100));
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();

    const setupChannel = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const channel = supabase
        .channel("admin-notifications")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.user.id}` }, () => fetchActivities())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads_new" }, () => fetchActivities())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "lead_documents" }, () => fetchActivities())
        .subscribe();

      return channel;
    };

    let channel: ReturnType<typeof supabase.channel> | undefined;
    setupChannel().then(c => { channel = c; });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchActivities]);

  const markAsRead = async (activityId: string) => {
    if (!activityId.startsWith('notif-')) return;
    const notifId = activityId.replace('notif-', '');
    await supabase.from("notifications").update({ is_read: true }).eq("id", notifId);
    setActivities(prev => prev.map(a => (a.id === activityId ? { ...a, is_read: true } : a)));
  };

  const markAllAsRead = async () => {
    const unreadNotifIds = activities.filter(a => !a.is_read && a.is_notification).map(a => a.id.replace('notif-', ''));
    if (unreadNotifIds.length === 0) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadNotifIds);
    setActivities(prev => prev.map(a => (a.is_notification ? { ...a, is_read: true } : a)));
  };

  const handleActivityClick = async (activity: ActivityItem) => {
    if (!activity.is_read && activity.is_notification) {
      await markAsRead(activity.id);
    }
    setOpen(false);

    if (activity.lead_id && onOpenLead) {
      const focus = getFocusParam(activity.type);
      onOpenLead(activity.lead_id, focus);
    }
  };

  const getFocusParam = (type: string): string => {
    switch (type) {
      case 'lender_assigned': return 'lender';
      case 'status_change': return 'timeline';
      case 'document_uploaded':
      case 'document_verified':
      case 'document_rejected': return 'documents';
      default: return 'overview';
    }
  };

  const getTypeIcon = (type: string) => {
    const iconClass = "h-4 w-4 shrink-0";
    switch (type) {
      case "document_uploaded": return <FileText className={cn(iconClass, "text-blue-500")} />;
      case "lead_created": return <UserPlus className={cn(iconClass, "text-green-500")} />;
      case "status_change": return <RefreshCw className={cn(iconClass, "text-orange-500")} />;
      case "document_verified": return <CheckCircle className={cn(iconClass, "text-green-500")} />;
      case "document_rejected": return <XCircle className={cn(iconClass, "text-red-500")} />;
      case "lender_assigned": return <Target className={cn(iconClass, "text-purple-500")} />;
      case "action_required": return <AlertTriangle className={cn(iconClass, "text-amber-500")} />;
      case "clarification_raised": return <MessageCircle className={cn(iconClass, "text-cyan-500")} />;
      default: return <Bell className={cn(iconClass, "text-muted-foreground")} />;
    }
  };

  const formatCompactTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderNotificationRow = (activity: ActivityItem) => {
    const meta = activity.metadata;
    const name = meta?.name && meta.name !== 'Unknown' ? meta.name : '';
    const phone = formatPhoneShort(meta?.phone);
    const amount = formatLoanAmount(meta?.loan_amount);
    const time = formatCompactTime(activity.created_at);
    const isUnread = !activity.is_read && activity.is_notification;

    const rowContent = (
      <div
        className={cn(
          "px-3 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-0",
          isUnread && "bg-primary/5"
        )}
        onClick={() => handleActivityClick(activity)}
      >
        {/* Row 1: Icon + Title + Unread dot + Time */}
        <div className="flex items-center gap-2 mb-1">
          {getTypeIcon(activity.type)}
          <span className={cn("flex-1 text-sm truncate", isUnread && "font-medium")}>
            {activity.title}
          </span>
          {isUnread && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{time}</span>
        </div>
        
        {/* Row 2: Name • Phone • Amount - always visible */}
        <div className="flex items-center gap-1.5 ml-6 text-xs text-muted-foreground">
          {name && (
            <span className="truncate max-w-[160px]">{name}</span>
          )}
          {name && phone && <span className="opacity-50">•</span>}
          {phone && <span className="shrink-0">{phone}</span>}
          {(name || phone) && amount && <span className="opacity-50">•</span>}
          {amount && (
            <span className="text-primary font-medium shrink-0">{amount}</span>
          )}
          {!name && !phone && !amount && meta?.case_id && (
            <span className="truncate">{meta.case_id}</span>
          )}
        </div>
      </div>
    );

    // Desktop hover card for extended details
    return (
      <HoverCard key={activity.id} openDelay={300} closeDelay={100}>
        <HoverCardTrigger asChild>
          {rowContent}
        </HoverCardTrigger>
        <HoverCardContent side="left" align="start" className="w-72 p-3 text-sm space-y-2">
          {activity.lead_id && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lead ID</span>
              <span className="font-mono text-xs">{activity.lead_id.slice(0, 8)}…</span>
            </div>
          )}
          {meta?.name && meta.name !== 'Unknown' && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{meta.name}</span>
            </div>
          )}
          {meta?.phone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{meta.phone}</span>
            </div>
          )}
          {meta?.loan_amount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan Amount</span>
              <span className="font-medium">{formatLoanAmount(meta.loan_amount)}</span>
            </div>
          )}
          {meta?.case_id && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Case ID</span>
              <span>{meta.case_id}</span>
            </div>
          )}
          {meta?.new_status && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span>{formatStatus(meta.new_status)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-border text-muted-foreground text-xs">
            {activity.message}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const filterCount = filteredActivities.length;

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
      <PopoverContent 
        align="end" 
        className="w-[420px] max-w-[25vw] min-w-[320px] p-0"
        sideOffset={8}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-1">
            {(['24h', '7d', 'all'] as TimeFilter[]).map((f) => (
              <Button
                key={f}
                variant={timeFilter === f ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setTimeFilter(f)}
              >
                {f === 'all' ? 'All' : f}
              </Button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{filterCount} items</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              Loading...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div>
              {filteredActivities.map(renderNotificationRow)}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default AdminNotificationBell;
