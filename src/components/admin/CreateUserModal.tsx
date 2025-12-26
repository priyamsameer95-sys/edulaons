import { LoadingButton } from '@/components/ui/loading-button';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react';
import { useUserManagement, Partner } from '@/hooks/useUserManagement';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserRole: 'admin' | 'super_admin';
}

const CreateUserModal = ({ open, onOpenChange, currentUserRole }: CreateUserModalProps) => {
  const { createUser, fetchPartners, partners, loading } = useUserManagement();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'partner' | 'admin' | 'super_admin'>('partner');
  const [partnerId, setPartnerId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    if (open) {
      fetchPartners();
    }
  }, [open, fetchPartners]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    if (role === 'partner' && !partnerId) {
      return;
    }

    const result = await createUser(
      email,
      role,
      role === 'partner' ? partnerId : null,
      password
    );

    if (result.success) {
      setCreatedUser({ email, password });
    }
  };

  const resetForm = () => {
    setEmail('');
    setRole('partner');
    setPartnerId('');
    setPassword('');
    setShowPassword(false);
    setCreatedUser(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (createdUser) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              User Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Save these credentials - they won't be shown again
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <UserPlus className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Email:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">{createdUser.email}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(createdUser.email)}
                      className="h-7 px-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Password:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">{createdUser.password}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(createdUser.password)}
                      className="h-7 px-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={resetForm}>
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to the system with login credentials
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partner">Partner</SelectItem>
                  {currentUserRole === 'super_admin' && (
                    <>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {currentUserRole !== 'super_admin' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Only Super Admins can create Admin users
                </p>
              )}
            </div>

            {role === 'partner' && (
              <div>
                <Label htmlFor="partner">Assign to Partner *</Label>
                <Select value={partnerId} onValueChange={setPartnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select partner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.partner_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Secure password"
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
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generate
                </Button>
              </div>
            </div>
          </div>

          {role === 'admin' && (
            <Alert>
              <UserPlus className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Admins can view and manage all partners and students system-wide
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <LoadingButton type="submit" loading={loading} loadingText="Creating...">
              Create User
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
