import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, X, Zap, Sparkles } from "lucide-react";

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
    <div className="relative">
      {/* Glass morphism container */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-background/80 via-background/60 to-background/80 backdrop-blur-sm border border-border/50 shadow-xl">
        
        {/* Quick Actions Section */}
        <div className="flex items-center gap-3">
          {/* New Lead - Primary CTA */}
          <Button 
            onClick={onNewLead} 
            size="lg"
            className="gap-2.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] font-semibold px-5 rounded-xl"
          >
            <div className="p-1 bg-white/20 rounded-lg">
              <Plus className="h-4 w-4" />
            </div>
            <span>New Lead</span>
          </Button>

          {/* Eligibility Check - Hero CTA */}
          {onEligibilityCheck && (
            <Button 
              onClick={onEligibilityCheck} 
              size="lg"
              className="relative gap-2.5 overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white border-0 shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-[1.02] font-bold px-6 rounded-xl group"
            >
              {/* Animated background shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <div className="relative flex items-center gap-2.5">
                <div className="p-1.5 bg-white/25 rounded-lg">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-xs font-medium opacity-90">Instant</span>
                  <span className="text-sm">Eligibility Check</span>
                </div>
                <Sparkles className="h-4 w-4 ml-1 animate-pulse" />
              </div>
            </Button>
          )}
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-border/60" />

        {/* Search Section */}
        <div className="relative flex-1 min-w-[220px] max-w-md group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          <Input
            placeholder="Search by name, email, or case ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-11 pr-10 h-11 bg-muted/50 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/50 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
