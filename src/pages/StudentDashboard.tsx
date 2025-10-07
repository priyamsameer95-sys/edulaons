import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import StudentApplicationFlow from '@/components/student/StudentApplicationFlow';
import { Loader2, FileText, CheckCircle2, Clock, XCircle, GraduationCap, FileCheck, TrendingUp, ArrowRight, Upload, Eye, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const StudentDashboard = () => {
  const { signOut, appUser, user } = useAuth();
  const navigate = useNavigate();
  const [hasApplication, setHasApplication] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applicationData, setApplicationData] = useState<any>(null);

  useEffect(() => {
    // Type check disabled temporarily until migration completes
    setLoading(false);
    // TODO: Re-enable after migration completes and types regenerate
    // const userId = user?.id;
    // if (!userId) {
    //   setLoading(false);
    //   return;
    // }
    // Check for existing application here
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-5 w-5" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'approved':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'rejected':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const calculateProgress = () => {
    if (!hasApplication) return 0;
    if (!applicationData) return 25;
    if (applicationData.status === 'approved') return 100;
    if (applicationData.documents_status === 'verified') return 75;
    if (applicationData.documents_status === 'uploaded') return 50;
    return 25;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-primary/10">
      {/* Modern Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-gradient-primary">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Student Portal
              </h1>
              <p className="text-sm text-muted-foreground">
                Hey {appUser?.email?.split('@')[0]}! 👋
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="rounded-full">
            Sign Out
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 max-w-7xl">
        {!hasApplication ? (
          <div className="space-y-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-hover to-primary shadow-lg">
              <div className="absolute inset-0 bg-grid-white/10"></div>
              <div className="relative px-8 py-12 md:px-12 md:py-16">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/20 backdrop-blur-sm mb-6">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground"></span>
                    </span>
                    <span className="text-sm font-medium text-primary-foreground">Get Started Today</span>
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4 leading-tight">
                    Your Dream University Awaits
                  </h2>
                  <p className="text-lg text-primary-foreground/90 mb-8 leading-relaxed">
                    Take the first step towards your international education journey. Our streamlined application process makes getting your education loan simple and stress-free.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 mb-8">
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
                      <div className="p-2 rounded-xl bg-primary-foreground/20">
                        <Clock className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary-foreground">Quick Apply</p>
                        <p className="text-xs text-primary-foreground/80">Just 5-10 minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
                      <div className="p-2 rounded-xl bg-primary-foreground/20">
                        <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary-foreground">Fast Approval</p>
                        <p className="text-xs text-primary-foreground/80">Within 48 hours</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
                      <div className="p-2 rounded-xl bg-primary-foreground/20">
                        <TrendingUp className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary-foreground">Best Rates</p>
                        <p className="text-xs text-primary-foreground/80">Competitive offers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Flow */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Complete Your Application</CardTitle>
                <CardDescription className="text-base">
                  Follow these simple steps to apply for your education loan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentApplicationFlow />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Progress Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent to-secondary shadow-lg border border-primary/20">
              <div className="absolute inset-0 bg-grid-foreground/5"></div>
              <div className="relative px-8 py-10 md:px-12">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-4 gap-2 px-4 py-1.5 bg-card/50 backdrop-blur-sm">
                      {getStatusIcon(applicationData?.status)}
                      <span className="capitalize font-semibold text-base">
                        {applicationData?.status?.replace('_', ' ')}
                      </span>
                    </Badge>
                    
                    <h2 className="text-3xl md:text-4xl font-bold mb-2">
                      {applicationData?.status === 'approved' && '🎉 Congratulations!'}
                      {applicationData?.status === 'in_progress' && '⚡ Application Processing'}
                      {applicationData?.status === 'new' && '✨ Application Received'}
                      {applicationData?.status === 'rejected' && 'Application Update'}
                    </h2>
                    <p className="text-muted-foreground text-lg mb-1">
                      Case ID: <span className="font-mono font-semibold text-foreground">{applicationData?.case_id}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {applicationData?.status === 'new' && 'Your application is under review by our team'}
                      {applicationData?.status === 'in_progress' && 'We\'re working on your application'}
                      {applicationData?.status === 'approved' && 'Your loan has been approved!'}
                      {applicationData?.status === 'rejected' && 'We\'ll help you explore other options'}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <div className="relative w-32 h-32">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                          className="text-primary transition-all duration-1000 ease-out"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-primary">{progress}%</p>
                          <p className="text-xs text-muted-foreground">Complete</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-success/20 to-success/10">
                      <FileText className="h-6 w-6 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Loan Amount</p>
                      <p className="text-2xl font-bold">₹{applicationData?.loan_amount?.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Destination</p>
                      <p className="text-2xl font-bold capitalize">{applicationData?.study_destination}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/10">
                      <FileCheck className="h-6 w-6 text-warning" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Documents</p>
                      <p className="text-2xl font-bold capitalize">{applicationData?.documents_status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="group relative overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:scale-110 transition-transform">
                      <Upload className="h-7 w-7 text-primary" />
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                      Action Required
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl mb-2">Upload Documents</CardTitle>
                  <CardDescription className="text-base">
                    Submit your required documents to move forward with your application
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-3">
                        <FileCheck className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Status</span>
                      </div>
                      <Badge variant="secondary" className="capitalize font-semibold">
                        {applicationData?.documents_status}
                      </Badge>
                    </div>
                    <Button size="lg" className="w-full gap-3 text-base group-hover:gap-4 transition-all shadow-md">
                      View Requirements
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-accent to-accent/50 group-hover:scale-110 transition-transform">
                      <Eye className="h-7 w-7 text-primary" />
                    </div>
                    <Badge variant="outline" className={getStatusColor(applicationData?.status)}>
                      <span className="capitalize font-semibold">{applicationData?.status?.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl mb-2">Track Progress</CardTitle>
                  <CardDescription className="text-base">
                    View detailed timeline and get real-time updates on your application
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(applicationData?.status)}
                        <div className="flex-1">
                          <p className="font-semibold capitalize mb-1">
                            {applicationData?.status?.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {applicationData?.status === 'new' && 'Our team is reviewing your application details'}
                            {applicationData?.status === 'in_progress' && 'We\'re processing your documents and verifying information'}
                            {applicationData?.status === 'approved' && 'Your loan is approved! Next steps will be shared via email'}
                            {applicationData?.status === 'rejected' && 'Please contact support for alternative options'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button size="lg" variant="outline" className="w-full gap-3 text-base group-hover:gap-4 transition-all">
                      View Full Timeline
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Help Card */}
            <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-warning/10 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start gap-5">
                  <div className="p-3 rounded-2xl bg-warning/20 flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">Need Assistance?</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Our dedicated support team is available to help you with any questions about your application, 
                      documents, or the loan process. We're here to make your journey smooth!
                    </p>
                    <Button variant="outline" className="gap-2">
                      Contact Support
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
