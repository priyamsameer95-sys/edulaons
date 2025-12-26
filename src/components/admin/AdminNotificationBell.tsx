import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, FileText, UserPlus, RefreshCw, CheckCircle, XCircle, Target, AlertTriangle, MessageCircle, ExternalLink } from "lucide-react";
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

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  action_url: string | null;
  lead_id: string | null;
  metadata: Record<string, any> | null;
}

interface AdminNotificationBellProps {
  onOpenLead?: (leadId: string, tab?: string) => void;
}

export function AdminNotificationBell({ onOpenLead }: AdminNotificationBellProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Calculate 24 hours ago
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.user.id)
        .gte("created_at", last24Hours.toISOString())
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

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
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev.slice(0, 29)]);
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
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Close popover
    setOpen(false);

    // Navigate to lead detail if lead_id exists
    if (notification.lead_id) {
      const tab = getTabFromType(notification.notification_type);
      if (onOpenLead) {
        onOpenLead(notification.lead_id, tab);
      }
    } else if (notification.action_url) {
      navigate(notification.action_url);
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

  const getTypeBadge = (type: string) => {
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
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Last 24 Hours</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
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
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No activity in the last 24 hours</p>
              <p className="text-xs mt-1">
                All quiet! New leads, documents, and updates will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors group",
                    !notification.is_read && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getTypeIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeBadge(notification.notification_type)}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm line-clamp-1",
                        !notification.is_read && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      {notification.lead_id && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-3 w-3" />
                          View Lead Details
                        </div>
                      )}
                    </div>
                    {!notification.is_read && (
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
