import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { PartnerCombobox } from "@/components/ui/partner-combobox";

interface Partner {
  id: string;
  name: string;
  partner_code: string;
}

interface PartnerAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  currentPartnerId: string | null;
  onSuccess?: () => void;
}

export function PartnerAssignmentModal({
  open,
  onOpenChange,
  leadId,
  currentPartnerId,
  onSuccess,
}: PartnerAssignmentModalProps) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(currentPartnerId || "");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchPartners();
      setSelectedPartnerId(currentPartnerId || "");
      setReason("");
    }
  }, [open, currentPartnerId]);

  const fetchPartners = async () => {
    setLoadingPartners(true);
    try {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name, partner_code")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoadingPartners(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedPartnerId === currentPartnerId) {
      toast({
        title: "No changes",
        description: "Please select a different partner",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update lead partner directly
      const { error } = await supabase
        .from("leads_new")
        .update({ 
          partner_id: selectedPartnerId || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", leadId);

      if (error) throw error;

      // Log the change in status history
      const selectedPartner = partners.find(p => p.id === selectedPartnerId);
      const previousPartner = currentPartnerId ? partners.find(p => p.id === currentPartnerId) : null;
      
      await supabase.from("application_activities").insert({
        lead_id: leadId,
        activity_type: "partner_reassignment",
        description: `Partner changed from ${previousPartner?.name || 'Direct'} to ${selectedPartner?.name || 'Direct'}`,
        metadata: {
          old_partner_id: currentPartnerId,
          new_partner_id: selectedPartnerId,
          reason: reason,
        },
      });

      toast({
        title: "Partner updated",
        description: `Lead has been reassigned to ${selectedPartner?.name || 'Direct'}.`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating partner:", error);
      toast({
        title: "Error",
        description: "Failed to update partner. Please try again.",
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
          <DialogTitle>Assign Partner</DialogTitle>
          <DialogDescription>
            Change the partner assigned to this lead. This action will be logged
            in the activity trail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Partner</Label>
            {loadingPartners ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading partners...
              </div>
            ) : (
              <PartnerCombobox
                partners={partners}
                value={selectedPartnerId}
                onChange={setSelectedPartnerId}
                placeholder="Select a partner..."
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for changing the partner..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
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
          <Button onClick={handleSubmit} disabled={loading || loadingPartners}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Partner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
