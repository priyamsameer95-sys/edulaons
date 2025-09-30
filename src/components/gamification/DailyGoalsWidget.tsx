import { Target, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Goal {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  xpReward: number;
  completed: boolean;
}

interface DailyGoalsWidgetProps {
  goals: Goal[];
  totalXP: number;
  earnedXP: number;
}

export const DailyGoalsWidget = ({ goals, totalXP, earnedXP }: DailyGoalsWidgetProps) => {
  const completedGoals = goals.filter(g => g.completed).length;
  const overallProgress = (earnedXP / totalXP) * 100;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Daily Goals
          </CardTitle>
          <Badge variant="secondary" className="gap-1.5">
            <TrendingUp className="h-3 w-3" />
            {earnedXP}/{totalXP} XP
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedGoals}/{goals.length} Goals Complete
            </span>
            <span className="font-semibold">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Individual Goals */}
        <div className="space-y-3">
          {goals.map((goal) => {
            const progress = (goal.current / goal.target) * 100;
            return (
              <div
                key={goal.id}
                className={`p-3 rounded-lg border transition-all ${
                  goal.completed
                    ? 'bg-success/5 border-success/20'
                    : 'bg-muted/30 border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {goal.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <h4 className={`font-medium text-sm ${
                        goal.completed ? 'text-success line-through' : ''
                      }`}>
                        {goal.title}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      {goal.description}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs whitespace-nowrap ${
                      goal.completed ? 'bg-success/10 border-success/20 text-success' : ''
                    }`}
                  >
                    +{goal.xpReward} XP
                  </Badge>
                </div>

                {/* Goal Progress */}
                {!goal.completed && (
                  <div className="space-y-1.5 ml-6">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {goal.current} / {goal.target}
                      </span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
