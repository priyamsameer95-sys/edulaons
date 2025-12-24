/**
 * Document Verification Modal
 * 
 * Per Knowledge Base:
 * - AI can flag potential issues (blur, mismatch, missing pages)
 * - Verification status must be human-approved
 * - Every doc change must log: uploader role, status change role, reason (mandatory for reject)
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { StatusSelect } from '@/components/lead-status/StatusSelect';
import type { DocumentStatus } from '@/utils/statusUtils';
import { Bot, AlertTriangle, CheckCircle, XCircle, Sparkles, FileType } from 'lucide-react';

interface DocumentVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any;
  onVerificationComplete: () => void;
}

export function DocumentVerificationModal({
  open,
  onOpenChange,
  document,
  onVerificationComplete
}: DocumentVerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus>(
    document?.verification_status || 'pending'
  );
  const [acceptAISuggestion, setAcceptAISuggestion] = useState(false);
  
  const { toast } = useToast();
  const { logDocumentChange } = useAuditLog();

  // Reset state when document changes
  useEffect(() => {
    if (document) {
      setSelectedStatus(document.verification_status || 'pending');
      setAdminNotes('');
      setRejectReason('');
      setAcceptAISuggestion(false);
    }
  }, [document?.id]);

  const isRejecting = selectedStatus === 'rejected' || selectedStatus === 'resubmission_required';
  const hasAISuggestion = document?.ai_validation_status && document.ai_validation_status !== 'pending';

  const handleAcceptAI = () => {
    if (document?.ai_validation_status === 'validated') {
      setSelectedStatus('verified');
    } else if (document?.ai_validation_status === 'rejected') {
      setSelectedStatus('rejected');
      if (document?.ai_validation_notes) {
        setRejectReason(document.ai_validation_notes);
      }
    }
    setAcceptAISuggestion(true);
    toast({
      title: 'AI Suggestion Applied',
      description: 'You can still modify before saving',
    });
  };

  const handleVerification = async () => {
    if (!document) return;

    // KB: Mandatory reason for reject
    if (isRejecting && !rejectReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      const updateData: any = {
        verification_status: selectedStatus,
        admin_notes: adminNotes.trim() || null,
        verification_notes: isRejecting ? rejectReason.trim() : null,
        verified_by: user?.id,
        verified_at: selectedStatus === 'verified' ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('lead_documents')
        .update(updateData)
        .eq('id', document.id);

      if (error) {
        console.error('Error updating document verification:', error);
        toast({
          title: 'Error',
          description: 'Failed to update document verification',
          variant: 'destructive',
        });
        return;
      }

      // KB: Log document status change with audit trail
      await logDocumentChange({
        documentId: document.id,
        leadId: document.lead_id,
        action: selectedStatus === 'verified' ? 'verify' : 'reject',
        oldStatus: document.verification_status,
        newStatus: selectedStatus,
        reason: isRejecting ? rejectReason.trim() : undefined,
        aiSuggested: acceptAISuggestion,
      });

      toast({
        title: 'Success',
        description: `Document ${selectedStatus === 'verified' ? 'verified' : 'status updated'} successfully`,
      });

      onVerificationComplete();
      onOpenChange(false);
      setAdminNotes('');
      setRejectReason('');
    } catch (err) {
      console.error('Error in document verification:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Document Verification</DialogTitle>
          <DialogDescription>
            Review and verify: {document?.original_filename}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* AI Validation Panel - KB: AI flags issues, human approves */}
          {hasAISuggestion && (
            <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI Analysis</span>
                </div>
                
                {/* AI Status Badge */}
                {document.ai_validation_status === 'validated' && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30">
                    <CheckCircle className="h-3 w-3 mr-1" />Looks Good
                  </Badge>
                )}
                {document.ai_validation_status === 'rejected' && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30">
                    <XCircle className="h-3 w-3 mr-1" />Issues Found
                  </Badge>
                )}
                {document.ai_validation_status === 'manual_review' && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />Needs Review
                  </Badge>
                )}
              </div>

              {/* AI Details Row */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {document.ai_detected_type && (
                  <span className="flex items-center gap-1">
                    <FileType className="h-3 w-3" />
                    Detected: {document.ai_detected_type}
                  </span>
                )}
                {document.ai_confidence_score != null && (
                  <Badge variant="outline" className={`text-xs ${
                    document.ai_confidence_score >= 75 ? "bg-green-50 text-green-700" :
                    document.ai_confidence_score >= 50 ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {document.ai_confidence_score}% confidence
                  </Badge>
                )}
                {document.ai_quality_assessment && (
                  <span className="capitalize">Quality: {document.ai_quality_assessment}</span>
                )}
              </div>

              {document.ai_validation_notes && (
                <p className="text-xs text-muted-foreground italic">
                  "{document.ai_validation_notes}"
                </p>
              )}

              {/* KB: Accept AI Suggestion Button */}
              {!acceptAISuggestion && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptAI}
                  className="w-full mt-2"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Accept AI Suggestion
                </Button>
              )}
              {acceptAISuggestion && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  AI suggestion applied
                </p>
              )}
            </div>
          )}

          {/* Document Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Document Status</Label>
            <StatusSelect
              value={selectedStatus}
              onChange={(value) => setSelectedStatus(value as DocumentStatus)}
              type="document"
              currentStatus={document?.verification_status}
              disabled={loading}
              isAdmin={true}
            />
          </div>

          {/* KB: Mandatory Reject Reason */}
          {isRejecting && (
            <div className="space-y-2">
              <Label htmlFor="reject-reason" className="text-destructive">
                Reason for Rejection *
              </Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this document is being rejected..."
                className="min-h-[80px] border-destructive/50"
                required
              />
              <p className="text-xs text-destructive">
                A reason is required for rejected documents (KB compliance)
              </p>
            </div>
          )}

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
            <Textarea
              id="admin-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any internal notes..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleVerification}
            disabled={loading || (isRejecting && !rejectReason.trim())}
            variant={isRejecting ? "destructive" : "default"}
          >
            {selectedStatus === 'verified' ? 'Verify Document' : 
             isRejecting ? 'Reject Document' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}