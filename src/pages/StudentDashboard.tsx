import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import StudentApplicationFlow from '@/components/student/StudentApplicationFlow';
import { Loader2, FileText, CheckCircle2, Clock, XCircle, GraduationCap, FileCheck, TrendingUp, ArrowRight, Upload, Eye, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const StudentDashboard = () => {
  const { signOut, appUser } = useAuth();
  const navigate = useNavigate();
  const [hasApplication, setHasApplication] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applicationData] = useState<any>(null);

  useEffect(() => {
    setLoading(false);
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
        return 'bg-primary/10 text-primary border-primary/20';
      case 'in_progress':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      {/* Bold Header with Gradient */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-xl shadow-lg">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-primary">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-foreground">
                  Student Dashboard
                </h1>
                <p className="text-base text-muted-foreground font-medium">
                  Welcome, {appUser?.email?.split('@')[0]}! 🎓
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              size="lg"
              className="font-semibold"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-7xl">
        {!hasApplication ? (
          <div className="space-y-10 animate-fade-in">
            {/* Massive Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-12 md:p-16 shadow-2xl">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
              
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-md mb-6 animate-scale-in">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <span className="text-base font-bold text-white">Start Your Journey Today!</span>
                </div>
                
                <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                  Your Future Starts Here! 🚀
                </h2>
                
                <p className="text-xl md:text-2xl text-white/95 mb-10 leading-relaxed font-medium">
                  Apply for your education loan in minutes. Simple, fast, and secure. 
                  Let's make your study abroad dreams a reality!
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
                    <div className="p-3 rounded-xl bg-white/20">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">5-10 Min</p>
                      <p className="text-sm text-white/80">Quick Apply</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
                    <div className="p-3 rounded-xl bg-white/20">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">48 Hours</p>
                      <p className="text-sm text-white/80">Fast Approval</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
                    <div className="p-3 rounded-xl bg-white/20">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">Best Rates</p>
                      <p className="text-sm text-white/80">Guaranteed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Form Section */}
            <Card className="border-2 border-primary/20 shadow-2xl">
              <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-accent/5 pb-8">
                <CardTitle className="text-3xl font-black">Start Your Application</CardTitle>
                <CardDescription className="text-lg">
                  Fill out the form below to get started. It only takes a few minutes!
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <StudentApplicationFlow />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in">
            {/* Application Status Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-card p-10 border-2 border-primary/20 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="flex-1">
                  <Badge variant="outline" className={`mb-5 gap-2 px-5 py-2 text-base font-bold ${getStatusColor(applicationData?.status)}`}>
                    {getStatusIcon(applicationData?.status)}
                    <span className="capitalize">
                      {applicationData?.status?.replace('_', ' ')}
                    </span>
                  </Badge>
                  
                  <h2 className="text-4xl md:text-5xl font-black mb-3 text-foreground">
                    {applicationData?.status === 'approved' && '🎉 Approved!'}
                    {applicationData?.status === 'in_progress' && '⚡ In Progress'}
                    {applicationData?.status === 'new' && '✨ Application Received'}
                    {applicationData?.status === 'rejected' && '📋 Update Required'}
                  </h2>
                  
                  <p className="text-lg text-muted-foreground mb-2">
                    Case ID: <span className="font-mono font-bold text-foreground text-xl">{applicationData?.case_id}</span>
                  </p>
                  
                  <p className="text-base text-muted-foreground">
                    {applicationData?.status === 'new' && 'Your application is being reviewed by our expert team'}
                    {applicationData?.status === 'in_progress' && 'We\'re actively processing your application'}
                    {applicationData?.status === 'approved' && 'Congratulations! Your loan has been approved'}
                    {applicationData?.status === 'rejected' && 'Let\'s explore alternative options together'}
                  </p>
                </div>
                
                {/* Circular Progress */}
                <div className="relative w-40 h-40 flex-shrink-0">
                  <svg className="transform -rotate-90 w-40 h-40">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 70}`}
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
                      className="transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'hsl(217 91% 60%)', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: 'hsl(142 76% 45%)', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-black bg-gradient-primary bg-clip-text text-transparent">{progress}%</p>
                      <p className="text-sm font-bold text-muted-foreground">Complete</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-2 border-border hover:border-primary/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-gradient-secondary">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-1">Loan Amount</p>
                      <p className="text-3xl font-black text-foreground">₹{applicationData?.loan_amount?.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-border hover:border-accent/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-gradient-primary">
                      <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-1">Destination</p>
                      <p className="text-3xl font-black text-foreground capitalize">{applicationData?.study_destination}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-border hover:border-warning/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-warning">
                      <FileCheck className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-1">Documents</p>
                      <p className="text-3xl font-black text-foreground capitalize">{applicationData?.documents_status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Cards */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="group border-2 border-border hover:border-primary hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <CardHeader className="border-b pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary group-hover:scale-110 transition-all">
                      <Upload className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <Badge className="bg-primary text-white px-4 py-1.5 text-base font-bold">
                      Required
                    </Badge>
                  </div>
                  <CardTitle className="text-3xl font-black mb-3">Upload Documents</CardTitle>
                  <CardDescription className="text-lg">
                    Submit your required documents to continue processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-5 rounded-xl bg-muted">
                      <div className="flex items-center gap-3">
                        <FileCheck className="h-6 w-6 text-muted-foreground" />
                        <span className="font-bold text-lg">Status</span>
                      </div>
                      <Badge variant="secondary" className="text-base font-bold capitalize px-4 py-1.5">
                        {applicationData?.documents_status}
                      </Badge>
                    </div>
                    <Button size="lg" className="w-full text-lg font-bold gap-3 h-14 group-hover:gap-4 transition-all">
                      View Requirements
                      <ArrowRight className="h-6 w-6" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="group border-2 border-border hover:border-accent hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <CardHeader className="border-b pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-4 rounded-2xl bg-accent/10 group-hover:bg-accent group-hover:scale-110 transition-all">
                      <Eye className="h-8 w-8 text-accent group-hover:text-white transition-colors" />
                    </div>
                    <Badge variant="outline" className={`text-base font-bold px-4 py-1.5 ${getStatusColor(applicationData?.status)}`}>
                      <span className="capitalize">{applicationData?.status?.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                  <CardTitle className="text-3xl font-black mb-3">Track Progress</CardTitle>
                  <CardDescription className="text-lg">
                    View your application timeline and get real-time updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-5">
                    <div className="p-5 rounded-xl bg-muted border-2 border-border">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getStatusIcon(applicationData?.status)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-lg capitalize mb-2">
                            {applicationData?.status?.replace('_', ' ')}
                          </p>
                          <p className="text-base text-muted-foreground leading-relaxed">
                            {applicationData?.status === 'new' && 'Our team is carefully reviewing your application'}
                            {applicationData?.status === 'in_progress' && 'Documents are being verified and processed'}
                            {applicationData?.status === 'approved' && 'Next steps will be sent to your email shortly'}
                            {applicationData?.status === 'rejected' && 'Contact support for alternative options'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button size="lg" variant="outline" className="w-full text-lg font-bold gap-3 h-14 group-hover:gap-4 transition-all">
                      View Timeline
                      <ArrowRight className="h-6 w-6" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Help Section */}
            <Card className="border-2 border-warning/30 bg-gradient-to-br from-warning/10 to-warning/5 shadow-xl">
              <CardContent className="pt-8">
                <div className="flex items-start gap-6">
                  <div className="p-4 rounded-2xl bg-warning/20 flex-shrink-0">
                    <AlertCircle className="h-8 w-8 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black mb-3">Need Help? We're Here! 💬</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-5">
                      Our support team is ready to assist you with any questions about your application, 
                      documents, or the loan process. Don't hesitate to reach out!
                    </p>
                    <Button size="lg" className="font-bold gap-3">
                      Contact Support Now
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
