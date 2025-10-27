import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Upload, Clock, CheckCircle } from "lucide-react";
import { StudentApplication } from "@/hooks/useStudentApplications";

interface RecommendedActionsProps {
  applications: StudentApplication[];
  onViewApplication: (app: StudentApplication) => void;
}

export const RecommendedActions = ({
  applications,
  onViewApplication,
}: RecommendedActionsProps) => {
  // Generate smart recommendations
  const recommendations = [];

  // Priority 1: Document uploads needed
  const pendingDocs = applications.filter(app => app.documents_status === 'pending');
  if (pendingDocs.length > 0) {
    const app = pendingDocs[0];
    recommendations.push({
      icon: Upload,
      title: `Upload documents for Application #${app.case_id}`,
      description: "Upload required documents to proceed with verification",
      action: "Upload Now",
      priority: "high",
      app,
    });
  }

  // Priority 2: Resubmissions needed
  const resubmissions = applications.filter(app => app.documents_status === 'resubmission_required');
  if (resubmissions.length > 0) {
    const app = resubmissions[0];
    recommendations.push({
      icon: Upload,
      title: `Resubmit documents for Application #${app.case_id}`,
      description: "Some documents need to be resubmitted",
      action: "Resubmit",
      priority: "high",
      app,
    });
  }

  // Priority 3: Check status of in-progress applications
  const inProgress = applications.filter(app => app.status === 'in_progress');
  if (inProgress.length > 0) {
    const app = inProgress[0];
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - new Date(app.status_updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate > 2) {
      recommendations.push({
        icon: Clock,
        title: `Check status of Application #${app.case_id}`,
        description: `Last updated ${daysSinceUpdate} days ago`,
        action: "View Status",
        priority: "medium",
        app,
      });
    }
  }

  // Priority 4: Approved applications - view offer
  const approved = applications.filter(app => app.status === 'approved');
  if (approved.length > 0) {
    const app = approved[0];
    recommendations.push({
      icon: CheckCircle,
      title: `Review your loan offer for Application #${app.case_id}`,
      description: "Your loan has been approved! Review the terms",
      action: "View Offer",
      priority: "low",
      app,
    });
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-primary" />
          Recommended Next Steps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.slice(0, 3).map((rec, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-4 rounded-lg border border-border bg-muted/30"
          >
            <div className={`p-2 rounded-lg ${
              rec.priority === 'high' ? 'bg-warning/10' :
              rec.priority === 'medium' ? 'bg-blue-50' :
              'bg-success-light'
            }`}>
              <rec.icon className={`h-5 w-5 ${
                rec.priority === 'high' ? 'text-warning' :
                rec.priority === 'medium' ? 'text-blue-600' :
                'text-success'
              }`} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">{rec.title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
              <Button
                size="sm"
                variant={rec.priority === 'high' ? 'default' : 'outline'}
                onClick={() => rec.app && onViewApplication(rec.app)}
              >
                {rec.action} →
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
