import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap } from 'lucide-react';
import { getCompletenessColor } from '@/utils/leadCompleteness';

interface StudentCellProps {
  name: string | undefined;
  email: string | undefined;
  caseId: string;
  isQuickLead: boolean;
  isQuickLeadIncomplete: boolean;
  isIncomplete: boolean;
  completenessScore: number;
  missingRequired: { displayName: string }[];
}

export function StudentCell({
  name,
  email,
  caseId,
  isQuickLead,
  isQuickLeadIncomplete,
  isIncomplete,
  completenessScore,
  missingRequired,
}: StudentCellProps) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="font-medium text-sm truncate max-w-[180px]">
              {name || 'Unknown'}
            </p>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{name || 'Unknown'}</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Quick Lead badge */}
        {isQuickLead && isQuickLeadIncomplete && (
          <Tooltip>
            <TooltipTrigger>
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200 gap-0.5"
              >
                <Zap className="h-2.5 w-2.5" />
                Quick
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Incomplete quick lead - needs additional details</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Incomplete badge for ANY lead with missing required fields */}
        {isIncomplete && !isQuickLeadIncomplete && (
          <Tooltip>
            <TooltipTrigger>
              <Badge 
                variant="outline" 
                className={`text-[10px] px-1.5 py-0 h-4 ${getCompletenessColor(completenessScore)} gap-0.5`}
              >
                {completenessScore}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p className="font-medium">Missing Required Fields:</p>
                <ul className="list-disc pl-3">
                  {missingRequired.slice(0, 5).map((f, i) => (
                    <li key={i}>{f.displayName}</li>
                  ))}
                  {missingRequired.length > 5 && (
                    <li>+{missingRequired.length - 5} more</li>
                  )}
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {email || caseId}
          </p>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{email || caseId}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
