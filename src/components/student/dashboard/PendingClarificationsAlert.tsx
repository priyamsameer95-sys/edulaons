import { AlertTriangle, MessageSquareWarning, ChevronRight, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clarification } from '@/hooks/useClarifications';
import { cn } from '@/lib/utils';

interface PendingClarificationsAlertProps {
  clarifications: Clarification[];
  onViewClarification: (clarification: Clarification) => void;
  className?: string;
}

export function PendingClarificationsAlert({
  clarifications,
  onViewClarification,
  className,
}: PendingClarificationsAlertProps) {
  const pendingClarifications = clarifications.filter((c) => c.status === 'pending');
  
  if (pendingClarifications.length === 0) return null;

  const blockingCount = pendingClarifications.filter((c) => c.is_blocking).length;
  const urgentCount = pendingClarifications.filter((c) => c.priority === 'urgent' || c.priority === 'high').length;

  const sortedClarifications = [...pendingClarifications].sort((a, b) => {
    // Sort by blocking first, then by priority
    if (a.is_blocking !== b.is_blocking) return a.is_blocking ? -1 : 1;
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Alert 
      variant="destructive" 
      className={cn(
        'border-2 bg-destructive/5',
        blockingCount > 0 ? 'border-destructive' : 'border-amber-500',
        className
      )}
    >
      <MessageSquareWarning className="h-5 w-5" />
      <AlertTitle className="flex items-center gap-2 text-base font-semibold">
        Action Required - {pendingClarifications.length} Question{pendingClarifications.length > 1 ? 's' : ''} from Team
        {blockingCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {blockingCount} Blocking
          </Badge>
        )}
        {urgentCount > 0 && (
          <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
            {urgentCount} Urgent
          </Badge>
        )}
      </AlertTitle>
      <AlertDescription className="mt-3 space-y-3">
        <p className="text-sm text-muted-foreground">
          Please respond to the following questions to continue with your loan application.
        </p>
        
        <div className="space-y-2">
          {sortedClarifications.slice(0, 3).map((clarification, index) => (
            <div
              key={clarification.id}
              className={cn(
                'flex items-start justify-between gap-3 p-3 rounded-lg border bg-background',
                clarification.is_blocking && 'border-destructive bg-destructive/5'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {index + 1}. {clarification.question_text.slice(0, 80)}
                    {clarification.question_text.length > 80 ? '...' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {clarification.is_blocking && (
                    <span className="flex items-center gap-1 text-destructive font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      Blocking Progress
                    </span>
                  )}
                  {clarification.due_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Due: {new Date(clarification.due_date).toLocaleDateString()}
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {clarification.question_type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant={clarification.is_blocking ? 'destructive' : 'default'}
                onClick={() => onViewClarification(clarification)}
                className="shrink-0"
              >
                Answer
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>

        {sortedClarifications.length > 3 && (
          <p className="text-sm text-muted-foreground text-center">
            + {sortedClarifications.length - 3} more question{sortedClarifications.length - 3 > 1 ? 's' : ''}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
