import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, ExternalLink } from 'lucide-react';
import { PartnerStats } from '@/utils/adminDashboardHelpers';
import { useNavigate } from 'react-router-dom';

interface AdminPartnersTableProps {
  partnerStats: PartnerStats[];
}

/**
 * Admin Partners Table Component
 * Displays partner list with their statistics and quick actions
 */
export const AdminPartnersTable = ({ partnerStats }: AdminPartnersTableProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Partner Management
          </CardTitle>
          <CardDescription>Manage and monitor partner performance</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {partnerStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No partners found</p>
            </div>
          ) : (
            partnerStats.map((partner) => (
              <div 
                key={partner.id} 
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200 gap-3"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{partner.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Code: <Badge variant="secondary" className="text-xs">{partner.partner_code}</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last Activity: {partner.recentActivity}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Total Leads</p>
                      <p className="font-bold text-lg">{partner.totalLeads}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Active Lenders</p>
                      <p className="font-bold text-lg text-success">{partner.activeLenders}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate(`/partner/${partner.partner_code}`)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Dashboard
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
