import { Button } from '@/components/ui/button';
import { LayoutGrid, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LenderViewToggleProps {
  view: 'cards' | 'table';
  onViewChange: (view: 'cards' | 'table') => void;
}

const LenderViewToggle = ({ view, onViewChange }: LenderViewToggleProps) => {
  return (
    <div className="inline-flex items-center rounded-lg border bg-muted/30 p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('cards')}
        className={cn(
          "h-8 px-3 gap-2",
          view === 'cards' 
            ? "bg-background shadow-sm text-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('table')}
        className={cn(
          "h-8 px-3 gap-2",
          view === 'table' 
            ? "bg-background shadow-sm text-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Table2 className="h-4 w-4" />
        <span className="hidden sm:inline">Compare</span>
      </Button>
    </div>
  );
};

export default LenderViewToggle;
