import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStudentApplications } from "@/hooks/useStudentApplications";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StudentApplicationFlow from "@/components/student/StudentApplicationFlow";
import { GraduationCap, FileText, CheckCircle2, Clock, Loader2, XCircle, AlertCircle, Upload, Eye, Calendar, DollarSign, MapPin, User, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusTimeline } from "@/components/student/StatusTimeline";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Applications</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetch}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasApplications) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <StudentApplicationFlow />
        </div>
      </div>
    );
  }

  // If an application is selected, show detail view
  if (selectedApplication) {
    const progress = calculateProgress(selectedApplication.status, selectedApplication.documents_status);
    const needsAction = selectedApplication.documents_status === 'pending' || selectedApplication.documents_status === 'resubmission_required';
    
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedApplication(null)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>

        {/* Status Banner */}
        <Card className={`border-l-4 ${
          selectedApplication.status === 'approved' ? 'border-l-green-500 bg-green-50/5' :
          selectedApplication.status === 'rejected' ? 'border-l-red-500 bg-red-50/5' :
          needsAction ? 'border-l-orange-500 bg-orange-50/5' :
          'border-l-blue-500 bg-blue-50/5'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Application #{selectedApplication.case_id}</h2>
                <p className="text-muted-foreground text-lg">
                  {selectedApplication.status === 'approved' && '🎉 Congratulations! Your loan is approved'}
                  {selectedApplication.status === 'rejected' && 'Your application needs attention'}
                  {needsAction && '📄 Action Required: Upload your documents to proceed'}
                  {!needsAction && selectedApplication.status === 'in_progress' && 'Your application is under review'}
                  {!needsAction && selectedApplication.status === 'new' && 'Application submitted successfully'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary mb-1">
                  {formatCurrency(selectedApplication.loan_amount)}
                </div>
                <div className="text-sm text-muted-foreground">Loan Amount</div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={
                selectedApplication.status === 'approved' ? 'default' :
                selectedApplication.status === 'rejected' ? 'destructive' :
                'secondary'
              }>
                {getStatusIcon(selectedApplication.status)}
                <span className="ml-1 capitalize">{selectedApplication.status.replace('_', ' ')}</span>
              </Badge>
              <Badge variant="outline" className={getDocumentStatusColor(selectedApplication.documents_status)}>
                <FileText className="h-4 w-4 mr-1" />
                Docs: {selectedApplication.documents_status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">How far you've come!</h3>
                  <span className="text-2xl font-bold text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {progress < 25 && "Great start! Let's upload your documents"}
                  {progress >= 25 && progress < 50 && "You're making good progress! 🚀"}
                  {progress >= 50 && progress < 75 && "You're halfway there! Keep going 🎉"}
                  {progress >= 75 && progress < 100 && "Almost done! Just waiting on final review"}
                  {progress === 100 && "Success! Your education dreams are one step closer 🎓"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {needsAction && (
                  <Button className="w-full" onClick={() => navigate(`/student/documents/${selectedApplication.id}`)}>
                    <Upload className="h-4 w-4 mr-2" />
                    {selectedApplication.documents_status === 'pending' ? 'Upload Documents' : 'Resubmit Documents'}
                  </Button>
                )}
                <Button className="w-full" variant="outline" onClick={() => navigate(`/student/status/${selectedApplication.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Track Application Status
                </Button>
                {selectedApplication.status === 'approved' && (
                  <Button className="w-full" variant="default">
                    <FileText className="h-4 w-4 mr-2" />
                    View Offer Letter
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Timeline */}
        <StatusTimeline
          status={selectedApplication.status}
          documentsStatus={selectedApplication.documents_status}
          createdAt={selectedApplication.created_at}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loan Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Loan Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Amount Requested</p>
                <p className="font-semibold text-lg">{formatCurrency(selectedApplication.loan_amount)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Loan Type</p>
                <p className="font-medium capitalize">{selectedApplication.loan_type}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Assigned Lender</p>
                <p className="font-medium">{selectedApplication.lender.name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Study Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Study Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Study Destination</p>
                <p className="font-semibold text-lg">{selectedApplication.study_destination}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Intake</p>
                <p className="font-medium">
                  {new Date(selectedApplication.intake_year, selectedApplication.intake_month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <Separator />
              {selectedApplication.universities && selectedApplication.universities.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Selected Universities</p>
                  <div className="space-y-1">
                    {selectedApplication.universities.map(uni => (
                      <p key={uni.id} className="font-medium text-sm">
                        📍 {uni.name}, {uni.city}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{selectedApplication.student.name}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-sm">{selectedApplication.student.email}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{selectedApplication.student.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Co-Borrower Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Co-Borrower (usually a parent)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{selectedApplication.co_applicant.name}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Relationship</p>
                <p className="font-medium capitalize">{selectedApplication.co_applicant.relationship}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Annual Income</p>
                <p className="font-medium">{formatCurrency(selectedApplication.co_applicant.salary)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show list of applications
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Applications</h1>
          <p className="text-muted-foreground">Track and manage your education loan applications</p>
        </div>
        <Button onClick={() => setShowApplicationForm(true)} size="lg">
          <FileText className="mr-2 h-4 w-4" />
          Start New Application
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {applications.map((app) => {
          const progress = calculateProgress(app.status, app.documents_status);
          const needsAction = app.documents_status === 'pending' || app.documents_status === 'resubmission_required';
          
          return (
            <Card 
              key={app.id} 
              className={`cursor-pointer hover:shadow-lg transition-all ${needsAction ? 'border-primary border-2' : ''}`}
              onClick={() => setSelectedApplication(app)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">Application #{app.case_id}</CardTitle>
                    <CardDescription className="text-xs">
                      Started {new Date(app.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric' 
                      })}
                    </CardDescription>
                  </div>
                  {needsAction && (
                    <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                      Action Needed
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge variant={
                    app.status === 'approved' ? 'default' :
                    app.status === 'rejected' ? 'destructive' :
                    'secondary'
                  }>
                    {getStatusIcon(app.status)}
                    <span className="ml-1 capitalize">
                      {app.status === 'in_progress' ? 'Under Review' : app.status.replace('_', ' ')}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion</span>
                    <span className="text-sm font-semibold text-primary">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {progress < 50 ? 'Keep going! You got this 💪' : progress < 100 ? 'Almost there! 🚀' : 'Complete! 🎉'}
                  </p>
                </div>

                {/* Key Details */}
                <div className="space-y-2 text-sm pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Loan Amount
                    </span>
                    <span className="font-semibold">{formatCurrency(app.loan_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Destination
                    </span>
                    <span className="font-semibold">{app.study_destination}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Intake
                    </span>
                    <span className="font-semibold">
                      {new Date(2000, app.intake_month - 1).toLocaleString('default', { month: 'short' })} {app.intake_year}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documents
                    </span>
                    <Badge 
                      variant="outline" 
                      className={getDocumentStatusColor(app.documents_status)}
                    >
                      {app.documents_status === 'pending' ? 'Not Started' : 
                       app.documents_status === 'uploaded' ? 'Under Review' :
                       app.documents_status === 'verified' ? 'Verified ✓' :
                       app.documents_status === 'resubmission_required' ? 'Resubmit' : 
                       app.documents_status}
                    </Badge>
                  </div>
                </div>

                {/* Action Hint */}
                {needsAction && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-orange-600 font-medium">
                      👉 {app.documents_status === 'pending' ? 'Upload documents to move forward' : 'Resubmit required documents'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StudentDashboard;
