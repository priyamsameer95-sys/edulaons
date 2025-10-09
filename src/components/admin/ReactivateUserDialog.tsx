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
import { CheckCircle } from 'lucide-react';

interface ReactivateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  userEmail: string;
  loading?: boolean;
}

export function ReactivateUserDialog({
  open,
  onOpenChange,
  onConfirm,
  userEmail,
  loading = false,
}: ReactivateUserDialogProps) {
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
            <CheckCircle className="h-5 w-5 text-green-500" />
            Reactivate User Account
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to reactivate <strong>{userEmail}</strong>. This user will regain access to the system with their previous role and permissions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Reactivation *</Label>
          <Textarea
            id="reason"
            placeholder="Please provide a reason for reactivating this user account (minimum 5 characters)..."
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
            onClick={handleConfirm}
            loading={loading}
            loadingText="Reactivating..."
            disabled={reason.trim().length < 5}
          >
            Reactivate User
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
