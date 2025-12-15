import { Zap, FileText, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface NewLeadSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectQuick: () => void;
  onSelectFull: () => void;
}

export const NewLeadSelector = ({
  open,
  onClose,
  onSelectQuick,
  onSelectFull,
}: NewLeadSelectorProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">Add New Lead</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Quick Lead Option */}
          <button
            onClick={() => {
              onSelectQuick();
              onClose();
            }}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors text-left group"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-base">Quick Lead</h3>
              <p className="text-xs text-muted-foreground mt-1">
                6 fields only
              </p>
              <p className="text-xs text-muted-foreground">~30 seconds</p>
            </div>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Student fills rest
            </span>
          </button>

          {/* Full Lead Option */}
          <button
            onClick={() => {
              onSelectFull();
              onClose();
            }}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors text-left group"
          >
            <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-secondary">
              <FileText className="h-6 w-6 text-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-base">Full Lead</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Complete form
              </p>
              <p className="text-xs text-muted-foreground">~5 minutes</p>
            </div>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
              You fill everything
            </span>
          </button>
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
