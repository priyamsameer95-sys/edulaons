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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Student Portal</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {appUser?.email?.split('@')[0]}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {!hasApplication ? (
          <>
            {/* Welcome Section */}
            <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">Start Your Education Loan Journey</h2>
                    <p className="text-muted-foreground mb-4">
                      Complete your application in just a few simple steps. We're here to help you achieve your study abroad dreams.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        5-10 minutes
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <FileCheck className="h-3 w-3" />
                        Simple process
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Quick approval
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Flow */}
            <StudentApplicationFlow />
          </>
        ) : (
          <div className="space-y-8">
            {/* Progress Overview Card */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Your Application Progress</h2>
                    <p className="text-sm text-muted-foreground">Case ID: {applicationData?.case_id}</p>
                  </div>
                  <Badge variant="outline" className={`${getStatusColor(applicationData?.status)} px-3 py-1 gap-2`}>
                    {getStatusIcon(applicationData?.status)}
                    <span className="capitalize font-semibold">{applicationData?.status?.replace('_', ' ')}</span>
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Loan Amount</p>
                      <p className="text-lg font-bold">₹{applicationData?.loan_amount?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Destination</p>
                      <p className="text-lg font-bold capitalize">{applicationData?.study_destination}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <FileCheck className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Documents</p>
                      <p className="text-lg font-bold capitalize">{applicationData?.documents_status}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Cards Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Documents Card */}
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                      <Upload className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Required
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">Upload Documents</CardTitle>
                  <CardDescription>
                    Submit your required documents to proceed with your application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Status</span>
                      <Badge variant="secondary" className="capitalize">
                        {applicationData?.documents_status}
                      </Badge>
                    </div>
                    <Button className="w-full gap-2 group-hover:gap-3 transition-all">
                      View Requirements
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Status Card */}
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                      <Eye className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className={getStatusColor(applicationData?.status)}>
                      <span className="capitalize">{applicationData?.status?.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">Application Status</CardTitle>
                  <CardDescription>
                    Track your application progress and get real-time updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(applicationData?.status)}
                        <div className="flex-1">
                          <p className="font-medium capitalize">{applicationData?.status?.replace('_', ' ')}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {applicationData?.status === 'new' && 'Your application has been received and is under review'}
                            {applicationData?.status === 'in_progress' && 'Our team is currently processing your application'}
                            {applicationData?.status === 'approved' && 'Congratulations! Your application has been approved'}
                            {applicationData?.status === 'rejected' && 'Unfortunately, your application was not approved'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full gap-2 group-hover:gap-3 transition-all">
                      View Timeline
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Help Section */}
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-1">Need Help?</h3>
                    <p className="text-sm text-amber-800">
                      Our team is here to help you through every step. If you have questions about your application or documents, feel free to reach out to support.
                    </p>
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
