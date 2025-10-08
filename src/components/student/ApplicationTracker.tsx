import { useParams, useNavigate } from 'react-router-dom';
import { useApplicationActivity } from '@/hooks/useApplicationActivity';
import { useApplicationComments } from '@/hooks/useApplicationComments';
import { useLeadDocuments } from '@/hooks/useLeadDocuments';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  FileText, 
  MessageSquare, 
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Upload,
  User,
  Shield
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { getStatusColor, getDocumentStatusColor } from '@/utils/statusUtils';

export default function ApplicationTracker() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');

  const { activities, loading: activitiesLoading } = useApplicationActivity(applicationId || '');
  const { comments, loading: commentsLoading, addComment } = useApplicationComments(applicationId || '');
  const { documents, loading: documentsLoading } = useLeadDocuments(applicationId || '');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'status_change': return <Activity className="h-4 w-4" />;
      case 'document_upload': return <Upload className="h-4 w-4" />;
      case 'document_verification': return <CheckCircle2 className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getDocumentIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'uploaded': return <Clock className="h-4 w-4 text-warning" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'resubmission_required': return <AlertCircle className="h-4 w-4 text-warning" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await addComment(commentText);
    setCommentText('');
  };

  const calculateProgress = () => {
    if (!documents.length) return 0;
    const verified = documents.filter(d => (d as any).verification_status === 'verified').length;
    return Math.round((verified / documents.length) * 100);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/student')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Status
              </CardTitle>
              <CardDescription>Track your document verification progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span className="font-medium">{calculateProgress()}%</span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>

              <Separator />

              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {documentsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading documents...</p>
                  ) : documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          {getDocumentIcon(doc.verification_status || 'pending')}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{doc.document_types?.name || 'Document'}</p>
                            <p className="text-xs text-muted-foreground">{doc.original_filename}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={getDocumentStatusColor(doc.verification_status as any || 'pending')}>
                          {doc.verification_status || 'pending'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
              <CardDescription>Recent updates on your application</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {activitiesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading activities...</p>
                  ) : activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activities yet</p>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            {getActivityIcon(activity.activity_type)}
                          </div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          {activity.actor_name && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {activity.actor_role === 'admin' || activity.actor_role === 'super_admin' ? (
                                <Shield className="h-3 w-3" />
                              ) : (
                                <User className="h-3 w-3" />
                              )}
                              {activity.actor_name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Comments */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments
              </CardTitle>
              <CardDescription>Communicate with your loan officer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {commentsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading comments...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet. Start a conversation!</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-muted/50 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium flex items-center gap-1">
                            {comment.user_role === 'admin' || comment.user_role === 'super_admin' ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            {comment.user_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <p className="text-sm">{comment.comment_text}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <Separator />

              <div className="space-y-2">
                <Textarea
                  placeholder="Type your message..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleAddComment} 
                  disabled={!commentText.trim()}
                  className="w-full"
                >
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
