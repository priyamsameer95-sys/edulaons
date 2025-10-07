import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import StudentApplicationFlow from '@/components/student/StudentApplicationFlow';
import { Loader2, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';

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
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Student Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{appUser?.email}</span>
            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="application" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="application">Application</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="application" className="mt-6">
            {!hasApplication ? (
              <StudentApplicationFlow />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Your Application</CardTitle>
                  <CardDescription>
                    Case ID: {applicationData?.case_id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Case ID:</span>
                        <p className="font-medium">{applicationData?.case_id}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Loan Amount:</span>
                        <p className="font-medium">₹{applicationData?.loan_amount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <p className="font-medium capitalize">{applicationData?.status}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Documents:</span>
                        <p className="font-medium capitalize">{applicationData?.documents_status}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="checklist" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Checklist</CardTitle>
                <CardDescription>
                  Upload required documents for your loan application
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasApplication ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Document upload feature coming soon
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Complete your application first to unlock the document checklist
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>
                  Track the progress of your loan application
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasApplication ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      {getStatusIcon(applicationData?.status)}
                      <div>
                        <h3 className="font-semibold capitalize">{applicationData?.status?.replace('_', ' ')}</h3>
                        <p className="text-sm text-muted-foreground">
                          Document Status: {applicationData?.documents_status}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Your application status will appear here once submitted
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
