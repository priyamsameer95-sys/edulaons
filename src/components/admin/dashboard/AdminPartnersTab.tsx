import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Eye, MoreHorizontal, Users, TrendingUp, Edit, Info } from 'lucide-react';
import { TableSkeleton } from '@/components/common/LoadingStates';
import { usePartnerStats } from '@/hooks/usePartnerStats';
import { formatRelativeTime } from '@/utils/formatters';
import CreatePartnerModal from '@/components/admin/CreatePartnerModal';
import { EditPartnerModal } from '@/components/admin/EditPartnerModal';
import { PartnerDetailsSheet } from '@/components/admin/PartnerDetailsSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Partner {
  id: string;
  name: string;
  partner_code: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  totalLeads: number;
  activeLenders: number;
  recentActivity: string | null;
}

interface AdminPartnersTabProps {
  onViewLeads?: (partnerId: string) => void;
}

export const AdminPartnersTab = ({ onViewLeads }: AdminPartnersTabProps) => {
  const { stats, loading, refetch } = usePartnerStats();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const totalPartners = stats.length;
  const totalLeadsViaPartners = stats.reduce((sum, p) => sum + p.totalLeads, 0);

  const handleViewDetails = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowDetailsSheet(true);
  };

  const handleEdit = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowEditModal(true);
  };

  const handleEditFromSheet = () => {
    setShowDetailsSheet(false);
    setShowEditModal(true);
  };

  const handleViewLeadsFromSheet = () => {
    if (selectedPartner && onViewLeads) {
      setShowDetailsSheet(false);
      onViewLeads(selectedPartner.id);
    }
  };

  if (loading) return <TableSkeleton rows={8} columns={5} />;

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalPartners}</p>
              <p className="text-sm text-muted-foreground">Total Partners</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalLeadsViaPartners}</p>
              <p className="text-sm text-muted-foreground">Leads via Partners</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg">Partners</CardTitle>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Partner
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Name</TableHead>
                <TableHead>Partner Code</TableHead>
                <TableHead className="text-center">Total Leads</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No partners found. Create your first partner to get started.
                  </TableCell>
                </TableRow>
              ) : (
                stats.map((partner) => (
                  <TableRow key={partner.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(partner as Partner)}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{partner.partner_code}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{partner.totalLeads}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={(partner as any).is_active !== false ? 'default' : 'secondary'}>
                        {(partner as any).is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatRelativeTime(partner.recentActivity)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(partner as Partner); }}>
                            <Info className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(partner as Partner); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Partner
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewLeads?.(partner.id); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Leads
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Partner Modal */}
      <CreatePartnerModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onPartnerCreated={() => {
          refetch();
          setShowCreateModal(false);
        }}
      />

      {/* Edit Partner Modal */}
      <EditPartnerModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        partner={selectedPartner}
        onPartnerUpdated={() => {
          refetch();
          setSelectedPartner(null);
        }}
      />

      {/* Partner Details Sheet */}
      <PartnerDetailsSheet
        open={showDetailsSheet}
        onOpenChange={setShowDetailsSheet}
        partner={selectedPartner}
        stats={selectedPartner ? {
          totalLeads: selectedPartner.totalLeads,
          activeLenders: selectedPartner.activeLenders,
          recentActivity: selectedPartner.recentActivity,
        } : undefined}
        onEdit={handleEditFromSheet}
        onViewLeads={handleViewLeadsFromSheet}
      />
    </div>
  );
};
