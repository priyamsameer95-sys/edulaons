import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserPlus, Search, MoreVertical, Edit, Eye, Shield, Building2, Users, XCircle, CheckCircle, Download, ChevronDown, CalendarIcon } from 'lucide-react';
import { useUserManagement, AppUser } from '@/hooks/useUserManagement';
import { useProtectedAccounts } from '@/hooks/useProtectedAccounts';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import UserDetailsSheet from './UserDetailsSheet';
import { DeactivateUserDialog } from './DeactivateUserDialog';
import { ReactivateUserDialog } from './ReactivateUserDialog';
import { formatDistanceToNow, format } from 'date-fns';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatters';

interface UserManagementTabProps {
  currentUserRole: 'admin' | 'super_admin';
  currentUserId: string;
}

const UserManagementTab = ({ currentUserRole, currentUserId }: UserManagementTabProps) => {
  const { users, partners, loading, fetchUsers, fetchPartners, deactivateUser, reactivateUser } = useUserManagement();
  const { isProtectedEmail } = useProtectedAccounts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<'email' | 'user_id' | 'partner_name'>('email');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [deactivateDialog, setDeactivateDialog] = useState<{ open: boolean; user: AppUser | null }>({ open: false, user: null });
  const [reactivateDialog, setReactivateDialog] = useState<{ open: boolean; user: AppUser | null }>({ open: false, user: null });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPartners();
  }, [fetchUsers, fetchPartners]);

  const getPartnerName = (partnerId: string | null) => {
    if (!partnerId) return 'All Partners';
    const partner = partners.find((p) => p.id === partnerId);
    return partner ? partner.name : 'Unknown';
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter based on mode
      let matchesSearch = true;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        switch (searchMode) {
          case 'email':
            matchesSearch = user.email.toLowerCase().includes(searchLower);
            break;
          case 'user_id':
            matchesSearch = user.id.toLowerCase().includes(searchLower);
            break;
          case 'partner_name':
            const partnerName = getPartnerName(user.partner_id).toLowerCase();
            matchesSearch = partnerName.includes(searchLower);
            break;
        }
      }

      // Role and status filters
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.is_active : !user.is_active);

      // Date range filter
      let matchesDateRange = true;
      if (dateFrom || dateTo) {
        const userDate = new Date(user.created_at);
        if (dateFrom) {
          matchesDateRange = matchesDateRange && userDate >= dateFrom;
        }
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && userDate <= endOfDay;
        }
      }

      return matchesSearch && matchesRole && matchesStatus && matchesDateRange;
    });
  }, [users, searchTerm, searchMode, roleFilter, statusFilter, dateFrom, dateTo]);

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
      !isProtectedEmail(user.email) &&
      user.is_active
    );
  };

  const canReactivate = (user: AppUser) => {
    return currentUserRole === 'super_admin' && !user.is_active;
  };

  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      
      // Prepare data for export
      const exportData = filteredUsers.map((user) => ({
        'Email': user.email,
        'Role': user.role,
        'Partner': getPartnerName(user.partner_id),
        'Status': user.is_active ? 'Active' : 'Inactive',
        'Created Date': formatDate(user.created_at, 'long'),
        'User ID': user.id,
        'Deactivation Reason': user.deactivation_reason || '',
        'Deactivated At': user.deactivated_at ? formatDate(user.deactivated_at, 'long') : ''
      }));

      // Generate CSV
      const csv = Papa.unparse(exportData);
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: `Exported ${filteredUsers.length} users to CSV`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
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
              <div className="flex gap-2">
                <Button 
                  onClick={exportToCSV} 
                  size="sm" 
                  variant="outline"
                  disabled={isExporting || filteredUsers.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
                <Button onClick={() => setShowCreateModal(true)} size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Basic Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <Select value={searchMode} onValueChange={(value: any) => setSearchMode(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">By Email</SelectItem>
                    <SelectItem value="user_id">By User ID</SelectItem>
                    <SelectItem value="partner_name">By Partner</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={
                      searchMode === 'email' ? 'Search by email...' :
                      searchMode === 'user_id' ? 'Search by user ID...' :
                      'Search by partner name...'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
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

            {/* Advanced Filters - Collapsible */}
            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters} className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="text-sm font-medium">Advanced Filters</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvancedFilters && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Created From</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Created To</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {(dateFrom || dateTo) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setDateFrom(undefined);
                      setDateTo(undefined);
                    }}
                    className="w-full"
                  >
                    Clear Date Filters
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">User ID</TableHead>
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
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      const isProtected = isProtectedEmail(user.email);
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-1">
                              <span className="truncate max-w-[80px]" title={user.id}>
                                {user.id.slice(0, 8)}...
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(user.id);
                                  toast({ title: 'Copied', description: 'User ID copied to clipboard' });
                                }}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
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
