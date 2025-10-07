import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search, MoreVertical, Edit, Eye, Shield, Building2, Users, XCircle, CheckCircle } from 'lucide-react';
import { useUserManagement, AppUser } from '@/hooks/useUserManagement';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import UserDetailsSheet from './UserDetailsSheet';
import { DeactivateUserDialog } from './DeactivateUserDialog';
import { ReactivateUserDialog } from './ReactivateUserDialog';
import { formatDistanceToNow } from 'date-fns';

interface UserManagementTabProps {
  currentUserRole: 'admin' | 'super_admin';
  currentUserId: string;
}

const PROTECTED_EMAIL = 'priyam.sameer@cashkaro.com';

const UserManagementTab = ({ currentUserRole, currentUserId }: UserManagementTabProps) => {
  const { users, partners, loading, fetchUsers, fetchPartners, deactivateUser, reactivateUser } = useUserManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [deactivateDialog, setDeactivateDialog] = useState<{ open: boolean; user: AppUser | null }>({ open: false, user: null });
  const [reactivateDialog, setReactivateDialog] = useState<{ open: boolean; user: AppUser | null }>({ open: false, user: null });

  useEffect(() => {
    fetchUsers();
    fetchPartners();
  }, [fetchUsers, fetchPartners]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.is_active : !user.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const getPartnerName = (partnerId: string | null) => {
    if (!partnerId) return 'All Partners';
    const partner = partners.find((p) => p.id === partnerId);
    return partner ? partner.name : 'Unknown';
  };

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

  const handleEdit = (user: AppUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleViewDetails = (user: AppUser) => {
    setSelectedUser(user);
    setShowDetailsSheet(true);
  };

  const handleDeactivateClick = (user: AppUser) => {
    setDeactivateDialog({ open: true, user });
  };

  const handleDeactivateConfirm = async (reason: string) => {
    if (deactivateDialog.user) {
      await deactivateUser(deactivateDialog.user.id, reason);
      setDeactivateDialog({ open: false, user: null });
    }
  };

  const handleReactivateClick = (user: AppUser) => {
    setReactivateDialog({ open: true, user });
  };

  const handleReactivateConfirm = async (reason: string) => {
    if (reactivateDialog.user) {
      await reactivateUser(reactivateDialog.user.id, reason);
      setReactivateDialog({ open: false, user: null });
    }
  };

  const canDeactivate = (user: AppUser) => {
    return (
      currentUserRole === 'super_admin' &&
      user.id !== currentUserId &&
      user.email !== PROTECTED_EMAIL &&
      user.is_active
    );
  };

  const canReactivate = (user: AppUser) => {
    return currentUserRole === 'super_admin' && !user.is_active;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>User Management</CardTitle>
              </div>
              <Button onClick={() => setShowCreateModal(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      const isProtected = user.email === PROTECTED_EMAIL;
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.email}
                            {isProtected && <Shield className="inline h-3 w-3 ml-1 text-destructive" />}
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {getPartnerName(user.partner_id)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? 'default' : 'outline'}>
                              {user.is_active ? '🟢 Active' : '🔴 Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {!isProtected && (
                                  <DropdownMenuItem onClick={() => handleEdit(user)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                )}
                                {canReactivate(user) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleReactivateClick(user)}
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Reactivate User
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {canDeactivate(user) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeactivateClick(user)}
                                      className="text-destructive"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Deactivate User
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Modals */}
      <CreateUserModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        currentUserRole={currentUserRole}
      />
      <EditUserModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        user={selectedUser}
        currentUserRole={currentUserRole}
        protectedEmail={PROTECTED_EMAIL}
      />
      <UserDetailsSheet
        open={showDetailsSheet}
        onOpenChange={setShowDetailsSheet}
        user={selectedUser}
      />

      {/* Deactivate/Reactivate Dialogs */}
      <DeactivateUserDialog
        open={deactivateDialog.open}
        onOpenChange={(open) => setDeactivateDialog({ open, user: null })}
        onConfirm={handleDeactivateConfirm}
        userEmail={deactivateDialog.user?.email || ''}
        loading={loading}
      />
      <ReactivateUserDialog
        open={reactivateDialog.open}
        onOpenChange={(open) => setReactivateDialog({ open, user: null })}
        onConfirm={handleReactivateConfirm}
        userEmail={reactivateDialog.user?.email || ''}
        loading={loading}
      />
    </>
  );
};

export default UserManagementTab;
