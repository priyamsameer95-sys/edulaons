import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building2, Link2, QrCode, Copy, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CreatePartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartnerCreated: () => void;
}

interface PartnerForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  partnerCode: string;
}

const CreatePartnerModal = ({ open, onOpenChange, onPartnerCreated }: CreatePartnerModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PartnerForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    partnerCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [createdPartner, setCreatedPartner] = useState<{ code: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const generatePartnerCode = () => {
    const code = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
    setFormData(prev => ({ ...prev, partnerCode: code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.partnerCode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if partner code already exists
      const { data: existingPartner } = await supabase
        .from('partners')
        .select('id')
        .eq('partner_code', formData.partnerCode)
        .single();

      if (existingPartner) {
        toast({
          title: "Partner Code Exists",
          description: "Please choose a different partner code",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create partner
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          partner_code: formData.partnerCode,
          is_active: true,
        })
        .select()
        .single();

      if (partnerError) throw partnerError;

      // Generate shareable URL
      const partnerUrl = `${window.location.origin}/partner/${formData.partnerCode}`;
      
      setCreatedPartner({
        code: formData.partnerCode,
        url: partnerUrl
      });

      toast({
        title: "Partner Created Successfully",
        description: `${formData.name} has been added with code: ${formData.partnerCode}`,
      });

      onPartnerCreated();
    } catch (error: any) {
      console.error('Error creating partner:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create partner",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      partnerCode: '',
    });
    setCreatedPartner(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  if (createdPartner) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Partner Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Share this link with the partner to access their dashboard
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="partner-url" className="text-sm font-medium">
                Dashboard URL:
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                id="partner-url"
                value={createdPartner.url}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => copyToClipboard(createdPartner.url)}
                className="px-3"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <Separator />

            <div className="text-center space-y-2">
              <Badge variant="outline" className="text-sm">
                Partner Code: {createdPartner.code}
              </Badge>
              <p className="text-xs text-muted-foreground">
                The partner can use this code to access their dedicated dashboard
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setCreatedPartner(null);
              }}
            >
              Create Another
            </Button>
            <Button onClick={handleClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Partner
          </DialogTitle>
          <DialogDescription>
            Add a new partner organization with their own dashboard access
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., CashKaro Education"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Contact Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="partner@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="partnerCode">Partner Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="partnerCode"
                  value={formData.partnerCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, partnerCode: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                  placeholder="e.g., cashkaro"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePartnerCode}
                  disabled={!formData.name}
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This will be used in the dashboard URL: /partner/{formData.partnerCode || 'code'}
              </p>
            </div>

            <div className="col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Business address"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Partner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePartnerModal;