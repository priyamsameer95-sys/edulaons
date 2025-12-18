import { STATUS_CONFIG, LeadStatusExtended } from '@/constants/processFlow';
import { cn } from '@/lib/utils';
import { ArrowRight, Clock } from 'lucide-react';
import { formatDistanceToNow, differenceInHours } from 'date-fns';

interface StatusTransitionPreviewProps {
  currentStatus: LeadStatusExtended;
  selectedStatus: LeadStatusExtended;
  stageStartedAt?: Date | string | null;
}

export function StatusTransitionPreview({ 
  currentStatus, 
  selectedStatus,
  stageStartedAt 
}: StatusTransitionPreviewProps) {
  const currentConfig = STATUS_CONFIG[currentStatus];
  const selectedConfig = STATUS_CONFIG[selectedStatus];
  const hasChanged = currentStatus !== selectedStatus;

  // Calculate TAT info
  let tatInfo = null;
  if (stageStartedAt) {
    const startDate = typeof stageStartedAt === 'string' ? new Date(stageStartedAt) : stageStartedAt;
    const hoursInStage = differenceInHours(new Date(), startDate);
    const expectedHours = currentConfig.expectedTATHours;
    const isBreached = hoursInStage > expectedHours && expectedHours > 0;
    const isWarning = hoursInStage > expectedHours * 0.75 && expectedHours > 0;

    tatInfo = {
      timeInStage: formatDistanceToNow(startDate, { addSuffix: false }),
      isBreached,
      isWarning,
      expectedHours
    };
  }

  const CurrentIcon = currentConfig.icon;
  const SelectedIcon = selectedConfig.icon;

  return (
    <div className="space-y-3">
      {/* Status Transition */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        {/* Current Status */}
        <div className="flex items-center gap-2 flex-1">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            currentConfig.bgColor
          )}>
            <CurrentIcon className={cn("h-4 w-4", currentConfig.color)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-sm font-medium">{currentConfig.label}</p>
          </div>
        </div>

        {/* Arrow */}
        {hasChanged && (
          <>
            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            
            {/* Selected Status */}
            <div className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                selectedConfig.bgColor
              )}>
                <SelectedIcon className={cn("h-4 w-4", selectedConfig.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Moving to</p>
                <p className="text-sm font-medium text-primary">{selectedConfig.label}</p>
              </div>
            </div>
          </>
        )}

        {!hasChanged && (
          <div className="flex-1 text-center text-xs text-muted-foreground">
            No status change selected
          </div>
        )}
      </div>

      {/* TAT Info */}
      {tatInfo && (
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded text-xs",
          tatInfo.isBreached && "bg-red-50 text-red-700",
          tatInfo.isWarning && !tatInfo.isBreached && "bg-amber-50 text-amber-700",
          !tatInfo.isWarning && !tatInfo.isBreached && "bg-muted text-muted-foreground"
        )}>
          <Clock className="h-3.5 w-3.5" />
          <span>Time in stage: <strong>{tatInfo.timeInStage}</strong></span>
          {tatInfo.expectedHours > 0 && (
            <span className="ml-auto">
              Expected: {tatInfo.expectedHours < 24 
                ? `${tatInfo.expectedHours}h` 
                : `${Math.round(tatInfo.expectedHours / 24)}d`
              }
            </span>
          )}
          {tatInfo.isBreached && <span className="font-medium">• SLA Breached</span>}
        </div>
      )}
    </div>
  );
}
