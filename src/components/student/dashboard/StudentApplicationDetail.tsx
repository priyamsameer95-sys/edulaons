import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/lead-status/StatusBadge';
import { ArrowLeft, MapPin, Calendar, DollarSign, BookOpen, User, Users } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { StatusTimeline } from '@/components/student/StatusTimeline';

interface Application {
  id: string;
  case_id: string;
  status: any;
  documents_status: any;
  loan_amount: number;
  loan_type: string;
  study_destination: string;
  intake_month?: number;
  intake_year?: number;
  created_at: string;
  student_name?: string;
  student_email?: string;
  university_name?: string;
  course_name?: string;
  co_applicant_name?: string;
  co_applicant_relationship?: string;
}

interface StudentApplicationDetailProps {
  application: Application;
  onBack: () => void;
}

export const StudentApplicationDetail = ({ application, onBack }: StudentApplicationDetailProps) => {
  const intakeDate = application.intake_month && application.intake_year 
    ? `${application.intake_month}/${application.intake_year}` 
    : 'TBD';

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Applications
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>{application.case_id}</CardDescription>
              </div>
              <StatusBadge status={application.status} type="lead" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Status timeline will appear here</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Upload Documents
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Track Status
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Loan Amount</p>
                <p className="font-semibold">{formatCurrency(application.loan_amount)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Loan Type</p>
                <p className="font-semibold capitalize">{application.loan_type}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Destination</p>
                <p className="font-semibold">{application.study_destination}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Intake</p>
                <p className="font-semibold">{intakeDate}</p>
              </div>
            </div>
          </div>

          <Separator />

          {application.university_name && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">University</p>
              <p className="font-semibold">{application.university_name}</p>
            </div>
          )}

          {application.course_name && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Course</p>
              <p className="font-semibold">{application.course_name}</p>
            </div>
          )}

          {application.co_applicant_name && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Co-Applicant</p>
              <p className="font-semibold">
                {application.co_applicant_name}
                {application.co_applicant_relationship && ` (${application.co_applicant_relationship})`}
              </p>
            </div>
          )}

          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              Application created on {formatDate(application.created_at, 'long')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
