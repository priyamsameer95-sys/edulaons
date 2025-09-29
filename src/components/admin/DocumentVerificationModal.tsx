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
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const handleVerification = async (status: 'verified' | 'rejected') => {
    if (!document) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('lead_documents')
        .update({
          verification_status: status,
          admin_notes: adminNotes.trim() || null,
          verified_by: (await supabase.auth.getUser()).data.user?.id
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
        description: `Document ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
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
            variant="destructive"
            onClick={() => handleVerification('rejected')}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject Document
          </Button>
          
          <Button
            onClick={() => handleVerification('verified')}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Verify Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}