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
    <Card className="border-l-2 border-l-amber-500 bg-amber-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
              Action Required
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {pendingActions.length} application{pendingActions.length > 1 ? 's need' : ' needs'} your attention
            </p>
            {(pendingUploads.length > 0 || resubmissions.length > 0) && (
              <ul className="space-y-1 mb-3 text-sm text-foreground list-disc list-inside">
                {pendingUploads.length > 0 && (
                  <li>
                    <strong>{pendingUploads.length}</strong> application{pendingUploads.length > 1 ? 's' : ''} waiting for document upload
                  </li>
                )}
                {resubmissions.length > 0 && (
                  <li>
                    <strong>{resubmissions.length}</strong> document{resubmissions.length > 1 ? 's need' : ' needs'} resubmission
                  </li>
                )}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              {pendingActions.slice(0, 3).map(app => (
                <Button
                  key={app.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onViewApplication(app)}
                  className="border-amber-200 hover:bg-amber-100 text-foreground"
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
