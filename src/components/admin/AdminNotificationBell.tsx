import { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, FileText, UserPlus, RefreshCw, CheckCircle, XCircle, Target, AlertTriangle, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type TimeFilter = '24h' | '7d' | 'all';
type TabFilter = 'activity' | 'alerts';

interface ActivityItem {
  id: string;
  type: 'lead_created' | 'document_uploaded' | 'status_change' | 'document_verified' | 'document_rejected' | 'lender_assigned' | 'notification' | 'action_required' | 'clarification_raised';
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

import { formatDisplayText } from '@/utils/formatters';

// Format status for display - use centralized formatter
const formatStatus = (status: string | null): string => {
  if (!status) return 'Unknown';
  return formatDisplayText(status);
};

// Alert types that go into "Alerts" tab
const ALERT_TYPES = ['action_required', 'clarification_raised', 'document_rejected'];

export function AdminNotificationBell({ onOpenLead }: AdminNotificationBellProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');
  const [activeTab, setActiveTab] = useState<TabFilter>('activity');
  const [searchQuery, setSearchQuery] = useState('');

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
    let filtered = activities.filter(a => new Date(a.created_at) >= filterDate);
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(q) ||
        a.metadata?.name?.toLowerCase().includes(q) ||
        a.metadata?.case_id?.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [activities, timeFilter, getTimeFilterDate, searchQuery]);

  // Split into activity and alerts
  const alertActivities = useMemo(() => 
    filteredActivities.filter(a => ALERT_TYPES.includes(a.type)), 
    [filteredActivities]
  );
  
  const generalActivities = useMemo(() => 
    filteredActivities.filter(a => !ALERT_TYPES.includes(a.type)), 
    [filteredActivities]
  );

  const displayActivities = activeTab === 'alerts' ? alertActivities : generalActivities;

  // Group by date
  const groupByDate = useCallback((items: ActivityItem[]) => {
    const groups: { label: string; items: ActivityItem[] }[] = [];
    const groupMap = new Map<string, ActivityItem[]>();
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    for (const item of items) {
      const d = new Date(item.created_at);
      let label: string;
      
      if (d.toDateString() === today.toDateString()) {
        label = 'Today';
      } else if (d.toDateString() === yesterday.toDateString()) {
        label = 'Yesterday';
      } else {
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      if (!groupMap.has(label)) {
        groupMap.set(label, []);
      }
      groupMap.get(label)!.push(item);
    }
    
    for (const [label, items] of groupMap) {
      groups.push({ label, items });
    }
    
    return groups;
  }, []);

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
        
        supabase
          .from("leads_new")
          .select("id, case_id, created_at, loan_amount, student:students(name, phone)")
          .gte("created_at", last30DaysISO)
          .order("created_at", { ascending: false })
          .limit(50),
        
        supabase
          .from("lead_documents")
          .select("id, lead_id, verification_status, created_at, updated_at, document_type:document_types(name), lead:leads_new(case_id, loan_amount, student:students(name, phone))")
          .gte("created_at", last30DaysISO)
          .order("created_at", { ascending: false })
          .limit(50),
        
        supabase
          .from("lead_status_history")
          .select("id, lead_id, old_status, new_status, created_at, lead:leads_new(case_id, loan_amount, student:students(name, phone))")
          .gte("created_at", last30DaysISO)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const allActivities: ActivityItem[] = [];

      // Build a map of lead_id -> lead data for enriching notifications
      const leadDataMap = new Map<string, { name: string; phone: string | null; case_id: string; loan_amount: number | null }>();
      if (leadsRes.data) {
        for (const lead of leadsRes.data) {
          const student = lead.student as any;
          leadDataMap.set(lead.id, {
            name: student?.name || 'Unknown',
            phone: student?.phone || null,
            case_id: lead.case_id,
            loan_amount: lead.loan_amount,
          });
        }
      }

      // Transform notifications - enrich with lead data
      if (notificationsRes.data) {
        for (const n of notificationsRes.data) {
          const rawMeta = typeof n.metadata === 'object' && n.metadata !== null ? n.metadata as Record<string, any> : {};
          
          const leadData = n.lead_id ? leadDataMap.get(n.lead_id) : null;
          const enrichedMeta: Record<string, any> = {
            ...rawMeta,
            name: leadData?.name || rawMeta.student_name || rawMeta.name || 'Unknown',
            phone: leadData?.phone || rawMeta.phone || null,
            case_id: leadData?.case_id || rawMeta.case_id || rawMeta.lead_id || null,
            loan_amount: leadData?.loan_amount || rawMeta.loan_amount || null,
          };
          
          allActivities.push({
            id: `notif-${n.id}`,
            type: n.notification_type as ActivityItem['type'],
            title: n.title,
            message: n.message,
            created_at: n.created_at,
            lead_id: n.lead_id,
            is_read: n.is_read || false,
            is_notification: true,
            metadata: enrichedMeta,
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
      case "lead_created": return <UserPlus className={cn(iconClass, "text-green-600")} />;
      case "status_change": return <RefreshCw className={cn(iconClass, "text-orange-500")} />;
      case "document_verified": return <CheckCircle className={cn(iconClass, "text-green-500")} />;
      case "document_rejected": return <XCircle className={cn(iconClass, "text-red-500")} />;
      case "lender_assigned": return <Target className={cn(iconClass, "text-purple-500")} />;
      case "action_required": return <AlertTriangle className={cn(iconClass, "text-amber-500")} />;
      case "clarification_raised": return <MessageCircle className={cn(iconClass, "text-cyan-500")} />;
      default: return <Bell className={cn(iconClass, "text-muted-foreground")} />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'lead_created': return 'View Lead';
      case 'lender_assigned': return 'View Lender';
      case 'document_uploaded':
      case 'document_verified':
      case 'document_rejected': return 'View Docs';
      case 'status_change': return 'View Details';
      case 'action_required':
      case 'clarification_raised': return 'Take Action';
      default: return 'View';
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderNotificationRow = (activity: ActivityItem) => {
    const meta = activity.metadata;
    const name = meta?.name && meta.name !== 'Unknown' ? meta.name : '';
    const amount = formatLoanAmount(meta?.loan_amount);
    const time = formatCompactTime(activity.created_at);
    const isUnread = !activity.is_read && activity.is_notification;

    return (
      <div
        key={activity.id}
        className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/60 cursor-pointer transition-colors group"
        onClick={() => handleActivityClick(activity)}
      >
        {/* Unread dot */}
        <div className="pt-1 w-2.5 shrink-0">
          {isUnread && (
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          )}
        </div>
        
        {/* Icon */}
        <div className="pt-0.5">
          {getTypeIcon(activity.type)}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("text-sm truncate", isUnread && "font-semibold text-foreground")}>
              {activity.title}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{time}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            {name && <span className="font-medium text-foreground/80 uppercase truncate max-w-[160px]">{name}</span>}
            {name && meta?.case_id && <span className="text-muted-foreground/50">•</span>}
            {meta?.case_id && <span className="font-mono text-[11px]">{meta.case_id}</span>}
            {(name || meta?.case_id) && amount && <span className="text-muted-foreground/50">•</span>}
            {amount && <span className="text-green-600 dark:text-green-500 font-semibold">{amount}</span>}
          </div>
        </div>
        
        {/* Action Link - visible on hover */}
        <button 
          className="text-xs text-primary font-medium hover:underline whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pt-0.5 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            handleActivityClick(activity);
          }}
        >
          {getActionLabel(activity.type)}
        </button>
      </div>
    );
  };

  const groupedActivities = groupByDate(displayActivities);

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
        className="w-[520px] max-w-[95vw] min-w-[400px] p-0 bg-background border border-border shadow-2xl shadow-black/15 rounded-xl overflow-hidden"
        sideOffset={10}
      >
        {/* Search Bar */}
        <div className="px-4 pt-4 pb-3 border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search notifications..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-muted/40 border-border/50 focus:bg-background"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabFilter)} className="w-full">
          <div className="flex items-center justify-between px-4 border-b border-border/60">
            <TabsList className="h-12 bg-transparent p-0 gap-0">
              <TabsTrigger 
                value="activity" 
                className="h-full px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium"
              >
                Activity
              </TabsTrigger>
              <TabsTrigger 
                value="alerts" 
                className="h-full px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium"
              >
                Alerts
                {alertActivities.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 text-xs">
                    {alertActivities.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
                {(['24h', '7d', 'all'] as TimeFilter[]).map((f) => (
                  <button
                    key={f}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded transition-colors",
                      timeFilter === f 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setTimeFilter(f)}
                  >
                    {f === 'all' ? '30d' : f}
                  </button>
                ))}
              </div>
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
          </div>

          <TabsContent value="activity" className="m-0">
            <ScrollArea className="h-[400px] bg-background">
              {loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  Loading...
                </div>
              ) : groupedActivities.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No activity found</p>
                </div>
              ) : (
                groupedActivities.map((group) => (
                  <div key={group.label}>
                    <div className="px-4 py-2 text-sm font-semibold text-foreground bg-muted/40 border-b border-border/40 sticky top-0">
                      {group.label}
                    </div>
                    {group.items.map(renderNotificationRow)}
                  </div>
                ))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="alerts" className="m-0">
            <ScrollArea className="h-[400px] bg-background">
              {loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  Loading...
                </div>
              ) : alertActivities.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No alerts</p>
                </div>
              ) : (
                groupByDate(alertActivities).map((group) => (
                  <div key={group.label}>
                    <div className="px-4 py-2 text-sm font-semibold text-foreground bg-muted/40 border-b border-border/40 sticky top-0">
                      {group.label}
                    </div>
                    {group.items.map(renderNotificationRow)}
                  </div>
                ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export default AdminNotificationBell;
