import { Progress } from '@/components/ui/progress';
import { STATUS_CONFIG, PHASE_CONFIG, LeadStatusExtended, ProcessPhase, getOrderedStatuses } from '@/constants/processFlow';
import { useStatusProgress } from '@/hooks/useStatusMapping';
import type { LeadStatus } from '@/utils/statusUtils';
import { CheckCircle, Circle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusProgressIndicatorProps {
  currentStatus: LeadStatus;
  className?: string;
  showPhases?: boolean;
  compact?: boolean;
}

export function StatusProgressIndicator({ 
  currentStatus, 
  className,
  showPhases = true,
  compact = false 
}: StatusProgressIndicatorProps) {
  const progress = useStatusProgress(currentStatus);
  const config = STATUS_CONFIG[currentStatus as LeadStatusExtended];
  
  const isRejected = currentStatus === 'rejected';
  const isWithdrawn = currentStatus === 'withdrawn';
  const isTerminal = isRejected || isWithdrawn;
  const isDisbursed = currentStatus === 'disbursed';
  
  if (compact) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{config?.shortLabel || currentStatus}</span>
          <span>
            {isTerminal ? config?.label : isDisbursed ? 'Complete' : `${progress}%`}
          </span>
        </div>
        <Progress 
          value={isTerminal ? 100 : isDisbursed ? 100 : progress} 
          className={cn(
            "h-1.5",
            isRejected && "[&>div]:bg-red-500",
            isWithdrawn && "[&>div]:bg-gray-400",
            isDisbursed && "[&>div]:bg-green-500"
          )}
        />
      </div>
    );
  }
  
  // Full phase-based view
  const phases: ProcessPhase[] = ['pre_login', 'with_lender', 'sanction', 'disbursement'];
  const currentPhase = config?.phase || 'pre_login';
  const currentStep = config?.step || 0;
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Application Progress</span>
          <span className={cn(
            isRejected && "text-red-600",
            isWithdrawn && "text-gray-600",
            isDisbursed && "text-green-600 font-medium"
          )}>
            {isTerminal ? config?.label : isDisbursed ? 'Completed!' : `Step ${currentStep} of 22`}
          </span>
        </div>
        <Progress 
          value={isTerminal ? 100 : isDisbursed ? 100 : progress} 
          className={cn(
            "h-2",
            isRejected && "[&>div]:bg-red-500",
            isWithdrawn && "[&>div]:bg-gray-400",
            isDisbursed && "[&>div]:bg-green-500"
          )}
        />
      </div>
      
      {/* Phase indicators */}
      {showPhases && !isTerminal && (
        <div className="flex justify-between">
          {phases.map((phase, index) => {
            const phaseConfig = PHASE_CONFIG[phase];
            const phaseStatuses = getOrderedStatuses().filter(s => 
              STATUS_CONFIG[s]?.phase === phase
            );
            const firstStepInPhase = STATUS_CONFIG[phaseStatuses[0]]?.step || 0;
            const lastStepInPhase = STATUS_CONFIG[phaseStatuses[phaseStatuses.length - 1]]?.step || 0;
            
            const isComplete = currentStep > lastStepInPhase;
            const isCurrent = currentPhase === phase;
            const isPending = currentStep < firstStepInPhase;
            
            return (
              <div 
                key={phase}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors",
                  isComplete && "bg-green-100 border-green-500",
                  isCurrent && "bg-primary/10 border-primary",
                  isPending && "bg-muted border-muted-foreground/30"
                )}>
                  {isComplete ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : isCurrent ? (
                    <Circle className="h-3 w-3 fill-primary text-primary" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground/50" />
                  )}
                </div>
                <span className={cn(
                  "text-xs text-center",
                  isComplete && "text-green-600",
                  isCurrent && "text-primary font-medium",
                  isPending && "text-muted-foreground"
                )}>
                  {phaseConfig.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Terminal state message */}
      {isTerminal && (
        <div className={cn(
          "flex items-center gap-2 text-sm p-2 rounded-md",
          isRejected && "bg-red-50 text-red-700",
          isWithdrawn && "bg-gray-50 text-gray-700"
        )}>
          <XCircle className="h-4 w-4" />
          <span>{config?.description}</span>
        </div>
      )}
      
      {/* Current status detail */}
      {!isTerminal && config && (
        <div className={cn(
          "flex items-center gap-2 text-sm p-2 rounded-md",
          config.bgColor,
          config.color
        )}>
          {config.icon && <config.icon className="h-4 w-4" />}
          <span className="font-medium">{config.label}</span>
          <span className="text-xs opacity-75">— {config.description}</span>
        </div>
      )}
    </div>
  );
}
