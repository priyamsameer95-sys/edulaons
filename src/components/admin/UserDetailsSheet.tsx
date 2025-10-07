import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppUser } from '@/hooks/useUserManagement';
import { supabase } from '@/integrations/supabase/client';
import { User, Shield, Building2, Calendar, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
}

const UserDetailsSheet = ({ open, onOpenChange, user }: UserDetailsSheetProps) => {
  const [partnerName, setPartnerName] = useState<string>('');
  const [leadsCount, setLeadsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchUserDetails();
    }
  }, [open, user]);

  const fetchUserDetails = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch partner name if user has partner_id
      if (user.partner_id) {
        const { data: partner } = await supabase
          .from('partners')
          .select('name')
          .eq('id', user.partner_id)
          .single();
        
        if (partner) {
          setPartnerName(partner.name);
        }

        // Fetch leads count for partner
        const { count } = await supabase
          .from('leads_new')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', user.partner_id);
        
        setLeadsCount(count || 0);
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        // For admins, show total system leads
        const { count } = await supabase
          .from('leads_new')
          .select('*', { count: 'exact', head: true });
        
        setLeadsCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="destructive" className="gap-1"><Shield className="h-3 w-3" />Super Admin</Badge>;
      case 'admin':
        return <Badge variant="default" className="gap-1"><Shield className="h-3 w-3" />Admin</Badge>;
      case 'partner':
        return <Badge variant="secondary" className="gap-1"><Building2 className="h-3 w-3" />Partner</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </SheetTitle>
          <SheetDescription>
            Complete information about this user account
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Account Information</h3>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="text-sm font-medium">{user.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Role</div>
                <div className="mt-1">{getRoleBadge(user.role)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="mt-1">
                  <Badge variant={user.is_active ? 'default' : 'outline'}>
                    {user.is_active ? '🟢 Active' : '🔴 Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Partner Assignment */}
          {user.partner_id && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Partner Assignment
                </h3>
                <div>
                  <div className="text-xs text-muted-foreground">Assigned To</div>
                  <div className="text-sm font-medium">{partnerName || 'Loading...'}</div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Activity Stats */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </h3>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">Total Leads</div>
                <div className="text-2xl font-bold">{loading ? '...' : leadsCount}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timestamps
            </h3>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">Created</div>
                <div className="text-sm">
                  {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Last Updated</div>
                <div className="text-sm">
                  {formatDistanceToNow(new Date(user.updated_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserDetailsSheet;
