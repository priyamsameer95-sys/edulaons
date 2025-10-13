import { HelpCircle, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ActivityTooltipProps {
  activityType: string;
  priority: string;
  impactAmount?: number;
  timeRemaining?: number;
  recommendedAction?: string;
  conversionProbability?: number;
}

export const ActivityTooltip = ({
  activityType,
  priority,
  impactAmount,
  timeRemaining,
  recommendedAction,
  conversionProbability
}: ActivityTooltipProps) => {
  
  const getWhyUrgent = () => {
    if (priority === 'URGENT' && timeRemaining !== undefined) {
      return `⏰ Time sensitive: Only ${timeRemaining} hours remaining before this escalates further.`;
    }
    if (activityType === 'document_pending' && priority === 'URGENT') {
      return '📄 Pending documents block application progress. Quick verification unlocks next steps.';
    }
    if (activityType === 'status_change' && priority === 'URGENT') {
      return '🚨 Status changes require immediate attention to prevent delays.';
    }
    if (activityType === 'new_lead' && priority === 'URGENT') {
      return '🆕 New lead engagement within 24h increases conversion by 3x.';
    }
    return '💡 Quick action now prevents this from becoming a bigger issue later.';
  };

  const getImpactText = () => {
    if (impactAmount && impactAmount > 0) {
      return `💰 Potential impact: ₹${(impactAmount / 100000).toFixed(1)}L loan amount at stake.`;
    }
    return null;
  };

  const getSuccessRate = () => {
    if (conversionProbability) {
      return `📊 Success probability: ${conversionProbability}% based on historical data.`;
    }
    return null;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help inline-block ml-2 hover:text-primary transition-colors" />
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4 space-y-3" side="right">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm mb-1">Why urgent?</p>
                <p className="text-xs text-muted-foreground">{getWhyUrgent()}</p>
              </div>
            </div>

            {getImpactText() && (
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">{getImpactText()}</p>
              </div>
            )}

            {recommendedAction && (
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm mb-1">Best action:</p>
                  <p className="text-xs text-muted-foreground">{recommendedAction}</p>
                </div>
              </div>
            )}

            {getSuccessRate() && (
              <p className="text-xs text-muted-foreground border-t pt-2 mt-2">{getSuccessRate()}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
