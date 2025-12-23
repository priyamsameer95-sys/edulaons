import { useState } from 'react';
import { format } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Clarification } from '@/hooks/useClarifications';
import { cn } from '@/lib/utils';

interface ClarificationHistoryTabProps {
  clarifications: Clarification[];
  loading: boolean;
  onResolve: (id: string, notes?: string) => Promise<void>;
  onDismiss: (id: string, reason?: string) => Promise<void>;
  onRaiseNew: () => void;
}

export function ClarificationHistoryTab({
  clarifications,
  loading,
  onResolve,
  onDismiss,
  onRaiseNew,
}: ClarificationHistoryTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'answered':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'dismissed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      answered: 'bg-blue-100 text-blue-700 border-blue-200',
      resolved: 'bg-green-100 text-green-700 border-green-200',
      dismissed: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return variants[status] || variants.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      urgent: 'bg-red-500 text-white',
      high: 'bg-amber-500 text-white',
      normal: 'bg-blue-500 text-white',
      low: 'bg-gray-500 text-white',
    };
    return variants[priority] || variants.normal;
  };

  const handleResolve = async (id: string) => {
    setProcessingId(id);
    try {
      await onResolve(id, resolveNotes);
      setResolveNotes('');
      setExpandedId(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (id: string) => {
    setProcessingId(id);
    try {
      await onDismiss(id);
      setExpandedId(null);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const pendingCount = clarifications.filter((c) => c.status === 'pending').length;
  const answeredCount = clarifications.filter((c) => c.status === 'answered').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Clarifications</h3>
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              {pendingCount} Pending
            </Badge>
          )}
          {answeredCount > 0 && (
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              {answeredCount} Awaiting Review
            </Badge>
          )}
        </div>
        <Button onClick={onRaiseNew} size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Raise Clarification
        </Button>
      </div>

      {clarifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No clarifications raised for this lead</p>
            <Button onClick={onRaiseNew} variant="outline" className="mt-4">
              Raise First Clarification
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clarifications.map((clarification) => (
            <Collapsible
              key={clarification.id}
              open={expandedId === clarification.id}
              onOpenChange={() =>
                setExpandedId(expandedId === clarification.id ? null : clarification.id)
              }
            >
              <Card
                className={cn(
                  'transition-all',
                  clarification.is_blocking && clarification.status === 'pending' && 'border-destructive',
                  clarification.status === 'answered' && 'border-blue-500'
                )}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(clarification.status)}
                        <div className="space-y-1">
                          <CardTitle className="text-sm font-medium leading-snug">
                            {clarification.question_text.slice(0, 100)}
                            {clarification.question_text.length > 100 ? '...' : ''}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn('text-xs capitalize', getStatusBadge(clarification.status))}
                            >
                              {clarification.status}
                            </Badge>
                            <Badge className={cn('text-xs capitalize', getPriorityBadge(clarification.priority))}>
                              {clarification.priority}
                            </Badge>
                            {clarification.is_blocking && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Blocking
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(clarification.created_at), 'dd MMM yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      {expandedId === clarification.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-sm font-medium mb-1">Question</p>
                      <p className="text-sm">{clarification.question_text}</p>
                      {clarification.question_context && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Context: {clarification.question_context}
                        </p>
                      )}
                    </div>

                    {clarification.response_text && (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-700">Student Response</p>
                          {clarification.responded_at && (
                            <span className="text-xs text-blue-600">
                              {format(new Date(clarification.responded_at), 'dd MMM yyyy, HH:mm')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-blue-900">{clarification.response_text}</p>
                      </div>
                    )}

                    {clarification.response_document_id && (
                      <div className="flex items-center gap-2 p-2 rounded border bg-muted/50">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Document uploaded as response</span>
                      </div>
                    )}

                    {clarification.resolution_notes && (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-sm font-medium text-green-700 mb-1">Resolution Notes</p>
                        <p className="text-sm text-green-900">{clarification.resolution_notes}</p>
                      </div>
                    )}

                    {(clarification.status === 'pending' || clarification.status === 'answered') && (
                      <div className="space-y-3 pt-2 border-t">
                        <Textarea
                          placeholder="Add resolution notes (optional)..."
                          value={resolveNotes}
                          onChange={(e) => setResolveNotes(e.target.value)}
                          rows={2}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleResolve(clarification.id)}
                            disabled={processingId === clarification.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {clarification.status === 'answered' ? 'Mark Resolved' : 'Resolve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismiss(clarification.id)}
                            disabled={processingId === clarification.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
