import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LenderSelector } from "./LenderSelector";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface LenderAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  currentLenderId: string;
  studyDestination?: string;
  loanAmount?: number;
  onSuccess?: () => void;
}

export function LenderAssignmentModal({
  open,
  onOpenChange,
  leadId,
  currentLenderId,
  studyDestination,
  loanAmount,
  onSuccess,
}: LenderAssignmentModalProps) {
  const [selectedLenderId, setSelectedLenderId] = useState(currentLenderId);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (selectedLenderId === currentLenderId) {
      toast({
        title: "No changes",
        description: "Please select a different lender",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "update-lead-lender",
        {
          body: {
            leadId,
            newLenderId: selectedLenderId,
            oldLenderId: currentLenderId,
            changeReason: reason,
            assignmentNotes: notes,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Lender updated",
        description: "The lender has been successfully assigned to this lead.",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating lender:", error);
      toast({
        title: "Error",
        description: "Failed to update lender. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Assign Lender</DialogTitle>
          <DialogDescription>
            Change the lender assigned to this lead. This action will be logged
            in the audit trail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <LenderSelector
            value={selectedLenderId}
            onChange={setSelectedLenderId}
            studyDestination={studyDestination}
            loanAmount={loanAmount}
          />

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for changing the lender..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Lender
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
