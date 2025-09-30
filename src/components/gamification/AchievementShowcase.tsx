import { Trophy, Lock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementShowcaseProps {
  achievements: Achievement[];
}

const rarityColors = {
  common: 'text-muted-foreground border-muted-foreground/20',
  rare: 'text-blue-500 border-blue-500/20',
  epic: 'text-purple-500 border-purple-500/20',
  legendary: 'text-yellow-500 border-yellow-500/20',
};

const rarityBgColors = {
  common: 'bg-muted/30',
  rare: 'bg-blue-500/10',
  epic: 'bg-purple-500/10',
  legendary: 'bg-yellow-500/10',
};

export const AchievementShowcase = ({ achievements }: AchievementShowcaseProps) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
          <Badge variant="secondary">
            {unlockedCount}/{achievements.length} Unlocked
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <TooltipProvider>
            {achievements.map((achievement) => (
              <Tooltip key={achievement.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`relative aspect-square rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                      achievement.unlocked
                        ? `${rarityBgColors[achievement.rarity]} ${rarityColors[achievement.rarity]} hover:scale-105`
                        : 'bg-muted/20 border-muted-foreground/10 grayscale opacity-40 hover:opacity-60'
                    }`}
                  >
                    {achievement.unlocked ? (
                      <>
                        <span className="text-3xl">{achievement.icon}</span>
                        {achievement.rarity === 'legendary' && (
                          <Sparkles className="absolute top-1 right-1 h-3 w-3 text-yellow-500 animate-pulse" />
                        )}
                      </>
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span>{achievement.icon}</span>
                      {achievement.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {achievement.description}
                    </p>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                    {!achievement.unlocked && (
                      <p className="text-xs text-muted-foreground italic">
                        Keep going to unlock this achievement!
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};
