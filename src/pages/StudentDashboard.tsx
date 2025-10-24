import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStudentApplications } from "@/hooks/useStudentApplications";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StudentApplicationFlow from "@/components/student/StudentApplicationFlow";
import { EnhancedEmptyState } from "@/components/ui/enhanced-empty-state";
import { GraduationCap, FileText, CheckCircle2, Clock, Loader2, XCircle, AlertCircle, Upload, Eye, Calendar, DollarSign, MapPin, User, ArrowLeft, LogOut, BookOpen, Award, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusTimeline } from "@/components/student/StatusTimeline";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/formatters";
import type { StudentApplication } from "@/hooks/useStudentApplications";
import { StudentApplicationCard } from "@/components/student/dashboard/StudentApplicationCard";
import { cn } from "@/lib/utils";

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
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
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
    );
  }

  if (showApplicationForm) {
    return <StudentApplicationFlow />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <EnhancedEmptyState
          variant="error"
          icon={AlertCircle}
          title="Oops! Something went wrong"
          description={error}
          supportingText="Don't worry, your data is safe. This is usually a temporary issue."
          primaryAction={{
            label: "Try Again",
            onClick: refetch,
            icon: Loader2
          }}
          secondaryAction={{
            label: "Sign Out & Login Again",
            onClick: async () => {
              await signOut();
              navigate('/login');
            },
            variant: 'outline'
          }}
        />
      </div>
    );
  }

  if (!hasApplications) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          {/* Header with logout */}
          <div className="flex justify-end mb-8">
            <Button variant="outline" onClick={async () => {
              await signOut();
              navigate('/login');
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Floating background icons */}
          <div className="relative mb-12">
            <GraduationCap className="absolute top-10 left-10 w-12 h-12 text-primary/10 animate-gentle-pulse" />
            <BookOpen className="absolute top-20 right-20 w-10 h-10 text-primary/10 animate-gentle-pulse" style={{ animationDelay: '0.5s' }} />
            <Award className="absolute bottom-10 left-1/4 w-8 h-8 text-primary/10 animate-gentle-pulse" style={{ animationDelay: '1s' }} />

            {/* Stats banner */}
            <div className="premium-card rounded-2xl p-8 mb-8 animate-fade-in border-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="stagger-fade-1">
                  <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-4xl font-bold animate-shimmer bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    10,000+
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Students Funded</div>
                </div>
                <div className="stagger-fade-2">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-4xl font-bold animate-shimmer bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    ₹500Cr+
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Loans Disbursed</div>
                </div>
                <div className="stagger-fade-3">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-4xl font-bold animate-shimmer bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    95%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Approval Rate</div>
                </div>
              </div>
            </div>

            {/* Welcome Section */}
            <EnhancedEmptyState
              variant="welcome"
              icon={GraduationCap}
              title="Welcome to Your Education Loan Journey! 🎓"
              description="You're just a few steps away from securing funding for your dream university."
              supportingText="Our streamlined application process takes only 10-15 minutes to complete."
              primaryAction={{
                label: "Start Your Application",
                onClick: () => setShowApplicationForm(true),
                icon: FileText
              }}
              features={[
                { icon: CheckCircle2, text: "Quick 5-step application" },
                { icon: Clock, text: "Fast approval process" },
                { icon: User, text: "Multiple lender options" },
                { icon: Upload, text: "Secure document upload" }
              ]}
            />
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Gradient Hero Header */}
        <div className="relative bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground rounded-2xl p-8 mb-8 overflow-hidden animate-fade-in shadow-lg">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-gentle-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-gentle-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Welcome back! 👋
                </h1>
                <p className="text-primary-foreground/90 text-base md:text-lg">
                  {applications.length === 1 && "You have 1 application in progress"}
                  {applications.length > 1 && `You have ${applications.length} applications - you're making great progress! 🚀`}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={() => setShowApplicationForm(true)} 
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-lg hover-lift"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Start New Application
                </Button>
                <Button 
                  onClick={async () => {
                    await signOut();
                    navigate('/login');
                  }} 
                  variant="outline" 
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Grid with Stagger Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {applications.map((app, index) => (
            <div 
              key={app.id}
              className={cn(
                index === 0 && "stagger-fade-1",
                index === 1 && "stagger-fade-2",
                index === 2 && "stagger-fade-3",
                index === 3 && "stagger-fade-4",
                index === 4 && "stagger-fade-5",
                index === 5 && "stagger-fade-6"
              )}
            >
              <StudentApplicationCard
                application={app}
                onClick={() => setSelectedApplication(app)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
