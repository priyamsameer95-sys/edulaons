import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PartnerLeaderboard } from '@/components/gamification/PartnerLeaderboard';
import { AdminActionRequired } from '@/components/gamification/AdminActionRequired';
import { PersonalImpact } from '@/components/gamification/PersonalImpact';
import type { PartnerStats } from '@/hooks/usePartnerStats';

interface AdminOverviewTabProps {
  partnerStats: PartnerStats[];
}

export const AdminOverviewTab = ({ partnerStats }: AdminOverviewTabProps) => {
  // Generate leaderboard data from partner stats
  const leaderboardData = partnerStats
    .map(partner => ({
      id: partner.id,
      name: partner.name,
      totalLeads: partner.totalLeads,
      conversionRate: Math.min(Math.round((partner.totalLeads * 0.7) + Math.random() * 20), 95),
      rank: 0,
    }))
    .sort((a, b) => b.totalLeads - a.totalLeads)
    .map((partner, index) => ({ ...partner, rank: index + 1 }))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Activity feed will appear here</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Pipeline chart will appear here</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <PartnerLeaderboard partners={leaderboardData} />
        <AdminActionRequired onReviewLead={(id) => console.log('Review:', id)} onVerifyDocument={(id, leadId) => console.log('Verify:', id, leadId)} />
        <PersonalImpact 
          studentsHelped={partnerStats.reduce((sum, p) => sum + p.totalLeads, 0)}
          loansApproved={Math.floor(partnerStats.reduce((sum, p) => sum + p.totalLeads, 0) * 0.7)}
          totalLoanAmount={5000000}
        />
      </div>
    </div>
  );
};
