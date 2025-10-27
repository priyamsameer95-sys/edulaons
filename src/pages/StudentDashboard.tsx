import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStudentApplications } from "@/hooks/useStudentApplications";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StudentApplicationFlow from "@/components/student/StudentApplicationFlow";
import { GraduationCap, FileText, CheckCircle2, Clock, XCircle, AlertCircle, Upload, Eye, Calendar, DollarSign, MapPin, User, ArrowLeft, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusTimeline } from "@/components/student/StatusTimeline";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/formatters";
import type { StudentApplication } from "@/hooks/useStudentApplications";
import { StudentApplicationCard } from "@/components/student/dashboard/StudentApplicationCard";
import { StudentLayout } from "@/components/student/layout/StudentLayout";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
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
      <StudentLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (showApplicationForm) {
    return <StudentApplicationFlow />;
  }

  if (error) {
    return (
      <StudentLayout>
        <EmptyState
          icon={AlertCircle}
          title="Something went wrong"
          description={error || "We couldn't load your applications. Please try again."}
          action={{
            label: "Try Again",
            onClick: refetch,
          }}
        />
      </StudentLayout>
    );
  }

  if (!hasApplications) {
    return (
      <StudentLayout>
        <EmptyState
          icon={GraduationCap}
          title="Start Your Education Loan Journey"
          description="You haven't started any applications yet. Begin your journey to securing funding for your dream university."
          action={{
            label: "Start New Application",
            onClick: () => setShowApplicationForm(true),
          }}
        />
      </StudentLayout>
    );
  }

  // If an application is selected, show detail view
  if (selectedApplication) {
    const progress = calculateProgress(selectedApplication.status, selectedApplication.documents_status);
    const needsAction = selectedApplication.documents_status === 'pending' || selectedApplication.documents_status === 'resubmission_required';
    
    return (
      <StudentLayout>
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/student">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Application #{selectedApplication.case_id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedApplication(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>

          {/* Status Banner */}
          <Card className={`border-l-4 bg-white ${
            selectedApplication.status === 'approved' ? 'border-l-green-500' :
            selectedApplication.status === 'rejected' ? 'border-l-red-500' :
            needsAction ? 'border-l-orange-500' :
            'border-l-blue-500'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Application #{selectedApplication.case_id}</h2>
                  <p className="text-gray-600 text-lg">
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
                  <div className="text-sm text-gray-500">Loan Amount</div>
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
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
                    <span className="text-2xl font-bold text-primary">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-gray-600">
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
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {needsAction && (
                    <Button className="w-full" onClick={() => navigate(`/student/documents/${selectedApplication.id}`)}>
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedApplication.documents_status === 'pending' ? 'Upload Documents' : 'Resubmit Documents'}
                    </Button>
                  )}
                  <Button className="w-full" variant="outline">
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
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <DollarSign className="h-5 w-5" />
                  Loan Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Amount Requested</p>
                  <p className="font-semibold text-lg text-gray-900">{formatCurrency(selectedApplication.loan_amount)}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600">Loan Type</p>
                  <p className="font-medium text-gray-900 capitalize">{selectedApplication.loan_type}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600">Assigned Lender</p>
                  <p className="font-medium text-gray-900">{selectedApplication.lender.name}</p>
                </div>
              </CardContent>
            </Card>

            {/* Study Details */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <MapPin className="h-5 w-5" />
                  Study Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Study Destination</p>
                  <p className="font-semibold text-lg text-gray-900">{selectedApplication.study_destination}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600">Intake</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedApplication.intake_year, selectedApplication.intake_month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <Separator />
                {selectedApplication.universities && selectedApplication.universities.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Selected Universities</p>
                    <div className="space-y-1">
                      {selectedApplication.universities.map(uni => (
                        <p key={uni.id} className="font-medium text-sm text-gray-900">
                          📍 {uni.name}, {uni.city}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Student Info */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <User className="h-5 w-5" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{selectedApplication.student.name}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-sm text-gray-900">{selectedApplication.student.email}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{selectedApplication.student.phone}</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </StudentLayout>
    );
  }

  // Main dashboard view - list all applications
  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
              <p className="text-gray-600 mt-1">
                Track and manage your education loan applications
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={() => setShowApplicationForm(true)}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              New Application
            </Button>
          </div>
        </div>

        {/* Applications Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Applications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => (
              <StudentApplicationCard
                key={app.id}
                application={app}
                onClick={() => setSelectedApplication(app)}
              />
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
