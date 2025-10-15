import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/lead-status/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { MapPin, Calendar, FileText } from 'lucide-react';

interface Application {
  id: string;
  case_id: string;
  status: any;
  documents_status: any;
  loan_amount: number;
  study_destination: string;
  intake_month?: number;
  intake_year?: number;
  created_at: string;
}

interface StudentApplicationCardProps {
  application: Application;
  onClick: () => void;
}

export const StudentApplicationCard = ({ application, onClick }: StudentApplicationCardProps) => {
  // Calculate progress based on status
  const getProgress = (status: string) => {
    const statusMap: Record<string, number> = {
      new: 20,
      contacted: 30,
      in_progress: 50,
      document_review: 70,
      approved: 90,
      rejected: 100,
      withdrawn: 100,
    };
    return statusMap[status] || 20;
  };

  const progress = getProgress(application.status);
  const intakeDate = application.intake_month && application.intake_year 
    ? `${application.intake_month}/${application.intake_year}` 
    : 'TBD';

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]" onClick={onClick}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{application.case_id}</CardTitle>
          <StatusBadge status={application.status} type="lead" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Loan Amount</span>
            <span className="font-semibold">{formatCurrency(application.loan_amount)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Destination
            </span>
            <span>{application.study_destination}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Intake
            </span>
            <span>{intakeDate}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Documents
            </span>
            <StatusBadge status={application.documents_status} type="document" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <p className="text-xs text-muted-foreground">
          Created {formatDate(application.created_at)}
        </p>
      </CardContent>
    </Card>
  );
};
