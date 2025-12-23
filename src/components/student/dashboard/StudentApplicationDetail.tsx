import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusTimeline } from "@/components/student/StatusTimeline";
import { SmartDocumentUpload } from "@/components/upload/SmartDocumentUpload";
import { formatCurrency } from "@/utils/formatters";
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  DollarSign, 
  MapPin, 
  User 
} from "lucide-react";
import type { StudentApplication } from "@/hooks/useStudentApplications";

interface StudentApplicationDetailProps {
  application: StudentApplication;
  onBack: () => void;
}

export const StudentApplicationDetail = ({ application, onBack }: StudentApplicationDetailProps) => {
  const needsAction = application.documents_status === 'pending' || application.documents_status === 'resubmission_required';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600" />;
      default: return <FileText className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'resubmission_required': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'uploaded': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Applications
      </Button>

      {/* Status Banner */}
      <Card className={`border-l-4 bg-card ${
        application.status === 'approved' ? 'border-l-emerald-500' :
        application.status === 'rejected' ? 'border-l-red-500' :
        needsAction ? 'border-l-amber-500' :
        'border-l-blue-500'
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Application #{application.case_id}
              </h1>
              <p className="text-muted-foreground text-lg">
                {application.status === 'approved' && '🎉 Congratulations! Your loan is approved'}
                {application.status === 'rejected' && 'Your application needs attention'}
                {needsAction && '📄 Action Required: Upload your documents to proceed'}
                {!needsAction && application.status === 'in_progress' && 'Your application is under review'}
                {!needsAction && application.status === 'new' && 'Application submitted successfully'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-1">
                {formatCurrency(application.loan_amount)}
              </div>
              <div className="text-sm text-muted-foreground">Loan Amount</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={
              application.status === 'approved' ? 'default' :
              application.status === 'rejected' ? 'destructive' :
              'secondary'
            }>
              {getStatusIcon(application.status)}
              <span className="ml-1 capitalize">{application.status.replace('_', ' ')}</span>
            </Badge>
            <Badge variant="outline" className={getDocumentStatusColor(application.documents_status)}>
              <FileText className="h-4 w-4 mr-1" />
              Docs: {application.documents_status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Smart Document Upload with AI Classification */}
      <SmartDocumentUpload leadId={application.id} />

      {/* Status Timeline */}
      <StatusTimeline
        status={application.status}
        documentsStatus={application.documents_status}
        createdAt={application.created_at}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loan Details */}
        <Card className="bg-card border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <DollarSign className="h-5 w-5" />
              Loan Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Amount Requested</p>
              <p className="font-semibold text-lg text-foreground">
                {formatCurrency(application.loan_amount)}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Loan Type</p>
              <p className="font-medium text-foreground capitalize">{application.loan_type}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Assigned Lender</p>
              <p className="font-medium text-foreground">{application.lender.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Study Details */}
        <Card className="bg-card border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <MapPin className="h-5 w-5" />
              Study Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Study Destination</p>
              <p className="font-semibold text-lg text-foreground">
                {application.study_destination}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Intake</p>
              <p className="font-medium text-foreground">
                {new Date(application.intake_year, application.intake_month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <Separator />
            {application.universities && application.universities.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Selected Universities</p>
                <div className="space-y-1">
                  {application.universities.map(uni => (
                    <p key={uni.id} className="font-medium text-sm text-foreground">
                      📍 {uni.name}, {uni.city}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Info */}
        <Card className="bg-card border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium text-foreground">{application.student.name}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-sm text-foreground">{application.student.email}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium text-foreground">{application.student.phone}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
