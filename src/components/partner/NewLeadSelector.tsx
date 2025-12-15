import { Zap, FileText } from "lucide-react";
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
      <DialogContent className="sm:max-w-xl">
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
            className="flex flex-col gap-3 p-5 rounded-lg border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Quick Lead</h3>
                <p className="text-xs text-muted-foreground">~1 minute</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">You fill:</p>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                <li>Name, Phone, Email, PIN</li>
                <li>Country & University</li>
                <li>Loan Amount</li>
                <li>Co-applicant Type & Salary</li>
              </ul>
            </div>

            <div className="border-t border-border pt-3 mt-1">
              <p className="text-xs font-medium text-foreground mb-1">What happens next:</p>
              <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside pl-1">
                <li>Lead created instantly</li>
                <li>Student notified via SMS/Email</li>
                <li>Student completes profile</li>
                <li>Student uploads documents</li>
              </ol>
            </div>

            <span className="text-[10px] text-primary font-medium bg-primary/10 px-2 py-1 rounded self-start mt-1">
              Recommended for quick capture
            </span>
          </button>

          {/* Full Lead Option */}
          <button
            onClick={() => {
              onSelectFull();
              onClose();
            }}
            className="flex flex-col gap-3 p-5 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <FileText className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Full Lead</h3>
                <p className="text-xs text-muted-foreground">~5 minutes</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">You fill everything:</p>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                <li>Complete student details</li>
                <li>Academic background & tests</li>
                <li>University & course selection</li>
                <li>Full co-applicant info</li>
                <li>Loan amount & type</li>
              </ul>
            </div>

            <div className="flex-1" />

            <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-1 rounded self-start mt-1">
              For complete applications
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
