import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StudentApplication } from "@/hooks/useStudentApplications";
import { StudentApplicationCard } from "./StudentApplicationCard";
import { QuickStatsBar } from "./QuickStatsBar";
import { HorizontalStepper } from "./HorizontalStepper";
import { MilestoneCelebration } from "./MilestoneCelebration";
import { FloatingSupportButton } from "./FloatingSupportButton";
import { 
  PlusCircle, 
  Upload, 
  ArrowRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface GuidedWizardDashboardProps {
  applications: StudentApplication[];
  onSelectApplication: (app: StudentApplication) => void;
  onNewApplication: () => void;
}

export const GuidedWizardDashboard = ({ 
  applications, 
  onSelectApplication, 
  onNewApplication 
}: GuidedWizardDashboardProps) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  
  const hasApplications = applications.length > 0;
  const primaryApp = applications[0];
  
  // Get pending action applications
  const pendingActions = applications.filter(
    app => app.documents_status === 'pending' || app.documents_status === 'resubmission_required'
  );
  
  const needsAction = pendingActions.length > 0;
  const isApproved = primaryApp?.status === 'approved';
  
  // Get student name from application
  const studentName = primaryApp?.student?.name?.split(' ')[0] || 'there';

  // Show celebration for approved status
  useEffect(() => {
    if (isApproved && !celebrationDismissed) {
      // Check if we've shown celebration before (use session storage)
      const celebrationShown = sessionStorage.getItem(`celebration-${primaryApp.id}`);
      if (!celebrationShown) {
        setShowCelebration(true);
        sessionStorage.setItem(`celebration-${primaryApp.id}`, 'true');
      }
    }
  }, [isApproved, primaryApp?.id, celebrationDismissed]);

  const handleDismissCelebration = () => {
    setShowCelebration(false);
    setCelebrationDismissed(true);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-20 md:pb-6">
      {/* Milestone Celebration */}
      {showCelebration && (
        <MilestoneCelebration status={primaryApp.status} onDismiss={handleDismissCelebration} />
      )}

      {/* Personalized Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome back, {studentName}! 
            {isApproved && <Sparkles className="inline h-6 w-6 ml-2 text-amber-400" />}
          </h1>
          <p className="text-muted-foreground mt-1">
            {primaryApp?.case_id ? (
              <>Application <span className="font-mono text-foreground">#{primaryApp.case_id}</span></>
            ) : (
              "Ready to start your education loan journey?"
            )}
          </p>
        </div>
        <Button onClick={onNewApplication} variant="outline" className="gap-2 shrink-0">
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">New</span> Application
        </Button>
      </header>

      {/* Action Required Alert - Full Width, Prominent */}
      {needsAction && (
        <Card className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Action Required</h3>
                  <p className="text-sm text-muted-foreground">
                    {pendingActions[0].documents_status === 'resubmission_required'
                      ? "Some documents need to be resubmitted"
                      : "Upload your documents to continue processing"}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => onSelectApplication(pendingActions[0])}
                className="gap-2 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                Upload Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Bar */}
      {hasApplications && <QuickStatsBar application={primaryApp} />}

      {/* Horizontal Journey Stepper */}
      {hasApplications && <HorizontalStepper application={primaryApp} />}

      {/* Applications List */}
      {hasApplications && (
        <section className="space-y-3 md:space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {applications.length === 1 ? "Your Application" : `All Applications`}
            {applications.length > 1 && (
              <Badge variant="secondary" className="font-normal">{applications.length}</Badge>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map((app) => (
              <StudentApplicationCard
                key={app.id}
                application={app}
                onClick={() => onSelectApplication(app)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Floating Support Button */}
      <FloatingSupportButton />
    </div>
  );
};
