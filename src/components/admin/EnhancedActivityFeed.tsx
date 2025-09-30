import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { FileUp, FileX, Edit, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'status_change' | 'document_upload' | 'document_delete' | 'document_verify' | 'document_reject';
  lead_id: string;
  case_id: string;
  student_name: string;
  partner_name: string;
  old_value?: string;
  new_value?: string;
  document_name?: string;
  change_reason?: string;
  notes?: string;
  changed_by_email?: string;
  timestamp: string;
}

export function EnhancedActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Real-time subscription for status history
    const statusChannel = supabase
      .channel('activity_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_status_history'
        },
        () => fetchActivities()
      )
      .subscribe();

    // Real-time subscription for document changes
    const docChannel = supabase
      .channel('activity_document_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_documents'
        },
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(docChannel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      // Fetch status changes
      const { data: statusChanges } = await supabase
        .from('lead_status_history')
        .select(`
          id,
          lead_id,
          old_status,
          new_status,
          old_documents_status,
          new_documents_status,
          change_reason,
          notes,
          created_at,
          changed_by
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch document changes
      const { data: documentChanges } = await supabase
        .from('lead_documents')
        .select(`
          id,
          lead_id,
          original_filename,
          verification_status,
          uploaded_at,
          verified_at,
          uploaded_by,
          admin_notes
        `)
        .order('uploaded_at', { ascending: false })
        .limit(20);

      // Get lead details for both types
      const leadIds = [
        ...(statusChanges || []).map(s => s.lead_id),
        ...(documentChanges || []).map(d => d.lead_id)
      ];

      const { data: leads } = await supabase
        .from('leads_new')
        .select(`
          id,
          case_id,
          students(name),
          partners(name)
        `)
        .in('id', leadIds);

      const leadMap = new Map(leads?.map(l => [l.id, l]) || []);

      // Get user emails for changed_by
      const userIds = (statusChanges || [])
        .map(s => s.changed_by)
        .filter(id => id);

      const { data: users } = await supabase
        .from('app_users')
        .select('id, email')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      // Combine and format activities
      const statusActivities: ActivityItem[] = (statusChanges || []).map(change => {
        const lead = leadMap.get(change.lead_id);
        const user = change.changed_by ? userMap.get(change.changed_by) : null;
        
        return {
          id: change.id,
          type: 'status_change' as const,
          lead_id: change.lead_id,
          case_id: lead?.case_id || 'Unknown',
          student_name: (lead?.students as any)?.name || 'Unknown',
          partner_name: (lead?.partners as any)?.name || 'Unknown',
          old_value: change.old_status || change.old_documents_status || undefined,
          new_value: change.new_status || change.new_documents_status || 'Unknown',
          change_reason: change.change_reason || undefined,
          notes: change.notes || undefined,
          changed_by_email: user?.email,
          timestamp: change.created_at
        };
      });

      const documentActivities: ActivityItem[] = (documentChanges || []).map(doc => {
        const lead = leadMap.get(doc.lead_id);
        
        let type: ActivityItem['type'] = 'document_upload';
        if (doc.verification_status === 'verified') type = 'document_verify';
        if (doc.verification_status === 'rejected') type = 'document_reject';
        
        return {
          id: doc.id,
          type,
          lead_id: doc.lead_id,
          case_id: lead?.case_id || 'Unknown',
          student_name: (lead?.students as any)?.name || 'Unknown',
          partner_name: (lead?.partners as any)?.name || 'Unknown',
          document_name: doc.original_filename,
          notes: doc.admin_notes || undefined,
          timestamp: doc.verified_at || doc.uploaded_at
        };
      });

      const allActivities = [...statusActivities, ...documentActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 30);

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'status_change':
        return <Edit className="h-4 w-4" />;
      case 'document_upload':
        return <FileUp className="h-4 w-4" />;
      case 'document_delete':
        return <FileX className="h-4 w-4" />;
      case 'document_verify':
        return <CheckCircle className="h-4 w-4" />;
      case 'document_reject':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'status_change':
        return 'text-primary bg-primary/10';
      case 'document_upload':
        return 'text-blue-600 bg-blue-600/10';
      case 'document_verify':
        return 'text-success bg-success/10';
      case 'document_reject':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const formatActivityMessage = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'status_change':
        return (
          <div className="space-y-1">
            <div className="font-medium">
              Status changed: <span className="text-destructive line-through">{activity.old_value}</span> → <span className="text-success">{activity.new_value}</span>
            </div>
            {activity.change_reason && (
              <div className="text-sm text-muted-foreground">Reason: {activity.change_reason}</div>
            )}
            {activity.notes && (
              <div className="text-sm text-muted-foreground">Note: {activity.notes}</div>
            )}
          </div>
        );
      case 'document_upload':
        return <div>Document uploaded: <span className="font-medium">{activity.document_name}</span></div>;
      case 'document_verify':
        return <div>Document verified: <span className="font-medium text-success">{activity.document_name}</span></div>;
      case 'document_reject':
        return <div>Document rejected: <span className="font-medium text-destructive">{activity.document_name}</span></div>;
      default:
        return <div>Activity recorded</div>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Live Activity Feed
          <Badge variant="secondary" className="ml-auto">{activities.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {activities.map(activity => (
              <div 
                key={activity.id}
                className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex gap-3">
                  <div className={`p-2 rounded-full ${getActivityColor(activity.type)} shrink-0`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 space-y-1 min-w-0">
                    {formatActivityMessage(activity)}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium">Case #{activity.case_id.slice(0, 8)}</span>
                      <span>•</span>
                      <span>{activity.student_name}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">{activity.partner_name}</Badge>
                      {activity.changed_by_email && (
                        <>
                          <span>•</span>
                          <span>by {activity.changed_by_email}</span>
                        </>
                      )}
                      <span className="ml-auto">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}