/**
 * CompactStatusHeader - Journey Card
 * 
 * 3-row compact status display:
 * Row 1: Case ID + Current Stage Badge
 * Row 2: 7-stage visual progress bar
 * Row 3: Detailed sub-status with icon + description + student action
 */
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  STATUS_CONFIG, 
  STUDENT_STAGE_CONFIG, 
  PHASE_CONFIG,
  getStudentStage,
  type LeadStatusExtended,
  type StudentStage,
} from '@/constants/processFlow';
import { Lightbulb, CheckCircle2 } from 'lucide-react';

// 7 simplified stages for the visual journey
const JOURNEY_STAGES: { id: StudentStage; label: string; shortLabel: string }[] = [
  { id: 'application_received', label: 'Applied', shortLabel: 'Applied' },
  { id: 'document_collection', label: 'Documents', shortLabel: 'Docs' },
  { id: 'under_review', label: 'Review', shortLabel: 'Review' },
  { id: 'with_lender', label: 'Lender', shortLabel: 'Lender' },
  { id: 'approved', label: 'Approved', shortLabel: 'Approved' },
  { id: 'disbursement', label: 'Disburse', shortLabel: 'Disburse' },
  { id: 'completed', label: 'Complete', shortLabel: 'Complete' },
];

// Get stage index for current student stage
function getStageIndex(studentStage: StudentStage): number {
  if (studentStage === 'closed') return -1; // Terminal
  const index = JOURNEY_STAGES.findIndex(s => s.id === studentStage);
  return index >= 0 ? index : 0;
}

// Phase to background color mapping for detail bar
const PHASE_BG_COLORS: Record<string, string> = {
  pre_login: 'bg-blue-50 border-blue-100',
  with_lender: 'bg-purple-50 border-purple-100',
  sanction: 'bg-green-50 border-green-100',
  disbursement: 'bg-emerald-50 border-emerald-100',
  terminal: 'bg-gray-50 border-gray-100',
};

interface CompactStatusHeaderProps {
  caseId: string;
  status: string;
  className?: string;
}

const CompactStatusHeader = ({ caseId, status, className }: CompactStatusHeaderProps) => {
  const statusKey = status as LeadStatusExtended;
  const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.lead_intake;
  const studentStage = getStudentStage(statusKey);
  const stageConfig = STUDENT_STAGE_CONFIG[studentStage];
  const phaseConfig = PHASE_CONFIG[statusConfig.phase];
  
  const currentStageIndex = getStageIndex(studentStage);
  const isClosed = studentStage === 'closed';
  const StatusIcon = statusConfig.icon;

  return (
    <div className={cn(
      "rounded-xl border bg-card overflow-hidden",
      className
    )}>
      {/* Row 1: Context Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <span className="font-mono text-sm text-muted-foreground tracking-wide">
          {caseId}
        </span>
        <Badge 
          variant="secondary"
          className={cn(
            "font-medium",
            stageConfig.bgColor,
            stageConfig.color
          )}
        >
          {stageConfig.label}
        </Badge>
      </div>

      {/* Row 2: 7-Stage Visual Journey */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between relative">
          {/* Connection line */}
          <div className="absolute top-3 left-4 right-4 h-0.5 bg-border" />
          
          {JOURNEY_STAGES.map((stage, index) => {
            const isCompleted = !isClosed && index < currentStageIndex;
            const isCurrent = !isClosed && index === currentStageIndex;
            const isFuture = isClosed || index > currentStageIndex;
            
            return (
              <div 
                key={stage.id} 
                className="flex flex-col items-center z-10"
              >
                {/* Stage dot */}
                <div 
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted && "bg-green-500 border-green-500",
                    isCurrent && "bg-primary border-primary ring-4 ring-primary/20",
                    isFuture && "bg-card border-muted-foreground/30"
                  )}
                >
                  {isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  )}
                  {isCurrent && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                
                {/* Stage label */}
                <span 
                  className={cn(
                    "mt-2 text-[10px] font-medium text-center max-w-[50px] leading-tight",
                    isCompleted && "text-green-600",
                    isCurrent && "text-primary font-semibold",
                    isFuture && "text-muted-foreground/60"
                  )}
                >
                  <span className="hidden sm:inline">{stage.label}</span>
                  <span className="sm:hidden">{stage.shortLabel}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Detailed Sub-Status Bar */}
      <div className={cn(
        "px-4 py-3 border-t",
        PHASE_BG_COLORS[statusConfig.phase] || PHASE_BG_COLORS.pre_login
      )}>
        {/* Status detail line */}
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("w-4 h-4 flex-shrink-0", statusConfig.color)} />
          <span className={cn("text-sm font-medium", statusConfig.color)}>
            {statusConfig.shortLabel}
          </span>
          <span className="text-muted-foreground">—</span>
          <span className="text-sm text-muted-foreground truncate">
            {statusConfig.description}
          </span>
        </div>

        {/* Student action callout (when applicable) */}
        {statusConfig.studentAction && (
          <div className="mt-2 flex items-start gap-2 text-sm">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="text-amber-800">
              <span className="font-medium">Your next step:</span>{' '}
              {statusConfig.studentAction}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactStatusHeader;
