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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StatusSelect } from '@/components/lead-status/StatusSelect';
import type { DocumentStatus } from '@/utils/statusUtils';
import { Bot, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

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
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus>(
    document?.verification_status || 'pending'
  );
  const { toast } = useToast();

  // Pre-populate admin notes with AI findings if available
  // Don't pre-fill admin notes - let admin write their own comments

  const handleVerification = async () => {
    if (!document) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('lead_documents')
        .update({
          verification_status: selectedStatus,
          admin_notes: adminNotes.trim() || null,
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verified_at: selectedStatus === 'verified' ? new Date().toISOString() : null
        })
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

      toast({
        title: 'Success',
        description: `Document status updated to ${selectedStatus} successfully`,
      });

      onVerificationComplete();
      onOpenChange(false);
      setAdminNotes('');
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Document Verification</DialogTitle>
          <DialogDescription>
            Review and verify the document: {document?.original_filename}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* AI Validation - Compact single line */}
          {document?.ai_validation_status && document.ai_validation_status !== 'pending' && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border text-sm">
              <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
              
              {/* Status badge */}
              {document.ai_validation_status === 'validated' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30">
                  <CheckCircle className="h-3 w-3 mr-1" />OK
                </Badge>
              )}
              {document.ai_validation_status === 'rejected' && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30">
                  <XCircle className="h-3 w-3 mr-1" />Rejected
                </Badge>
              )}
              {document.ai_validation_status === 'manual_review' && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30">
                  <AlertTriangle className="h-3 w-3 mr-1" />Review
                </Badge>
              )}

              {/* Inline details */}
              {document.ai_detected_type && (
                <span className="text-muted-foreground text-xs">
                  {document.ai_detected_type}
                </span>
              )}
              
              {document.ai_confidence_score != null && (
                <Badge variant="outline" className={`text-xs ${
                  document.ai_confidence_score >= 75 ? "bg-green-50 text-green-700 dark:bg-green-950/30" :
                  document.ai_confidence_score >= 50 ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30" :
                  "bg-red-50 text-red-700 dark:bg-red-950/30"
                }`}>
                  {document.ai_confidence_score}%
                </Badge>
              )}

              {document.ai_quality_assessment && (
                <span className="text-muted-foreground text-xs capitalize">{document.ai_quality_assessment}</span>
              )}

              {/* Notes inline */}
              {document.ai_validation_notes && (
                <span className="text-xs text-muted-foreground">• {document.ai_validation_notes}</span>
              )}
            </div>
          )}

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
            <p className="text-xs text-muted-foreground">
              Select the appropriate status for this document. Changes will automatically sync to the lead level.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
            <Textarea
              id="admin-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any verification notes or feedback..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              These notes will be visible to other admins and can help with future reference.
            </p>
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
            disabled={loading}
          >
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}