import { format } from "date-fns";

interface DataFreshnessIndicatorProps {
  lastUpdated: Date;
}

export const DataFreshnessIndicator = ({ lastUpdated }: DataFreshnessIndicatorProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-success" />
        <span className="text-sm text-muted-foreground">
          Live Data • Last updated {format(lastUpdated, 'h:mm a')}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Secure connection</span>
        <span>•</span>
        <span>Real-time sync</span>
      </div>
    </div>
  );
};
