import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStudentApplications } from "@/hooks/useStudentApplications";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StudentApplicationFlow from "@/components/student/StudentApplicationFlow";
import { FileText, CheckCircle2, Clock, XCircle, AlertCircle, Upload, Eye, DollarSign, MapPin, User, ArrowLeft, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusTimeline } from "@/components/student/StatusTimeline";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/utils/formatters";
import type { StudentApplication } from "@/hooks/useStudentApplications";
import { StudentApplicationCard } from "@/components/student/dashboard/StudentApplicationCard";
import { StudentLayout } from "@/components/student/layout/StudentLayout";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionRequiredBanner } from "@/components/student/dashboard/ActionRequiredBanner";
import { ImprovedEmptyState } from "@/components/student/dashboard/ImprovedEmptyState";
import { SupportButton } from "@/components/student/dashboard/SupportButton";
import { updateMetaTags, pageSEO } from "@/utils/seo";

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { applications, loading, error, refetch } = useStudentApplications();
  const [selectedApplication, setSelectedApplication] = useState<StudentApplication | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const hasApplications = applications.length > 0;
  const pendingActions = applications.filter(
    app => app.documents_status === 'pending' || app.documents_status === 'resubmission_required'
  );

  // Update meta tags for SEO
  useEffect(() => {
    updateMetaTags(pageSEO.studentDashboard);
  }, []);

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

  if (loading) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <Skeleton className="h-28 w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-card border border-border rounded-xl">
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
        <ImprovedEmptyState onStartApplication={() => setShowApplicationForm(true)} />
      </StudentLayout>
    );
  }

  // If an application is selected, show detail view
  if (selectedApplication) {
    const needsAction = selectedApplication.documents_status === 'pending' || selectedApplication.documents_status === 'resubmission_required';
    
    return (
      <StudentLayout>
        <div className="space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedApplication(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>

          {/* Status Banner */}
          <Card className={`border-l-4 bg-card ${
            selectedApplication.status === 'approved' ? 'border-l-emerald-500' :
            selectedApplication.status === 'rejected' ? 'border-l-red-500' :
            needsAction ? 'border-l-amber-500' :
            'border-l-blue-500'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">Application #{selectedApplication.case_id}</h1>
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

          {/* Action Buttons */}
          {needsAction && (
            <div className="flex gap-3">
              <Button className="flex-1" size="lg" onClick={() => navigate(`/student/documents/${selectedApplication.id}`)}>
                <Upload className="h-5 w-5 mr-2" />
                {selectedApplication.documents_status === 'pending' ? 'Upload Documents' : 'Resubmit Documents'}
              </Button>
            </div>
          )}

          {/* Status Timeline */}
          <StatusTimeline
            status={selectedApplication.status}
            documentsStatus={selectedApplication.documents_status}
            createdAt={selectedApplication.created_at}
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
                  <p className="font-semibold text-lg text-foreground">{formatCurrency(selectedApplication.loan_amount)}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Loan Type</p>
                  <p className="font-medium text-foreground capitalize">{selectedApplication.loan_type}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Lender</p>
                  <p className="font-medium text-foreground">{selectedApplication.lender.name}</p>
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
                  <p className="font-semibold text-lg text-foreground">{selectedApplication.study_destination}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Intake</p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedApplication.intake_year, selectedApplication.intake_month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <Separator />
                {selectedApplication.universities && selectedApplication.universities.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Selected Universities</p>
                    <div className="space-y-1">
                      {selectedApplication.universities.map(uni => (
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
                  <p className="font-medium text-foreground">{selectedApplication.student.name}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm text-foreground">{selectedApplication.student.email}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{selectedApplication.student.phone}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Main dashboard view - Simple list
  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <header className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">My Applications</h1>
              <p className="text-muted-foreground text-sm">
                Track your education loan applications
              </p>
            </div>
            {applications.length > 0 && (
              <Button 
                size="lg" 
                onClick={() => setShowApplicationForm(true)}
                className="h-11 px-6"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                New Application
              </Button>
            )}
          </div>
        </header>

        {/* Applications List */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              {applications.length === 1 ? 'Your Application' : `All Applications (${applications.length})`}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {applications.map((app) => (
                <StudentApplicationCard
                  key={app.id}
                  application={app}
                  onClick={() => setSelectedApplication(app)}
                />
              ))}
            </div>
          </div>
          <div>
            <SupportButton />
          </div>
        </section>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
