import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDataAccessLog, DataAccessEntry } from '@/hooks/useDataAccessLog';
import { formatDisplayEmail } from '@/utils/formatters';

interface DataAccessLogProps {
  leadId: string;
}

const getRoleBadge = (role: string) => {
  const map: Record<string, string> = {
    'admin': 'bg-purple-100 text-purple-800',
    'partner': 'bg-blue-100 text-blue-800',
    'student': 'bg-green-100 text-green-800',
  };
  return map[role] || 'bg-muted text-muted-foreground';
};

export function DataAccessLog({ leadId }: DataAccessLogProps) {
  const { data: accessLog, isLoading } = useDataAccessLog(leadId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Access Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentViewers = accessLog?.slice(0, 20) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Access Log
          {recentViewers.length > 0 && (
            <Badge variant="secondary" className="text-xs">{recentViewers.length} views</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentViewers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No access records</p>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {recentViewers.map((entry: DataAccessEntry) => {
                const { display, isPlaceholder } = formatDisplayEmail(entry.user_email);
                return (
                  <div key={entry.id} className="flex items-center justify-between border rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadge(entry.user_role)}>{entry.user_role}</Badge>
                      <span className={`text-sm truncate max-w-[200px] ${isPlaceholder ? 'text-muted-foreground italic' : ''}`}>
                        {display}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {entry.accessed_at && formatDistanceToNow(new Date(entry.accessed_at), { addSuffix: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
