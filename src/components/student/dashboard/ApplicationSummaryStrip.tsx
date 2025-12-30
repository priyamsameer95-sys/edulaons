/**
 * Application Summary Strip
 * 
 * Top-of-page summary with application snapshot (left) 
 * and large progress ring (right).
 * Desktop-first, premium aesthetic.
 */
import { cn } from '@/lib/utils';

interface ApplicationSummaryStripProps {
  caseId: string;
  currentStage: string;
  lenderCount: number;
  uploadedCount: number;
  totalCount: number;
  className?: string;
}

const ApplicationSummaryStrip = ({
  caseId,
  currentStage,
  lenderCount,
  uploadedCount,
  totalCount,
  className,
}: ApplicationSummaryStripProps) => {
  const percentage = totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 0;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn(
      "grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-12 p-6 lg:p-8",
      "bg-card border border-border rounded-2xl",
      className
    )}>
      {/* Left: Application Snapshot */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Application ID
          </p>
          <p className="text-lg font-semibold text-foreground font-mono">
            {caseId}
          </p>
        </div>
        
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Current Stage
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-lg font-semibold text-foreground">
              {currentStage}
            </p>
          </div>
        </div>
        
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Lender Access
          </p>
          <p className="text-sm text-muted-foreground">
            {lenderCount > 0 ? (
              <>Will be shared with <span className="font-medium text-foreground">{lenderCount} lender{lenderCount > 1 ? 's' : ''}</span> after upload</>
            ) : (
              'Matching lenders...'
            )}
          </p>
        </div>
      </div>

      {/* Right: Progress Ring */}
      <div className="flex flex-col items-center justify-center lg:pr-4">
        <div className="relative w-32 h-32 lg:w-36 lg:h-36">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted/30"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className="text-primary transition-all duration-700 ease-out"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl lg:text-4xl font-bold text-foreground">
              {percentage}%
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Complete
            </span>
          </div>
        </div>
        
        <p className="mt-3 text-sm text-muted-foreground text-center">
          <span className="font-semibold text-foreground">{uploadedCount}</span> of {totalCount} documents
        </p>
      </div>
    </div>
  );
};

export default ApplicationSummaryStrip;
