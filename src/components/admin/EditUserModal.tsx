import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCog, Shield } from 'lucide-react';
import { useUserManagement, AppUser } from '@/hooks/useUserManagement';

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
  currentUserRole: 'admin' | 'super_admin';
  protectedEmail: string;
}

const EditUserModal = ({ open, onOpenChange, user, currentUserRole, protectedEmail }: EditUserModalProps) => {
  const { updateUser, fetchPartners, partners, loading } = useUserManagement();
  const [role, setRole] = useState<'partner' | 'admin' | 'super_admin' | 'student' | 'kam'>('partner');
  const [partnerId, setPartnerId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  const isProtected = user?.email === protectedEmail;

  useEffect(() => {
    if (open && user) {
      setRole(user.role);
      setPartnerId(user.partner_id || '');
      setIsActive(user.is_active);
      fetchPartners();
    }
  }, [open, user, fetchPartners]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updates: any = {
      role,
      is_active: isActive,
    };

    if (role === 'partner') {
      updates.partner_id = partnerId || null;
    } else {
      updates.partner_id = null;
    }

    const result = await updateUser(user.id, updates);
    if (result.success) {
      onOpenChange(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Modify user role, partner assignment, and status
          </DialogDescription>
        </DialogHeader>

        {isProtected && (
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              This is the protected super admin account and cannot be modified
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Email</Label>
              <div className="text-sm font-medium">{user.email}</div>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select 
                value={role} 
                onValueChange={(v) => setRole(v as any)}
                disabled={isProtected || currentUserRole !== 'super_admin'}
              >
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
            </div>

            {role === 'partner' && (
              <div>
                <Label htmlFor="partner">Partner Assignment</Label>
                <Select 
                  value={partnerId} 
                  onValueChange={setPartnerId}
                  disabled={isProtected}
                >
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Account Status</Label>
                <div className="text-xs text-muted-foreground">
                  {isActive ? 'Account is active' : 'Account is deactivated'}
                </div>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isProtected}
              />
            </div>
          </div>

          {role === 'admin' && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Admins have full access to manage all partners and students
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isProtected}>
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
