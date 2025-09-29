import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusSelect } from './StatusSelect';
import { useStatusManager } from '@/hooks/useStatusManager';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, CheckCircle } from 'lucide-react';
import type { LeadStatus, DocumentStatus } from '@/utils/statusUtils';

interface EnhancedStatusUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  currentStatus: LeadStatus;
  currentDocumentsStatus: DocumentStatus;
  onStatusUpdated?: () => void;
}

export function EnhancedStatusUpdateModal({
  open,
  onOpenChange,
  leadId,
  currentStatus,
  currentDocumentsStatus,
  onStatusUpdated
}: EnhancedStatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>(currentStatus);
  const [selectedDocumentsStatus, setSelectedDocumentsStatus] = useState<DocumentStatus>(currentDocumentsStatus);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { updateLeadStatus, loading } = useStatusManager();
  const { appUser } = useAuth();
  
  const isAdmin = appUser?.role === 'admin' || appUser?.role === 'super_admin';
  const NOTES_MIN_LENGTH = 10;
  const NOTES_MAX_LENGTH = 150;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedStatus(currentStatus);
      setSelectedDocumentsStatus(currentDocumentsStatus);
      setReason('');
      setNotes('');
      setValidationError(null);
    }
  }, [open, currentStatus, currentDocumentsStatus]);

  const validateForm = (): boolean => {
    setValidationError(null);

    // Check if any changes were made
    const statusChanged = selectedStatus !== currentStatus;
    const documentsStatusChanged = selectedDocumentsStatus !== currentDocumentsStatus;
    
    if (!statusChanged && !documentsStatusChanged) {
      setValidationError('Please make at least one status change before submitting.');
      return false;
    }

    // Validate admin notes requirement
    if (isAdmin) {
      const notesLength = notes.trim().length;
      if (notesLength < NOTES_MIN_LENGTH) {
        setValidationError(`Admin notes are required. Please provide at least ${NOTES_MIN_LENGTH} characters (current: ${notesLength}).`);
        return false;
      }
      if (notesLength > NOTES_MAX_LENGTH) {
        setValidationError(`Admin notes are too long. Maximum ${NOTES_MAX_LENGTH} characters allowed (current: ${notesLength}).`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const success = await updateLeadStatus({
      leadId,
      newStatus: selectedStatus !== currentStatus ? selectedStatus : undefined,
      newDocumentsStatus: selectedDocumentsStatus !== currentDocumentsStatus ? selectedDocumentsStatus : undefined,
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (success) {
      onOpenChange(false);
      onStatusUpdated?.();
    }
  };

  const handleCancel = () => {
    setSelectedStatus(currentStatus);
    setSelectedDocumentsStatus(currentDocumentsStatus);
    setReason('');
    setNotes('');
    setValidationError(null);
    onOpenChange(false);
  };

  const getStatusChangeMessage = () => {
    const statusChanged = selectedStatus !== currentStatus;
    const documentsStatusChanged = selectedDocumentsStatus !== currentDocumentsStatus;
    
    if (!statusChanged && !documentsStatusChanged) {
      return null;
    }

    const changes = [];
    if (statusChanged) {
      changes.push(`Lead Status: ${currentStatus} → ${selectedStatus}`);
    }
    if (documentsStatusChanged) {
      changes.push(`Documents Status: ${currentDocumentsStatus} → ${selectedDocumentsStatus}`);
    }

    return changes.join(' | ');
  };

  const notesLength = notes.trim().length;
  const isNotesValid = !isAdmin || (notesLength >= NOTES_MIN_LENGTH && notesLength <= NOTES_MAX_LENGTH);
  const hasChanges = selectedStatus !== currentStatus || selectedDocumentsStatus !== currentDocumentsStatus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Lead Status</DialogTitle>
          <DialogDescription>
            Make changes to the lead and document status. {isAdmin && 'Admin notes are required.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

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

          {hasChanges && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Changes:</strong> {getStatusChangeMessage()}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change</Label>
            <Input
              id="reason"
              placeholder="Enter reason for status change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {isAdmin ? 'Admin Notes *' : 'Additional Notes'}
            </Label>
            <Textarea
              id="notes"
              placeholder={isAdmin 
                ? `Admin notes required (${NOTES_MIN_LENGTH}-${NOTES_MAX_LENGTH} characters)...` 
                : "Add any additional notes..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={NOTES_MAX_LENGTH}
              className={!isNotesValid ? 'border-destructive focus:border-destructive' : ''}
            />
            <div className="flex justify-between text-xs">
              <span className={!isNotesValid ? 'text-destructive' : 'text-muted-foreground'}>
                {isAdmin && `Min: ${NOTES_MIN_LENGTH} | Max: ${NOTES_MAX_LENGTH} characters`}
              </span>
              <span className={!isNotesValid ? 'text-destructive' : 'text-muted-foreground'}>
                {notesLength}/{NOTES_MAX_LENGTH}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !hasChanges || !isNotesValid}
          >
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}