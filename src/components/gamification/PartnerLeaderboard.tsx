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
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/20';
    if (rank === 2) return 'bg-gray-400/10 border-gray-400/20';
    if (rank === 3) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-muted/30 border-border';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Partner Leaderboard
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Top Performer Spotlight */}
        {topPartner && (
          <div className="relative p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-background border-2 border-yellow-500/20 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />
            
            <div className="relative flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-lg">{topPartner.name}</h4>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                    👑 Top Performer
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{topPartner.totalLeads} leads</span>
                  <span>•</span>
                  <span>{topPartner.conversionRate}% conversion</span>
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
                className={`p-3 rounded-lg border transition-all hover:scale-[1.02] ${getMedalClass(partner.rank)}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0 w-8 flex items-center justify-center">
                    {getMedalIcon(partner.rank)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-sm">{partner.name}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{partner.totalLeads}</span>
                        {partner.rank <= 3 && (
                          <TrendingUp className="h-3 w-3 text-success" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {partner.conversionRate}% conversion rate
                    </p>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <Progress value={percentage} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
