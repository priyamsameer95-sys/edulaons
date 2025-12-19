import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, X, TrendingUp } from "lucide-react";

interface QuickActionsBarProps {
  onNewLead: () => void;
  onEligibilityCheck?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const QuickActionsBar = ({
  onNewLead,
  onEligibilityCheck,
  searchQuery,
  onSearchChange,
}: QuickActionsBarProps) => {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Primary Action - New Lead */}
      <Button onClick={onNewLead} className="gap-2">
        <Plus className="h-4 w-4" />
        Add New Lead
      </Button>

      {/* Secondary Action - Eligibility Check */}
      {onEligibilityCheck && (
        <Button onClick={onEligibilityCheck} variant="outline" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Check Eligibility
        </Button>
      )}

      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
