import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  FileText,
  MessageSquare,
  Upload,
  CheckCircle,
  Clock,
  Info,
} from 'lucide-react';
import { Clarification } from '@/hooks/useClarifications';
import { cn } from '@/lib/utils';

interface ClarificationResponseModalProps {
  clarification: Clarification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (clarificationId: string, response: { text?: string; document_id?: string }) => Promise<void>;
}

export function ClarificationResponseModal({
  clarification,
  open,
  onOpenChange,
  onSubmit,
}: ClarificationResponseModalProps) {
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!clarification) return null;

  const handleSubmit = async () => {
    if (!responseText.trim() && clarification.response_type === 'text') {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(clarification.id, { text: responseText });
      setResponseText('');
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-amber-500 text-white';
      case 'normal':
        return 'bg-blue-500 text-white';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            {clarification.is_blocking ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <MessageSquare className="h-5 w-5 text-primary" />
            )}
            <Badge className={cn('text-xs capitalize', getPriorityColor(clarification.priority))}>
              {clarification.priority} Priority
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {clarification.question_type.replace('_', ' ')}
            </Badge>
          </div>
          <DialogTitle className="text-xl">
            {clarification.is_blocking ? 'Blocking Question' : 'Question from Team'}
          </DialogTitle>
          <DialogDescription>
            Please provide a response to continue with your application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {clarification.is_blocking && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This question is blocking your loan application progress. Please respond promptly.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className="text-base font-semibold">Question</Label>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-foreground">{clarification.question_text}</p>
              {clarification.question_context && (
                <p className="text-sm text-muted-foreground mt-2 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  {clarification.question_context}
                </p>
              )}
            </div>
          </div>

          {clarification.due_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Response requested by: {new Date(clarification.due_date).toLocaleDateString()}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="response" className="text-base font-semibold">
              Your Response
            </Label>
            {(clarification.response_type === 'text' || clarification.response_type === 'both') && (
              <Textarea
                id="response"
                placeholder="Type your response here..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                className="resize-none"
              />
            )}
            {(clarification.response_type === 'document' || clarification.response_type === 'both') && (
              <div className="mt-3">
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload Document</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG up to 10MB
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Document upload functionality coming soon
                </p>
              </div>
            )}
          </div>

          {clarification.status === 'answered' && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                You have already responded to this question. The team is reviewing your response.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (clarification.response_type === 'text' && !responseText.trim()) ||
              clarification.status !== 'pending'
            }
          >
            {isSubmitting ? 'Submitting...' : 'Submit Response'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
