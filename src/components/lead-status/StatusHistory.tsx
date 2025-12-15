import { formatDistanceToNow, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLeadStatusHistory } from '@/hooks/useLeadStatusHistory';
import { getStatusLabel, getDocumentStatusLabel } from '@/utils/statusUtils';
import { Clock, ArrowRight, User, FileText, Plus } from 'lucide-react';

interface StatusHistoryProps {
  leadId: string;
  documents?: Array<{
    id: string;
    uploaded_at: string;
    document_type_id: string;
  }>;
  documentTypes?: Array<{
    id: string;
    name: string;
  }>;
  createdAt?: string;
}

interface ActivityEvent {
  id: string;
  type: 'status_change' | 'document_upload' | 'lead_created';
  timestamp: string;
  data: any;
}

export function StatusHistory({ leadId, documents = [], documentTypes = [], createdAt }: StatusHistoryProps) {
  const { history, loading, error } = useLeadStatusHistory(leadId);

  // Merge all events into a single timeline
  const allEvents: ActivityEvent[] = [];

  // Add lead creation event
  if (createdAt) {
    allEvents.push({
      id: 'created',
      type: 'lead_created',
      timestamp: createdAt,
      data: null,
    });
  }

  // Add status change events
  history.forEach((record) => {
    allEvents.push({
      id: record.id,
      type: 'status_change',
      timestamp: record.created_at,
      data: record,
    });
  });

  // Add document upload events
  documents.forEach((doc) => {
    const docType = documentTypes.find((t) => t.id === doc.document_type_id);
    allEvents.push({
      id: doc.id,
      type: 'document_upload',
      timestamp: doc.uploaded_at,
      data: { ...doc, typeName: docType?.name || 'Document' },
    });
  });

  // Sort by timestamp descending (most recent first)
  allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (loading) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-muted rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Failed to load activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-72">
          {allEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">
              No activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {allEvents.map((event, index) => (
                <div key={event.id} className="flex items-start gap-2 text-xs">
                  {/* Icon */}
                  <div className="mt-0.5 shrink-0">
                    {event.type === 'lead_created' && (
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    {event.type === 'status_change' && (
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                        <ArrowRight className="h-3 w-3 text-amber-600" />
                      </div>
                    )}
                    {event.type === 'document_upload' && (
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <FileText className="h-3 w-3 text-emerald-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {event.type === 'lead_created' && (
                      <p className="font-medium">Lead created</p>
                    )}

                    {event.type === 'status_change' && (
                      <div className="space-y-1">
                        {event.data.old_status !== event.data.new_status && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-muted-foreground">Status:</span>
                            {event.data.old_status && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1">
                                {getStatusLabel(event.data.old_status)}
                              </Badge>
                            )}
                            <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                            <Badge className="text-[10px] h-4 px-1">
                              {getStatusLabel(event.data.new_status)}
                            </Badge>
                          </div>
                        )}
                        {event.data.old_documents_status !== event.data.new_documents_status && event.data.new_documents_status && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-muted-foreground">Docs:</span>
                            {event.data.old_documents_status && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1">
                                {getDocumentStatusLabel(event.data.old_documents_status)}
                              </Badge>
                            )}
                            <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                            <Badge className="text-[10px] h-4 px-1">
                              {getDocumentStatusLabel(event.data.new_documents_status)}
                            </Badge>
                          </div>
                        )}
                        {event.data.change_reason && (
                          <p className="text-muted-foreground truncate">
                            {event.data.change_reason}
                          </p>
                        )}
                      </div>
                    )}

                    {event.type === 'document_upload' && (
                      <p className="font-medium truncate">{event.data.typeName} uploaded</p>
                    )}
                  </div>

                  {/* Time */}
                  <span className="text-muted-foreground shrink-0">
                    {format(new Date(event.timestamp), 'MMM d, HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
