import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { LoadingButton } from '@/components/ui/loading-button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2 } from 'lucide-react';
import { Partner } from '@/types/partner';

interface EditPartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: (Partner & { partner_code: string }) | null;
  onPartnerUpdated: () => void;
}

export const EditPartnerModal = ({
  open,
  onOpenChange,
  partner,
  onPartnerUpdated,
}: EditPartnerModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    is_active: true,
  });

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        email: partner.email,
        phone: partner.phone || '',
        address: partner.address || '',
        is_active: partner.is_active,
      });
    }
  }, [partner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;

    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Name and email are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', partner.id);

      if (error) throw error;

      toast({
        title: 'Partner Updated',
        description: `${formData.name} has been updated successfully`,
      });

      onPartnerUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating partner:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update partner',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!partner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Edit Partner
          </DialogTitle>
          <DialogDescription>
            Update partner information. Partner code cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Partner name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Contact Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="partner@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Business address"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="is_active" className="font-medium">Active Status</Label>
              <p className="text-sm text-muted-foreground">
                {formData.is_active ? 'Partner can access dashboard' : 'Partner access is disabled'}
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Partner Code: <code className="bg-muted px-1.5 py-0.5 rounded">{partner.partner_code}</code>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <LoadingButton type="submit" loading={loading} loadingText="Saving...">
              Save Changes
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
