import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { StatusSelect } from './StatusSelect';
import { useStatusUpdate } from '@/hooks/useStatusUpdate';
import { useAuth } from '@/hooks/useAuth';
import type { LeadStatus, DocumentStatus } from '@/utils/statusUtils';

interface StatusUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  currentStatus: LeadStatus;
  currentDocumentsStatus: DocumentStatus;
  onStatusUpdated?: () => void;
}

export function StatusUpdateModal({
  open,
  onOpenChange,
  leadId,
  currentStatus,
  currentDocumentsStatus,
  onStatusUpdated
}: StatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>(currentStatus);
  const [selectedDocumentsStatus, setSelectedDocumentsStatus] = useState<DocumentStatus>(currentDocumentsStatus);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  
  const { updateStatus, loading } = useStatusUpdate();
  const { appUser } = useAuth();
  
  const isAdmin = appUser?.role === 'admin' || appUser?.role === 'super_admin';
  const notesMinLength = isAdmin ? 10 : 0;
  const notesMaxLength = isAdmin ? 150 : 1000;

  const handleSubmit = async () => {
    const statusChanged = selectedStatus !== currentStatus;
    const documentsStatusChanged = selectedDocumentsStatus !== currentDocumentsStatus;
    
    if (!statusChanged && !documentsStatusChanged) {
      onOpenChange(false);
      return;
    }

    // Validate admin notes requirement
    if (isAdmin && (notes.trim().length < notesMinLength || notes.trim().length > notesMaxLength)) {
      return; // Form validation will show error
    }

    const success = await updateStatus({
      leadId,
      status: statusChanged ? selectedStatus : undefined,
      documentsStatus: documentsStatusChanged ? selectedDocumentsStatus : undefined,
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (success) {
      onOpenChange(false);
      onStatusUpdated?.();
      // Reset form
      setReason('');
      setNotes('');
    }
  };

  const handleCancel = () => {
    setSelectedStatus(currentStatus);
    setSelectedDocumentsStatus(currentDocumentsStatus);
    setReason('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Lead Status</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-status">Lead Status</Label>
            <StatusSelect
              value={selectedStatus}
              onChange={(value) => setSelectedStatus(value as LeadStatus)}
              type="lead"
              currentStatus={currentStatus}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documents-status">Documents Status</Label>
            <StatusSelect
              value={selectedDocumentsStatus}
              onChange={(value) => setSelectedDocumentsStatus(value as DocumentStatus)}
              type="document"
              currentStatus={currentDocumentsStatus}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change</Label>
            <Input
              id="reason"
              placeholder="Enter reason for status change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Additional Notes {isAdmin && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="notes"
              placeholder={isAdmin 
                ? "Admin notes are required (10-150 characters)..." 
                : "Add any additional notes..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={isAdmin ? notesMaxLength : 1000}
              className={
                isAdmin && (notes.trim().length < notesMinLength || notes.trim().length > notesMaxLength)
                  ? 'border-destructive focus:border-destructive' 
                  : ''
              }
            />
            {isAdmin && (
              <p className={`text-xs ${
                notes.trim().length < notesMinLength || notes.trim().length > notesMaxLength 
                  ? 'text-destructive' 
                  : 'text-muted-foreground'
              }`}>
                {notes.trim().length}/{notesMinLength}-{notesMaxLength} characters required
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || (isAdmin && (notes.trim().length < notesMinLength || notes.trim().length > notesMaxLength))}
          >
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}