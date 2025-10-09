import { LoadingButton } from '@/components/ui/loading-button';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface DeactivateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  userEmail: string;
  loading?: boolean;
}

export function DeactivateUserDialog({
  open,
  onOpenChange,
  onConfirm,
  userEmail,
  loading = false,
}: DeactivateUserDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim().length >= 5) {
      onConfirm(reason);
      setReason('');
    }
  };

  const handleCancel = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Deactivate User Account
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to deactivate <strong>{userEmail}</strong>. This user will no longer be able to access the system.
            The account can be reactivated later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Deactivation *</Label>
          <Textarea
            id="reason"
            placeholder="Please provide a reason for deactivating this user account (minimum 5 characters)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
          {reason.length > 0 && reason.length < 5 && (
            <p className="text-sm text-destructive">Reason must be at least 5 characters</p>
          )}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton
            variant="destructive"
            onClick={handleConfirm}
            loading={loading}
            loadingText="Deactivating..."
            disabled={reason.trim().length < 5}
          >
            Deactivate User
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
