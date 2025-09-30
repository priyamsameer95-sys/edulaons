import { Activity, CheckCircle2, FileUp, UserPlus, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityItem {
  id: string;
  type: 'approval' | 'document' | 'partner' | 'alert' | 'milestone';
  message: string;
  timestamp: string;
  partner?: string;
  leadId?: string;
}

interface LiveActivityFeedProps {
  activities: ActivityItem[];
}

const activityIcons = {
  approval: CheckCircle2,
  document: FileUp,
  partner: UserPlus,
  alert: AlertCircle,
  milestone: TrendingUp,
};

const activityColors = {
  approval: 'text-success',
  document: 'text-primary',
  partner: 'text-accent',
  alert: 'text-warning',
  milestone: 'text-purple-500',
};

const activityBgColors = {
  approval: 'bg-success/10',
  document: 'bg-primary/10',
  partner: 'bg-accent/10',
  alert: 'bg-warning/10',
  milestone: 'bg-purple-500/10',
};

export const LiveActivityFeed = ({ activities }: LiveActivityFeedProps) => {
  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-destructive animate-pulse" />
            Live Activity
          </CardTitle>
          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type];
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-all group"
                >
                  <div className={`p-2 rounded-full ${activityBgColors[activity.type]} group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-4 w-4 ${activityColors[activity.type]}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-relaxed">
                      {activity.message}
                    </p>
                    {activity.partner && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {activity.partner}
                      </Badge>
                    )}
                  </div>

                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {getTimeAgo(activity.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
