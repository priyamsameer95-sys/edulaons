import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building2, Link2, QrCode, Copy, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreatePartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartnerCreated: () => void;
}

interface PartnerForm {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  partnerCode: string;
}

const CreatePartnerModal = ({ open, onOpenChange, onPartnerCreated }: CreatePartnerModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PartnerForm>({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    partnerCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [createdPartner, setCreatedPartner] = useState<{ 
    code: string; 
    url: string; 
    email: string; 
    password: string; 
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const generatePartnerCode = () => {
    const code = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
    setFormData(prev => ({ ...prev, partnerCode: code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.partnerCode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including password",
        variant: "destructive",
      });
      return;
    }

    // Additional client-side validation
    if (formData.password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!/^[a-z0-9]+$/.test(formData.partnerCode)) {
      toast({
        title: "Invalid Partner Code",
        description: "Partner code must contain only lowercase letters and numbers",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Call the edge function to create partner with auth
      const { data, error } = await supabase.functions.invoke('create-partner-with-auth', {
        body: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          partnerCode: formData.partnerCode,
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create partner');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Generate shareable URL
      const partnerUrl = data.partner.dashboard_url;
      
      setCreatedPartner({
        code: formData.partnerCode,
        url: partnerUrl,
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      toast({
        title: "Partner Created Successfully",
        description: `${formData.name} has been created with login credentials`,
      });

      onPartnerCreated();
    } catch (error: any) {
      console.error('Error creating partner:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create partner with credentials",
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
        description: "Content copied to clipboard",
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
      password: '',
      phone: '',
      address: '',
      partnerCode: '',
    });
    setCreatedPartner(null);
    setCopied(false);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  if (createdPartner) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Partner Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Partner account created with login credentials
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Dashboard URL */}
            <div>
              <Label className="text-sm font-medium">Dashboard URL:</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input value={createdPartner.url} readOnly className="flex-1" />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => copyToClipboard(createdPartner.url)}
                  className="px-3"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Login Credentials */}
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Login Credentials:</p>
                  <div className="grid gap-2">
                    <div>
                      <Label className="text-xs">Email:</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{createdPartner.email}</code>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(createdPartner.email)}
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Password:</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                          {showPassword ? createdPartner.password : '••••••••••••'}
                        </code>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                          className="h-6 px-2"
                        >
                          {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(createdPartner.password)}
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Separator />

            <div className="text-center space-y-2">
              <Badge variant="outline" className="text-sm">
                Partner Code: {createdPartner.code}
              </Badge>
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
            <Button onClick={handleClose}>Done</Button>
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
            Add a new partner organization with login credentials and dashboard access
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
              <Label htmlFor="password">Login Password *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter secure password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                >
                  Generate
                </Button>
              </div>
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

          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              This will create a partner account with login credentials that can access their dedicated dashboard.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating Partner...' : 'Create Partner with Login'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePartnerModal;