import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Upload, FileWarning } from "lucide-react";
import { StudentApplication } from "@/hooks/useStudentApplications";

interface ActionRequiredBannerProps {
  pendingActions: StudentApplication[];
  onViewApplication: (app: StudentApplication) => void;
}

export const ActionRequiredBanner = ({
  pendingActions,
  onViewApplication,
}: ActionRequiredBannerProps) => {
  if (pendingActions.length === 0) return null;

  const pendingUploads = pendingActions.filter(app => app.documents_status === 'pending');
  const resubmissions = pendingActions.filter(app => app.documents_status === 'resubmission_required');

  return (
    <Card className="border-l-4 border-l-warning bg-warning-light/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-warning/10">
            <AlertCircle className="h-6 w-6 text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Action Required
            </h3>
            <p className="text-muted-foreground mb-4">
              {pendingActions.length} application{pendingActions.length > 1 ? 's need' : ' needs'} your attention
            </p>
            <div className="space-y-2">
              {pendingUploads.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Upload className="h-4 w-4 text-warning" />
                  <span className="text-foreground">
                    <strong>{pendingUploads.length}</strong> application{pendingUploads.length > 1 ? 's' : ''} waiting for document upload
                  </span>
                </div>
              )}
              {resubmissions.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <FileWarning className="h-4 w-4 text-warning" />
                  <span className="text-foreground">
                    <strong>{resubmissions.length}</strong> document{resubmissions.length > 1 ? 's need' : ' needs'} resubmission
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {pendingActions.slice(0, 3).map(app => (
                <Button
                  key={app.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onViewApplication(app)}
                  className="border-warning/20 hover:bg-warning/10"
                >
                  View #{app.case_id}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
