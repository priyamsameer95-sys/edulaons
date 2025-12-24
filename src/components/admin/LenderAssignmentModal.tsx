/**
 * Lender Assignment Modal
 * 
 * Per Knowledge Base:
 * - AI suggests lender(s) + rationale + confidence score
 * - Admin can accept / override / defer
 * - Store final choice with assignment_mode
 */
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LenderSelector } from "./LenderSelector";
import { AILenderRecommendation } from "./AILenderRecommendation";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Loader2, Bot, Settings } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");
  
  const { toast } = useToast();
  const { logLenderAssignment } = useAuditLog();

  // Handle AI recommendation acceptance
  const handleAIAccept = async (lenderId: string, mode: 'ai' | 'ai_override') => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("update-lead-lender", {
        body: {
          leadId,
          newLenderId: lenderId,
          oldLenderId: currentLenderId,
          changeReason: `AI ${mode === 'ai' ? 'recommendation' : 'alternative'} accepted`,
          assignmentNotes: notes,
          assignmentMode: mode,
        },
      });

      if (error) throw error;

      // Log with audit trail
      await logLenderAssignment({
        leadId,
        oldLenderId: currentLenderId,
        newLenderId: lenderId,
        assignmentMode: mode,
        reason: `AI ${mode === 'ai' ? 'recommendation' : 'alternative'} accepted`,
      });

      toast({
        title: "Lender assigned",
        description: "AI recommendation has been applied.",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error accepting AI recommendation:", error);
      toast({
        title: "Error",
        description: "Failed to assign lender. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle manual submission
  const handleManualSubmit = async () => {
    if (selectedLenderId === currentLenderId) {
      toast({
        title: "No changes",
        description: "Please select a different lender",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for manual assignment",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("update-lead-lender", {
        body: {
          leadId,
          newLenderId: selectedLenderId,
          oldLenderId: currentLenderId,
          changeReason: reason,
          assignmentNotes: notes,
          assignmentMode: 'manual',
        },
      });

      if (error) throw error;

      // Log with audit trail - KB: assignment_mode = manual
      await logLenderAssignment({
        leadId,
        oldLenderId: currentLenderId,
        newLenderId: selectedLenderId,
        assignmentMode: 'manual',
        reason: reason.trim(),
      });

      toast({
        title: "Lender updated",
        description: "Manual assignment completed successfully.",
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Lender</DialogTitle>
          <DialogDescription>
            Choose AI recommendation or manually assign a lender. All changes are logged.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ai" | "manual")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Recommendation
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manual Selection
            </TabsTrigger>
          </TabsList>

          {/* AI Tab */}
          <TabsContent value="ai" className="space-y-4 pt-4">
            <AILenderRecommendation
              leadId={leadId}
              currentLenderId={currentLenderId}
              studyDestination={studyDestination}
              loanAmount={loanAmount}
              onAccept={handleAIAccept}
              onDefer={() => setActiveTab("manual")}
            />
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual" className="space-y-4 pt-4">
            <LenderSelector
              value={selectedLenderId}
              onChange={setSelectedLenderId}
              studyDestination={studyDestination}
              loanAmount={loanAmount}
            />

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Manual Assignment *</Label>
              <Textarea
                id="reason"
                placeholder="Why are you manually selecting this lender?"
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
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleManualSubmit} 
                disabled={loading || !reason.trim()}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Manually
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
