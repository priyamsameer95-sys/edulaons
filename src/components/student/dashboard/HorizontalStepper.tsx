import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudentApplication } from "@/hooks/useStudentApplications";

interface HorizontalStepperProps {
  application: StudentApplication;
}

interface Step {
  id: string;
  label: string;
  shortLabel: string;
  status: "completed" | "current" | "upcoming";
}

const getSteps = (app: StudentApplication): Step[] => {
  const status = app.status;
  const docsStatus = app.documents_status;
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const docsComplete = docsStatus === "verified";
  const docsUploaded = docsStatus === "uploaded";
  const isInReview = status === "in_progress" && docsComplete;

  return [
    {
      id: "applied",
      label: "Applied",
      shortLabel: "Applied",
      status: "completed",
    },
    {
      id: "documents",
      label: "Documents",
      shortLabel: "Docs",
      status: docsComplete ? "completed" : docsUploaded ? "current" : 
              docsStatus === "pending" || docsStatus === "resubmission_required" ? "current" : "upcoming",
    },
    {
      id: "review",
      label: "Under Review",
      shortLabel: "Review",
      status: isApproved || isRejected ? "completed" : isInReview ? "current" : "upcoming",
    },
    {
      id: "decision",
      label: isApproved ? "Approved!" : isRejected ? "Rejected" : "Decision",
      shortLabel: isApproved ? "Done!" : isRejected ? "Rejected" : "Decision",
      status: isApproved || isRejected ? "completed" : "upcoming",
    },
  ];
};

export const HorizontalStepper = ({ application }: HorizontalStepperProps) => {
  const steps = getSteps(application);
  const currentIndex = steps.findIndex((s) => s.status === "current");
  const progress = currentIndex === -1 
    ? (steps.every(s => s.status === "completed") ? 100 : 0)
    : Math.round(((currentIndex + 0.5) / steps.length) * 100);

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6">
      {/* Progress Bar */}
      <div className="relative mb-6 md:mb-8">
        {/* Background track */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-muted rounded-full" />
        {/* Progress fill */}
        <div 
          className="absolute top-4 left-0 h-1 bg-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
        
        {/* Step indicators */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300",
                  step.status === "completed" && "bg-primary text-primary-foreground",
                  step.status === "current" && "bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse",
                  step.status === "upcoming" && "bg-muted text-muted-foreground border-2 border-border"
                )}
              >
                {step.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : step.status === "current" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              
              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-[10px] md:text-xs font-medium text-center max-w-[60px] md:max-w-none",
                  step.status === "current" && "text-primary font-semibold",
                  step.status === "completed" && "text-foreground",
                  step.status === "upcoming" && "text-muted-foreground"
                )}
              >
                <span className="hidden md:inline">{step.label}</span>
                <span className="md:hidden">{step.shortLabel}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current step description */}
      {currentIndex !== -1 && (
        <div className="text-center pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Current: </span>
            {steps[currentIndex].label}
            {steps[currentIndex].id === "documents" && application.documents_status === "pending" && (
              <span className="text-amber-500 ml-1">— Upload required</span>
            )}
            {steps[currentIndex].id === "documents" && application.documents_status === "resubmission_required" && (
              <span className="text-destructive ml-1">— Resubmission needed</span>
            )}
            {steps[currentIndex].id === "review" && (
              <span className="text-blue-500 ml-1">— Usually 1-2 days</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
