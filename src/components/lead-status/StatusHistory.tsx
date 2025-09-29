import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLeadStatusHistory } from '@/hooks/useLeadStatusHistory';
import { getStatusLabel, getDocumentStatusLabel } from '@/utils/statusUtils';
import { Clock, ArrowRight, User } from 'lucide-react';

interface StatusHistoryProps {
  leadId: string;
}

export function StatusHistory({ leadId }: StatusHistoryProps) {
  const { history, loading, error } = useLeadStatusHistory(leadId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load status history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Status History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No status changes recorded yet
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((record, index) => (
                <div key={record.id} className="border-l-2 border-muted pl-4 pb-4 relative">
                  <div className="absolute -left-2 top-0 w-3 h-3 bg-primary rounded-full"></div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                    </div>
                    
                    {record.old_status !== record.new_status && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Lead Status:</span>
                        {record.old_status && (
                          <Badge variant="outline">{getStatusLabel(record.old_status as any)}</Badge>
                        )}
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge>{getStatusLabel(record.new_status as any)}</Badge>
                      </div>
                    )}
                    
                    {record.old_documents_status !== record.new_documents_status && record.new_documents_status && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Documents:</span>
                        {record.old_documents_status && (
                          <Badge variant="outline">{getDocumentStatusLabel(record.old_documents_status as any)}</Badge>
                        )}
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge>{getDocumentStatusLabel(record.new_documents_status as any)}</Badge>
                      </div>
                    )}
                    
                    {record.change_reason && (
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Reason:</span>
                        <span className="ml-2">{record.change_reason}</span>
                      </div>
                    )}
                    
                    {record.notes && (
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Notes:</span>
                        <p className="ml-2 text-muted-foreground">{record.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}