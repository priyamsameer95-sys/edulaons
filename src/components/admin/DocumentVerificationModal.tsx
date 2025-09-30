import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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