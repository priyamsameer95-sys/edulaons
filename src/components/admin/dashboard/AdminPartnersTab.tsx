import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TableSkeleton } from '@/components/common/LoadingStates';
import { usePartnerStats } from '@/hooks/usePartnerStats';
import { formatRelativeTime } from '@/utils/formatters';

export const AdminPartnersTab = () => {
  const { stats, loading } = usePartnerStats();
  
  if (loading) return <TableSkeleton rows={8} columns={5} />;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Partners</CardTitle>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Partner
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner Name</TableHead>
              <TableHead>Partner Code</TableHead>
              <TableHead>Total Leads</TableHead>
              <TableHead>Active Lenders</TableHead>
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map(partner => (
              <TableRow key={partner.id}>
                <TableCell className="font-medium">{partner.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{partner.partner_code}</Badge>
                </TableCell>
                <TableCell>{partner.totalLeads}</TableCell>
                <TableCell>{partner.activeLenders}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatRelativeTime(partner.recentActivity)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
