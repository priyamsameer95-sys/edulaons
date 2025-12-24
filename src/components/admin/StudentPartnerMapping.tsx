/**
 * Student Partner Mapping Component
 * 
 * Per Knowledge Base:
 * - Admin can map/re-map student to partner after lead creation
 * - Mapping must be auditable
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Link2, Users } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  partner_code: string;
  is_active: boolean;
}

interface StudentPartnerMappingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  leadId: string;
  currentPartnerId?: string | null;
  currentPartnerName?: string | null;
  onSuccess?: () => void;
}

export function StudentPartnerMapping({
  open,
  onOpenChange,
  studentId,
  studentName,
  leadId,
  currentPartnerId,
  currentPartnerName,
  onSuccess,
}: StudentPartnerMappingProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(currentPartnerId || '');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingPartners, setFetchingPartners] = useState(true);
  
  const { toast } = useToast();
  const { logMappingChange } = useAuditLog();

  // Fetch all active partners
  useEffect(() => {
    async function fetchPartners() {
      try {
        const { data, error } = await supabase
          .from('partners')
          .select('id, name, partner_code, is_active')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setPartners(data || []);
      } catch (err) {
        console.error('Error fetching partners:', err);
        toast({
          title: 'Error',
          description: 'Failed to load partners',
          variant: 'destructive',
        });
      } finally {
        setFetchingPartners(false);
      }
    }

    if (open) {
      fetchPartners();
      setSelectedPartnerId(currentPartnerId || '');
      setReason('');
    }
  }, [open, currentPartnerId, toast]);

  const handleSubmit = async () => {
    if (!selectedPartnerId) {
      toast({
        title: 'Error',
        description: 'Please select a partner',
        variant: 'destructive',
      });
      return;
    }

    if (selectedPartnerId === currentPartnerId) {
      toast({
        title: 'No changes',
        description: 'Please select a different partner',
        variant: 'destructive',
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for this mapping',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Create mapping record
      const { error: mappingError } = await supabase
        .from('student_partner_mappings')
        .upsert({
          student_id: studentId,
          partner_id: selectedPartnerId,
          lead_id: leadId,
          mapped_by: user?.id,
          mapping_reason: reason.trim(),
          mapped_at: new Date().toISOString(),
        }, {
          onConflict: 'student_id,partner_id',
        });

      if (mappingError) throw mappingError;

      // Update the lead's partner_id
      const { error: leadError } = await supabase
        .from('leads_new')
        .update({ partner_id: selectedPartnerId })
        .eq('id', leadId);

      if (leadError) throw leadError;

      // Log the change
      await logMappingChange(
        studentId,
        currentPartnerId || null,
        selectedPartnerId,
        leadId,
        reason.trim()
      );

      toast({
        title: 'Success',
        description: 'Student-partner mapping updated successfully',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating mapping:', err);
      toast({
        title: 'Error',
        description: 'Failed to update mapping. Please try again.',
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
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Assign Partner to Student
          </DialogTitle>
          <DialogDescription>
            Map student <strong>{studentName}</strong> to a partner. This change will be logged in the audit trail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Partner Display */}
          {currentPartnerName && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Current Partner</p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{currentPartnerName}</span>
              </div>
            </div>
          )}

          {/* Partner Selection */}
          <div className="space-y-2">
            <Label htmlFor="partner">Assign to Partner</Label>
            <Select
              value={selectedPartnerId}
              onValueChange={setSelectedPartnerId}
              disabled={fetchingPartners || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={fetchingPartners ? "Loading partners..." : "Select a partner"} />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name} ({partner.partner_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Mapping *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Student was referred by this partner, Correcting initial assignment..."
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              This reason will be recorded in the audit log
            </p>
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
          <Button onClick={handleSubmit} disabled={loading || !selectedPartnerId || !reason.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StudentPartnerMapping;
