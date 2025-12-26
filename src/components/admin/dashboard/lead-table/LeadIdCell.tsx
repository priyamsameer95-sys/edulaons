import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CopyButton } from '@/components/ui/copy-button';

interface LeadIdCellProps {
  leadId: string;
}

export function LeadIdCell({ leadId }: LeadIdCellProps) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs text-muted-foreground font-mono truncate max-w-[60px] cursor-help">
            {leadId.slice(0, 8)}…
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-mono">{leadId}</p>
        </TooltipContent>
      </Tooltip>
      <CopyButton 
        value={leadId} 
        className="h-5 w-5 hover:bg-muted"
        successMessage="Lead ID copied"
      />
    </div>
  );
}
