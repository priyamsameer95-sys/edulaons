import { Trophy, Flame, Award, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface GamificationHeroProps {
  userName: string;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  streak: number;
  unlockedBadges: number;
  totalBadges: number;
}

export const GamificationHero = ({
  userName,
  level,
  currentXP,
  xpToNextLevel,
  streak,
  unlockedBadges,
  totalBadges,
}: GamificationHeroProps) => {
  const progressPercentage = (currentXP / xpToNextLevel) * 100;
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 18) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  const getLevelTitle = () => {
    if (level >= 10) return 'Master Admin';
    if (level >= 7) return 'Champion';
    if (level >= 5) return 'Expert';
    if (level >= 3) return 'Professional';
    return 'Novice';
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background border-primary/20">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative p-6 space-y-4">
        {/* Greeting and Level */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold">
              {getGreeting()}, {userName}!
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 bg-primary/10 text-primary hover:bg-primary/20">
                <Trophy className="h-3.5 w-3.5" />
                Level {level} {getLevelTitle()}
              </Badge>
            </div>
          </div>

          {/* Streak Counter */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/20">
              <Flame className="h-5 w-5 text-warning animate-pulse" />
              <div className="text-left">
                <p className="text-2xl font-bold text-warning">{streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20">
              <Award className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="text-2xl font-bold text-primary">{unlockedBadges}/{totalBadges}</p>
                <p className="text-xs text-muted-foreground">Badges</p>
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to Level {level + 1}</span>
            <span className="font-semibold text-foreground">
              {currentXP} / {xpToNextLevel} XP
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {xpToNextLevel - currentXP} XP needed to level up
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span>Keep going! Complete daily goals to earn bonus XP</span>
        </div>
      </div>
    </Card>
  );
};
