import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { StatusSelect } from './StatusSelect';
import { useStatusUpdate } from '@/hooks/useStatusUpdate';
import type { LeadStatus } from '@/utils/statusUtils';

interface BulkStatusUpdateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadIds: string[];
  onStatusUpdated?: () => void;
}

export function BulkStatusUpdate({
  open,
  onOpenChange,
  leadIds,
  onStatusUpdated
}: BulkStatusUpdateProps) {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('new');
  const [reason, setReason] = useState('');
  
  const { bulkUpdateStatus, loading } = useStatusUpdate();

  const handleSubmit = async () => {
    const success = await bulkUpdateStatus(
      leadIds, 
      selectedStatus, 
      reason.trim() || undefined
    );

    if (success) {
      onOpenChange(false);
      onStatusUpdated?.();
      // Reset form
      setSelectedStatus('new');
      setReason('');
    }
  };

  const handleCancel = () => {
    setSelectedStatus('new');
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Bulk Update Status ({leadIds.length} lead{leadIds.length !== 1 ? 's' : ''})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-status">New Status</Label>
            <StatusSelect
              value={selectedStatus}
              onChange={(value) => setSelectedStatus(value as LeadStatus)}
              type="lead"
              placeholder="Select new status..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-reason">Reason for Change</Label>
            <Input
              id="bulk-reason"
              placeholder="Enter reason for bulk status change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            This will update {leadIds.length} lead{leadIds.length !== 1 ? 's' : ''} to "{selectedStatus}" status.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Updating...' : `Update ${leadIds.length} Lead${leadIds.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}