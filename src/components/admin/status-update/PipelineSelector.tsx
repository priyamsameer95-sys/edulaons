import { STATUS_CONFIG, PHASE_CONFIG, ProcessPhase, LeadStatusExtended } from '@/constants/processFlow';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface PipelineSelectorProps {
  currentStatus: LeadStatusExtended;
  selectedStatus: LeadStatusExtended;
  onSelectStatus: (status: LeadStatusExtended) => void;
  isAdmin?: boolean;
}

const PHASE_ORDER: ProcessPhase[] = ['pre_login', 'with_lender', 'sanction', 'disbursement'];

// Get statuses for each phase, excluding legacy ones
const getPhaseStatuses = (phase: ProcessPhase): LeadStatusExtended[] => {
  const legacyStatuses = ['new', 'contacted', 'in_progress', 'document_review', 'approved'];
  return Object.values(STATUS_CONFIG)
    .filter(s => s.phase === phase && !legacyStatuses.includes(s.value) && s.step > 0)
    .sort((a, b) => a.step - b.step)
    .map(s => s.value);
};

export function PipelineSelector({ 
  currentStatus, 
  selectedStatus, 
  onSelectStatus,
  isAdmin = false 
}: PipelineSelectorProps) {
  const currentConfig = STATUS_CONFIG[currentStatus];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {PHASE_ORDER.map((phase) => {
        const phaseConfig = PHASE_CONFIG[phase];
        const statuses = getPhaseStatuses(phase);

        return (
          <div key={phase} className="space-y-2">
            {/* Phase Header */}
            <div className={cn(
              "text-xs font-semibold px-2 py-1 rounded",
              phaseConfig.bgColor,
              phaseConfig.color
            )}>
              {phaseConfig.label}
            </div>

            {/* Status Items */}
            <div className="space-y-1">
              {statuses.map((status) => {
                const config = STATUS_CONFIG[status];
                const isCurrent = status === currentStatus;
                const isSelected = status === selectedStatus;
                const isPast = config.step < currentConfig.step;
                const Icon = config.icon;

                return (
                  <button
                    key={status}
                    onClick={() => onSelectStatus(status)}
                    disabled={!isAdmin && status !== currentStatus}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors",
                      "border border-transparent",
                      // Selected state
                      isSelected && "border-primary bg-primary/10 font-medium",
                      // Current status indicator
                      isCurrent && !isSelected && "bg-muted border-muted-foreground/30",
                      // Past statuses
                      isPast && !isSelected && "opacity-60",
                      // Hover state
                      !isSelected && "hover:bg-muted/50",
                      // Disabled state for non-admins
                      !isAdmin && !isCurrent && "cursor-not-allowed opacity-40"
                    )}
                  >
                    {/* Step indicator / checkmark */}
                    <div className={cn(
                      "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium",
                      isPast && "bg-green-100 text-green-700",
                      isCurrent && !isPast && config.bgColor,
                      !isPast && !isCurrent && "bg-muted text-muted-foreground"
                    )}>
                      {isPast ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        config.step
                      )}
                    </div>

                    {/* Icon and Label */}
                    <Icon className={cn(
                      "h-3.5 w-3.5 flex-shrink-0",
                      isSelected ? "text-primary" : config.color
                    )} />
                    <span className="truncate">{config.shortLabel}</span>

                    {/* Current indicator */}
                    {isCurrent && (
                      <span className="ml-auto text-[9px] bg-foreground/10 px-1 rounded">
                        NOW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
