import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { StudentApplication } from "@/hooks/useStudentApplications";
import { StudentApplicationCard } from "./StudentApplicationCard";
import { SupportButton } from "./SupportButton";
import { 
  PlusCircle, 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  AlertCircle
} from "lucide-react";

interface GuidedWizardDashboardProps {
  applications: StudentApplication[];
  onSelectApplication: (app: StudentApplication) => void;
  onNewApplication: () => void;
}

interface StepInfo {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "completed" | "current" | "upcoming";
  action?: string;
}

const getStepsForApplication = (app: StudentApplication): StepInfo[] => {
  const status = app.status;
  const docsStatus = app.documents_status;

  // Map status to step progress - using the actual enum values from the hook
  const isInProgress = status === "in_progress";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isNew = status === "new";

  const steps: StepInfo[] = [
    {
      id: "apply",
      title: "Application Submitted",
      description: "Your basic details are saved",
      icon: <CheckCircle2 className="h-5 w-5" />,
      status: "completed",
    },
    {
      id: "documents",
      title: "Upload Documents",
      description: docsStatus === "pending" ? "Upload required documents" : 
                   docsStatus === "uploaded" ? "Documents under review" : 
                   docsStatus === "verified" ? "Documents verified" : 
                   "Resubmission needed",
      icon: <Upload className="h-5 w-5" />,
      status: docsStatus === "pending" || docsStatus === "resubmission_required" ? "current" : 
              docsStatus === "verified" ? "completed" : "current",
      action: docsStatus === "pending" ? "Upload Now" : 
              docsStatus === "resubmission_required" ? "Resubmit" : undefined,
    },
    {
      id: "review",
      title: "Lender Review",
      description: "Application being processed",
      icon: <Clock className="h-5 w-5" />,
      status: isInProgress ? "current" : isNew ? "upcoming" : "completed",
    },
    {
      id: "approval",
      title: "Approval & Sanction",
      description: isApproved ? "Loan approved!" : isRejected ? "Application rejected" : "Awaiting decision",
      icon: <Sparkles className="h-5 w-5" />,
      status: isApproved ? "completed" : "upcoming",
    },
    {
      id: "disbursement",
      title: "Disbursement",
      description: "Funds transferred to university",
      icon: <CheckCircle2 className="h-5 w-5" />,
      status: "upcoming", // Will be completed when we have disbursement status
    },
  ];

  return steps;
};

const calculateProgress = (steps: StepInfo[]): number => {
  const completed = steps.filter(s => s.status === "completed").length;
  const current = steps.filter(s => s.status === "current").length;
  return Math.round(((completed + (current * 0.5)) / steps.length) * 100);
};

export const GuidedWizardDashboard = ({ 
  applications, 
  onSelectApplication, 
  onNewApplication 
}: GuidedWizardDashboardProps) => {
  const hasApplications = applications.length > 0;
  const primaryApp = applications[0]; // Most recent or active application
  const steps = primaryApp ? getStepsForApplication(primaryApp) : [];
  const progress = primaryApp ? calculateProgress(steps) : 0;
  const currentStep = steps.find(s => s.status === "current");

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <header className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back!</h1>
            <p className="text-muted-foreground">
              {hasApplications 
                ? "Here's your application progress" 
                : "Ready to start your education loan journey?"}
            </p>
          </div>
          {hasApplications && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{progress}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
              <Button onClick={onNewApplication} variant="outline" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                New Application
              </Button>
            </div>
          )}
        </div>

        {hasApplications && (
          <div className="mt-6">
            <Progress value={progress} className="h-3" />
          </div>
        )}
      </header>

      {/* Current Action Card - What to do next */}
      {currentStep && currentStep.action && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  {currentStep.id === "documents" ? <Upload className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                </div>
                <div>
                  <Badge variant="secondary" className="mb-2">Next Step</Badge>
                  <h3 className="text-lg font-semibold text-foreground">{currentStep.title}</h3>
                  <p className="text-muted-foreground">{currentStep.description}</p>
                </div>
              </div>
              <Button className="gap-2" onClick={() => onSelectApplication(primaryApp)}>
                {currentStep.action}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step-by-Step Progress */}
      {hasApplications && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-4">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                    ${step.status === "completed" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : ""}
                    ${step.status === "current" ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : ""}
                    ${step.status === "upcoming" ? "bg-muted text-muted-foreground" : ""}
                  `}>
                    {step.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
                  </div>
                  <div className="flex-1 pb-4 border-b border-border last:border-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-medium ${step.status === "upcoming" ? "text-muted-foreground" : "text-foreground"}`}>
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      {step.status === "completed" && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Done
                        </Badge>
                      )}
                      {step.status === "current" && !step.action && (
                        <Badge>In Progress</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications List */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {applications.length === 1 ? "Your Application" : `All Applications (${applications.length})`}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {applications.map((app) => (
              <StudentApplicationCard
                key={app.id}
                application={app}
                onClick={() => onSelectApplication(app)}
              />
            ))}
          </div>
        </div>
        <div>
          <SupportButton />
        </div>
      </section>
    </div>
  );
};
