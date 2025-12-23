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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileQuestion, PenLine, Check } from 'lucide-react';
import { ClarificationTemplate, Clarification } from '@/hooks/useClarifications';
import { cn } from '@/lib/utils';

interface RaiseClarificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  templates: ClarificationTemplate[];
  onSubmit: (data: {
    lead_id: string;
    question_type: Clarification['question_type'];
    question_text: string;
    question_context?: string;
    response_type?: Clarification['response_type'];
    is_blocking?: boolean;
    priority?: Clarification['priority'];
    due_date?: string;
    created_by?: string;
    created_by_role?: 'admin' | 'partner' | 'system';
  }) => Promise<Clarification | void>;
  createdBy?: string;
  createdByRole?: 'admin' | 'partner';
}

export function RaiseClarificationModal({
  open,
  onOpenChange,
  leadId,
  templates,
  onSubmit,
  createdBy,
  createdByRole = 'admin',
}: RaiseClarificationModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ClarificationTemplate | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [questionType, setQuestionType] = useState<Clarification['question_type']>('information');
  const [responseType, setResponseType] = useState<Clarification['response_type']>('text');
  const [isBlocking, setIsBlocking] = useState(false);
  const [priority, setPriority] = useState<Clarification['priority']>('normal');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');

  const handleSelectTemplate = (template: ClarificationTemplate) => {
    setSelectedTemplate(template);
    setCustomQuestion(template.question_text);
    setCustomContext(template.question_context || '');
    setQuestionType(template.category === 'document' ? 'document' : 'information');
    setResponseType(template.response_type);
  };

  const handleSubmit = async () => {
    const questionText = selectedTemplate ? selectedTemplate.question_text : customQuestion;
    if (!questionText.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        lead_id: leadId,
        question_type: questionType,
        question_text: questionText,
        question_context: customContext || undefined,
        response_type: responseType,
        is_blocking: isBlocking,
        priority,
        due_date: dueDate || undefined,
        created_by: createdBy,
        created_by_role: createdByRole,
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setCustomQuestion('');
    setCustomContext('');
    setQuestionType('information');
    setResponseType('text');
    setIsBlocking(false);
    setPriority('normal');
    setDueDate('');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'document':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'personal':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'academic':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'co_applicant':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'lender':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            Raise Clarification
          </DialogTitle>
          <DialogDescription>
            Ask the student a question about their application. They will be notified.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4 flex-1">
            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      selectedTemplate?.id === template.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:border-muted-foreground/50 hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={cn('text-xs capitalize', getCategoryColor(template.category))}
                          >
                            {template.category.replace('_', ' ')}
                          </Badge>
                          {template.requires_document && (
                            <Badge variant="secondary" className="text-xs">
                              Requires Doc
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{template.question_text}</p>
                        {template.question_context && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.question_context}
                          </p>
                        )}
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="custom" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Textarea
                id="question"
                placeholder="What would you like to ask the student?"
                value={customQuestion}
                onChange={(e) => {
                  setCustomQuestion(e.target.value);
                  setSelectedTemplate(null);
                }}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="context">Context / Help Text</Label>
              <Textarea
                id="context"
                placeholder="Additional context to help the student understand what's needed..."
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select value={questionType} onValueChange={(v) => setQuestionType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="information">Information</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="lender_specific">Lender Specific</SelectItem>
                    <SelectItem value="conditional">Conditional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Response Type</Label>
                <Select value={responseType} onValueChange={(v) => setResponseType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Only</SelectItem>
                    <SelectItem value="document">Document Upload</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="border-t pt-4 mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
            <div>
              <Label htmlFor="blocking" className="font-medium">
                Blocking Question
              </Label>
              <p className="text-xs text-muted-foreground">
                If enabled, this will block the student's application progress
              </p>
            </div>
            <Switch
              id="blocking"
              checked={isBlocking}
              onCheckedChange={setIsBlocking}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!selectedTemplate && !customQuestion.trim())}
          >
            {isSubmitting ? 'Sending...' : 'Send to Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
