import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { signOut, appUser } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

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
            <Card>
              <CardHeader>
                <CardTitle>Start Your Loan Application</CardTitle>
                <CardDescription>
                  Complete your education loan application in 5 simple steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    Ready to start your journey? Click below to begin your application.
                  </p>
                  <Button size="lg">Start Application</Button>
                </div>
              </CardContent>
            </Card>
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
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Complete your application first to unlock the document checklist
                  </p>
                </div>
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
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Your application status will appear here once submitted
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
