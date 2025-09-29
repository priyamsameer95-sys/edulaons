import { Progress } from '@/components/ui/progress';
import { LEAD_STATUS_OPTIONS } from '@/utils/statusUtils';
import type { LeadStatus } from '@/utils/statusUtils';

interface StatusProgressIndicatorProps {
  currentStatus: LeadStatus;
  className?: string;
}

// Define the order of statuses in the workflow
const STATUS_WORKFLOW_ORDER: LeadStatus[] = [
  'new',
  'contacted', 
  'in_progress',
  'document_review',
  'approved'
];

export function StatusProgressIndicator({ currentStatus, className }: StatusProgressIndicatorProps) {
  const currentIndex = STATUS_WORKFLOW_ORDER.indexOf(currentStatus);
  const progressPercentage = currentIndex >= 0 ? ((currentIndex + 1) / STATUS_WORKFLOW_ORDER.length) * 100 : 0;
  
  // Special cases for terminal states
  const isRejected = currentStatus === 'rejected';
  const isWithdrawn = currentStatus === 'withdrawn';
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Progress</span>
        <span>
          {isRejected ? 'Rejected' : isWithdrawn ? 'Withdrawn' : `${Math.round(progressPercentage)}%`}
        </span>
      </div>
      
      <Progress 
        value={isRejected || isWithdrawn ? 100 : progressPercentage} 
        className={`h-2 ${isRejected ? 'bg-red-100' : isWithdrawn ? 'bg-gray-100' : ''}`}
      />
      
      <div className="flex justify-between">
        {STATUS_WORKFLOW_ORDER.map((status, index) => {
          const isActive = index <= currentIndex && !isRejected && !isWithdrawn;
          const isCurrent = status === currentStatus;
          const statusOption = LEAD_STATUS_OPTIONS.find(opt => opt.value === status);
          
          return (
            <div 
              key={status} 
              className={`flex flex-col items-center text-xs ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div 
                className={`w-3 h-3 rounded-full border-2 ${
                  isCurrent 
                    ? 'bg-primary border-primary' 
                    : isActive 
                      ? 'bg-primary/20 border-primary' 
                      : 'bg-muted border-muted-foreground/30'
                }`} 
              />
              <span className="mt-1 max-w-12 truncate">
                {statusOption?.label || status}
              </span>
            </div>
          );
        })}
      </div>
      
      {(isRejected || isWithdrawn) && (
        <div className="text-center text-xs text-muted-foreground">
          Lead has been {currentStatus}
        </div>
      )}
    </div>
  );
}