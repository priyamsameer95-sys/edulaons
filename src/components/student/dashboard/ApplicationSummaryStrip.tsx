/**
 * Application Summary Strip
 * 
 * Clean, calm summary with application ID, stage, and progress.
 * Desktop-first with generous spacing.
 */
import { cn } from '@/lib/utils';

interface ApplicationSummaryStripProps {
  caseId: string;
  currentStage: string;
  uploadedCount: number;
  totalCount: number;
  className?: string;
}

const ApplicationSummaryStrip = ({
  caseId,
  currentStage,
  uploadedCount,
  totalCount,
  className,
}: ApplicationSummaryStripProps) => {
  const percentage = totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 0;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn(
      "grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-8 p-8 lg:p-10",
      "bg-card rounded-2xl border border-border",
      className
    )}>
      {/* Left: Application Details */}
      <div className="flex flex-col justify-center space-y-6">
        {/* Application ID */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Application ID
          </p>
          <p className="text-xl font-semibold text-foreground font-mono tracking-wide">
            {caseId}
          </p>
        </div>

        {/* Current Stage */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Current Stage
          </p>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <p className="text-xl font-semibold text-foreground">
              {currentStage}
            </p>
          </div>
        </div>

        {/* Documents Count */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Documents Uploaded
          </p>
          <p className="text-lg text-foreground">
            <span className="font-semibold">{uploadedCount}</span>
            <span className="text-muted-foreground"> of {totalCount}</span>
          </p>
        </div>
      </div>

      {/* Right: Progress Ring */}
      <div className="flex items-center justify-center lg:justify-end">
        <div className="relative w-36 h-36 lg:w-40 lg:h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className="text-primary transition-all duration-1000 ease-out"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground tabular-nums">
              {percentage}%
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              Complete
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSummaryStrip;
