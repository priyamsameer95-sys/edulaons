import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { StudentApplication } from "@/hooks/useStudentApplications";
import { StudentApplicationCard } from "./StudentApplicationCard";
import { SupportButton } from "./SupportButton";
import { ActionRequiredBanner } from "./ActionRequiredBanner";
import { 
  PlusCircle, 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Rocket
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
  timeEstimate?: string;
}

const getStepsForApplication = (app: StudentApplication): StepInfo[] => {
  const status = app.status;
  const docsStatus = app.documents_status;

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
      timeEstimate: "~10 minutes",
    },
    {
      id: "review",
      title: "Lender Review",
      description: "Application being processed",
      icon: <Clock className="h-5 w-5" />,
      status: isInProgress ? "current" : isNew ? "upcoming" : "completed",
      timeEstimate: "1-2 days",
    },
    {
      id: "approval",
      title: "Approval & Sanction",
      description: isApproved ? "Loan approved!" : isRejected ? "Application rejected" : "Awaiting decision",
      icon: <Sparkles className="h-5 w-5" />,
      status: isApproved ? "completed" : "upcoming",
      timeEstimate: "24-48 hrs",
    },
    {
      id: "disbursement",
      title: "Disbursement",
      description: "Funds transferred to university",
      icon: <CheckCircle2 className="h-5 w-5" />,
      status: "upcoming",
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
  const primaryApp = applications[0];
  const steps = primaryApp ? getStepsForApplication(primaryApp) : [];
  const progress = primaryApp ? calculateProgress(steps) : 0;
  const currentStep = steps.find(s => s.status === "current");
  
  // Get pending action applications
  const pendingActions = applications.filter(
    app => app.documents_status === 'pending' || app.documents_status === 'resubmission_required'
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Progress Ring */}
      <header className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              {/* Progress Ring */}
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={`${progress * 2.26} 226`}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-foreground">{progress}%</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back!</h1>
              <p className="text-muted-foreground">
                {hasApplications 
                  ? currentStep 
                    ? `Next: ${currentStep.title}` 
                    : "Your application is progressing"
                  : "Ready to start your education loan journey?"}
              </p>
            </div>
          </div>
          <Button onClick={onNewApplication} variant="outline" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Application
          </Button>
        </div>
      </header>

      {/* Action Required Banner */}
      {pendingActions.length > 0 && (
        <ActionRequiredBanner 
          pendingActions={pendingActions} 
          onViewApplication={onSelectApplication} 
        />
      )}

      {/* Current Action Card - What to do next */}
      {currentStep && currentStep.action && (
        <Card className="border-2 border-primary bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Rocket className="h-7 w-7" />
                </div>
                <div>
                  <Badge variant="secondary" className="mb-2 bg-primary/20 text-primary border-0">
                    Next Step
                  </Badge>
                  <h3 className="text-xl font-bold text-foreground">{currentStep.title}</h3>
                  <p className="text-muted-foreground">{currentStep.description}</p>
                  {currentStep.timeEstimate && (
                    <p className="text-sm text-primary font-medium mt-1">
                      ⏱ Estimated: {currentStep.timeEstimate}
                    </p>
                  )}
                </div>
              </div>
              <Button size="lg" className="gap-2 shadow-md" onClick={() => onSelectApplication(primaryApp)}>
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
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4 py-3">
                  {/* Step indicator with connecting line */}
                  <div className="relative flex flex-col items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
                      ${step.status === "completed" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : ""}
                      ${step.status === "current" ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110" : ""}
                      ${step.status === "upcoming" ? "bg-muted text-muted-foreground" : ""}
                    `}>
                      {step.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
                    </div>
                    {/* Connecting line */}
                    {index < steps.length - 1 && (
                      <div className={`absolute top-10 w-0.5 h-8 ${
                        step.status === "completed" ? "bg-emerald-300 dark:bg-emerald-700" : "bg-border"
                      }`} />
                    )}
                  </div>
                  
                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className={`font-medium ${step.status === "upcoming" ? "text-muted-foreground" : "text-foreground"}`}>
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">{step.description}</p>
                      </div>
                      {step.status === "completed" && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
                          Done
                        </Badge>
                      )}
                      {step.status === "current" && !step.action && (
                        <Badge className="shrink-0 animate-pulse">In Progress</Badge>
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
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
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
