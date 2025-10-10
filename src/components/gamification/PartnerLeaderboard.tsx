import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Partner {
  id: string;
  name: string;
  totalLeads: number;
  conversionRate: number;
  rank: number;
}

interface PartnerLeaderboardProps {
  partners: Partner[];
}

export const PartnerLeaderboard = ({ partners }: PartnerLeaderboardProps) => {
  const topPartner = partners[0];
  const maxLeads = Math.max(...partners.map(p => p.totalLeads));

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getMedalClass = (rank: number) => {
    if (rank === 1) return 'bg-warning/20 border-warning border-2';
    if (rank === 2) return 'bg-muted/50 border-muted-foreground/30 border-2';
    if (rank === 3) return 'bg-destructive/10 border-destructive/30 border-2';
    return 'bg-muted/30 border-border border';
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <Trophy className="h-6 w-6 text-warning" />
          Partner Leaderboard
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Top Performer Spotlight */}
        {topPartner && (
          <div className="relative p-5 rounded-lg bg-warning/15 border-3 border-warning/40 overflow-hidden">
            <div className="relative flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 rounded-full bg-warning/30 border-2 border-warning flex items-center justify-center">
                  <Trophy className="h-7 w-7 text-warning" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xl">{topPartner.name}</h4>
                  <Badge className="bg-warning text-warning-foreground border-0 font-bold">
                    👑 #1
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="font-bold text-base">{topPartner.totalLeads} leads</span>
                  <span>•</span>
                  <span className="font-semibold">{topPartner.conversionRate}% conversion</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Rankings */}
        <div className="space-y-2">
          {partners.map((partner) => {
            const percentage = (partner.totalLeads / maxLeads) * 100;
            
            return (
              <div
                key={partner.id}
                className={`p-4 rounded-lg transition-all hover:shadow-md ${getMedalClass(partner.rank)}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 flex items-center justify-center">
                    {getMedalIcon(partner.rank)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-base">{partner.name}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{partner.totalLeads}</span>
                        {partner.rank <= 3 && (
                          <TrendingUp className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground mt-1">
                      {partner.conversionRate}% conversion
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
