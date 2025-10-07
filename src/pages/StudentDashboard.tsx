import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStudentApplications } from "@/hooks/useStudentApplications";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StudentApplicationFlow from "@/components/student/StudentApplicationFlow";
import { GraduationCap, FileText, CheckCircle2, Clock, Loader2, XCircle, AlertCircle, Upload, Eye, Calendar, DollarSign, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/utils/formatters";
import type { StudentApplication } from "@/hooks/useStudentApplications";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { applications, loading, error, refetch } = useStudentApplications();
  const [selectedApplication, setSelectedApplication] = useState<StudentApplication | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const hasApplications = applications.length > 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600" />;
      default: return <FileText className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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

  const calculateProgress = (status: string, docStatus: string) => {
    if (status === 'approved') return 100;
    if (status === 'rejected') return 100;
    if (docStatus === 'verified') return 75;
    if (docStatus === 'uploaded') return 50;
    return 25;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-semibold">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (showApplicationForm) {
    return <StudentApplicationFlow />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <EmptyState
          icon={AlertCircle}
          title="Error Loading Applications"
          description={error}
          action={{
            label: "Try Again",
            onClick: refetch,
          }}
        />
      </div>
    );
  }

  if (!hasApplications) {
    return (
      <div className="container mx-auto py-12 px-4">
        <EmptyState
          icon={GraduationCap}
          title="No Applications Yet"
          description="Start your education loan journey by submitting your first application"
          action={{
            label: "Start New Application",
            onClick: () => setShowApplicationForm(true),
          }}
        />
      </div>
    );
  }

  // If an application is selected, show detail view
  if (selectedApplication) {
    const progress = calculateProgress(selectedApplication.status, selectedApplication.documents_status);
    
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedApplication(null)}
          className="mb-6"
        >
          ← Back to Applications
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">Application Details</CardTitle>
                <CardDescription>Case ID: {selectedApplication.case_id}</CardDescription>
              </div>
              <Badge className={getStatusColor(selectedApplication.status)}>
                {selectedApplication.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Application Progress</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <Separator />

            {/* Loan Details */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Loan Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Loan Amount</p>
                  <p className="font-medium">{formatCurrency(selectedApplication.loan_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loan Type</p>
                  <p className="font-medium capitalize">{selectedApplication.loan_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lender</p>
                  <p className="font-medium">{selectedApplication.lender.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Documents Status</p>
                  <Badge className={getDocumentStatusColor(selectedApplication.documents_status)}>
                    {selectedApplication.documents_status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Study Details */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Study Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <p className="font-medium">{selectedApplication.study_destination}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Intake</p>
                  <p className="font-medium">
                    {new Date(selectedApplication.intake_year, selectedApplication.intake_month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {selectedApplication.universities && selectedApplication.universities.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Universities</p>
                    <div className="space-y-1">
                      {selectedApplication.universities.map(uni => (
                        <p key={uni.id} className="font-medium text-sm">
                          {uni.name}, {uni.city}, {uni.country}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Student & Co-Applicant */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Applicant Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium mb-2">Student</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {selectedApplication.student.name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {selectedApplication.student.email}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {selectedApplication.student.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Co-Applicant</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {selectedApplication.co_applicant.name}</p>
                    <p><span className="text-muted-foreground">Relationship:</span> {selectedApplication.co_applicant.relationship}</p>
                    <p><span className="text-muted-foreground">Salary:</span> {formatCurrency(selectedApplication.co_applicant.salary)}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-4">
              <Button className="flex-1" onClick={() => navigate(`/student/documents/${selectedApplication.id}`)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate(`/student/status/${selectedApplication.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Track Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show list of applications
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Applications</h1>
          <p className="text-muted-foreground">View and manage your education loan applications</p>
        </div>
        <Button onClick={() => setShowApplicationForm(true)}>
          <FileText className="mr-2 h-4 w-4" />
          New Application
        </Button>
      </div>

      <div className="grid gap-6">
        {applications.map((app) => {
          const progress = calculateProgress(app.status, app.documents_status);
          
          return (
            <Card 
              key={app.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedApplication(app)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(app.status)}
                      Case ID: {app.case_id}
                    </CardTitle>
                    <CardDescription>
                      Applied on {new Date(app.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(app.status)}>
                    {app.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Key Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
                    <p className="font-semibold text-sm">{formatCurrency(app.loan_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Destination</p>
                    <p className="font-semibold text-sm">{app.study_destination}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Lender</p>
                    <p className="font-semibold text-sm">{app.lender.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Documents</p>
                    <Badge variant="outline" className={getDocumentStatusColor(app.documents_status)}>
                      {app.documents_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StudentDashboard;
