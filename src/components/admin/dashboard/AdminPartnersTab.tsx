import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Eye, MoreHorizontal, Users, TrendingUp } from 'lucide-react';
import { TableSkeleton } from '@/components/common/LoadingStates';
import { usePartnerStats } from '@/hooks/usePartnerStats';
import { formatRelativeTime } from '@/utils/formatters';
import CreatePartnerModal from '@/components/admin/CreatePartnerModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminPartnersTabProps {
  onViewLeads?: (partnerId: string) => void;
}

export const AdminPartnersTab = ({ onViewLeads }: AdminPartnersTabProps) => {
  const { stats, loading, refetch } = usePartnerStats();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalPartners = stats.length;
  const totalLeadsViaPartners = stats.reduce((sum, p) => sum + p.totalLeads, 0);

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
                <TableHead className="text-center">Active Lenders</TableHead>
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
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{partner.partner_code}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{partner.totalLeads}</TableCell>
                    <TableCell className="text-center">{partner.activeLenders}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatRelativeTime(partner.recentActivity)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewLeads?.(partner.id)}>
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
    </div>
  );
};
