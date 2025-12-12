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
  useEffect(() => {
    if (document?.ai_validation_notes && !adminNotes) {
      setAdminNotes(`AI Notes: ${document.ai_validation_notes}`);
    }
  }, [document]);

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
          {/* AI Validation Details Section */}
          {document?.ai_validation_status && document.ai_validation_status !== 'pending' && (
            <div className={`p-4 rounded-lg border ${
              document.ai_validation_status === 'validated' 
                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                : document.ai_validation_status === 'rejected'
                ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Bot className={`h-4 w-4 ${
                  document.ai_validation_status === 'validated' ? 'text-green-600' :
                  document.ai_validation_status === 'rejected' ? 'text-red-600' : 'text-amber-600'
                }`} />
                <span className="font-medium text-sm">AI Validation Results</span>
                <Badge className={`ml-auto text-[10px] ${
                  document.ai_validation_status === 'validated' 
                    ? 'bg-green-500 text-white' 
                    : document.ai_validation_status === 'rejected'
                    ? 'bg-red-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {document.ai_validation_status === 'validated' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {document.ai_validation_status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                  {document.ai_validation_status === 'manual_review' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {document.ai_validation_status}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                {document.ai_detected_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Detected Type:</span>
                    <span className="font-medium">{document.ai_detected_type}</span>
                  </div>
                )}
                {document.ai_confidence_score !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Confidence:</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        document.ai_confidence_score >= 75 ? 'border-green-500 text-green-600' :
                        document.ai_confidence_score >= 50 ? 'border-amber-500 text-amber-600' :
                        'border-red-500 text-red-600'
                      }`}
                    >
                      {document.ai_confidence_score}%
                    </Badge>
                  </div>
                )}
                {document.ai_quality_assessment && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quality:</span>
                    <span className="capitalize">{document.ai_quality_assessment}</span>
                  </div>
                )}
                {document.ai_validation_notes && (
                  <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                    <span className="text-muted-foreground">AI Notes: </span>
                    {document.ai_validation_notes}
                  </div>
                )}
              </div>
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