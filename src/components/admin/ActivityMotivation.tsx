import { useEffect, useState } from 'react';
import { Sparkles, Target, Trophy, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface ActivityMotivationProps {
  userId: string;
  recentCompletions?: number;
}

export const ActivityMotivation = ({ userId, recentCompletions = 0 }: ActivityMotivationProps) => {
  const [streak, setStreak] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const dailyGoal = 10;

  useEffect(() => {
    const fetchMotivationData = async () => {
      try {
        // Fetch user streak
        const { data: streakData } = await supabase
          .rpc('get_user_streak', { user_uuid: userId });
        
        if (streakData !== null) {
          setStreak(streakData);
        }

        // Fetch today's completions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: completions } = await supabase
          .from('activity_completions')
          .select('id')
          .eq('user_id', userId)
          .gte('completed_at', today.toISOString());

        if (completions) {
          setTodayCount(completions.length);
        }
      } catch (error) {
        console.error('Error fetching motivation data:', error);
      }
    };

    fetchMotivationData();
  }, [userId, recentCompletions]);

  const progressPercentage = Math.min((todayCount / dailyGoal) * 100, 100);
  const isOnFire = streak >= 3;

  const getMotivationalMessage = () => {
    if (recentCompletions > 0) {
      return `🎉 Amazing! You've completed ${recentCompletions} urgent ${recentCompletions === 1 ? 'item' : 'items'} today!`;
    }
    if (todayCount >= dailyGoal) {
      return '🏆 Goal crushed! You\'re on fire today!';
    }
    if (todayCount > 0) {
      return `💪 Keep going! ${dailyGoal - todayCount} more to hit your daily goal!`;
    }
    return '🚀 Ready to make an impact? Let\'s tackle some activities!';
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <p className="text-sm font-medium">{getMotivationalMessage()}</p>
        </div>
        {isOnFire && (
          <div className="flex items-center gap-1 px-3 py-1 bg-warning/20 rounded-full">
            <Flame className="h-4 w-4 text-warning animate-pulse" />
            <span className="text-xs font-semibold text-warning">{streak} day streak!</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Daily progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">{todayCount}/{dailyGoal}</span>
            {todayCount >= dailyGoal && <Trophy className="h-3.5 w-3.5 text-warning" />}
          </div>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
    </Card>
  );
};
