import { TrendingUp, Clock, Zap, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SmartAction {
  title: string;
  description: string;
  count: number;
  impactAmount: number;
  estimatedTime: number; // in minutes
  priority: 'URGENT' | 'ATTENTION' | 'INFO';
  onClick: () => void;
}

interface SmartActionsPanelProps {
  actions: SmartAction[];
}

export const SmartActionsPanel = ({ actions }: SmartActionsPanelProps) => {
  if (actions.length === 0) return null;

  const totalImpact = actions.reduce((sum, action) => sum + action.impactAmount, 0);
  const totalTime = actions.reduce((sum, action) => sum + action.estimatedTime, 0);
  const urgentCount = actions.filter(a => a.priority === 'URGENT').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'ATTENTION':
        return 'bg-primary/20 text-primary border-primary/30';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-warning/5 border-primary/30 p-6 mb-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-warning" />
              Smart Actions - Quick Wins
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Top {actions.length} highest-impact actions for maximum efficiency
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="font-semibold">₹{(totalImpact / 100000).toFixed(1)}L</span>
              <span className="text-muted-foreground">at stake</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-semibold">{totalTime} min</span>
              <span className="text-muted-foreground">to complete all</span>
            </div>
          </div>
        </div>

        {/* Actions List */}
        <div className="grid gap-3">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-accent/5 transition-all group"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getPriorityColor(action.priority)}>
                    {action.priority}
                  </Badge>
                  <h4 className="font-semibold text-sm">{action.title}</h4>
                  <Badge variant="secondary" className="ml-2">
                    {action.count} {action.count === 1 ? 'item' : 'items'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{action.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    ₹{(action.impactAmount / 100000).toFixed(1)}L impact
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{action.estimatedTime} min
                  </span>
                </div>
              </div>
              <Button
                onClick={action.onClick}
                variant="default"
                size="sm"
                className="ml-4 group-hover:scale-105 transition-transform"
              >
                Take Action
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        {urgentCount > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-center">
              <span className="font-semibold text-warning">{urgentCount} urgent {urgentCount === 1 ? 'action' : 'actions'}</span>
              <span className="text-muted-foreground"> - Complete these first for maximum impact! 🎯</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
