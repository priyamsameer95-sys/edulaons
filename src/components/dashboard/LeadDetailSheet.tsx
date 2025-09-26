import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Building2, 
  MapPin, 
  Calendar, 
  BadgeIndianRupee,
  FileCheck,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  case_id: string;
  student_name: string;
  student_phone_masked: string;
  lender_name: string;
  loan_type: 'secured' | 'unsecured';
  status: string;
  amount_requested: number;
  docs_verified_count: number;
  required_docs_count: number;
  created_at: string;
  country: string;
  university: string;
}

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChecklistItem {
  id: string;
  name: string;
  required: boolean;
  status: 'uploaded' | 'verified' | 'rejected' | 'expired' | 'pending';
  uploaded_at?: string;
}

interface Document {
  id: string;
  name: string;
  versions: number;
  latest_status: 'uploaded' | 'verified' | 'rejected';
  uploaded_at: string;
}

interface TimelineEvent {
  id: string;
  action: string;
  actor_role: string;
  message: string;
  created_at: string;
}

export const LeadDetailSheet = ({ lead, open, onOpenChange }: LeadDetailSheetProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  if (!lead) return null;

  // Mock data - replace with actual Supabase queries
  const mockChecklist: ChecklistItem[] = [
    { id: '1', name: 'Passport Copy', required: true, status: 'verified', uploaded_at: '2024-01-15' },
    { id: '2', name: 'Academic Transcripts', required: true, status: 'uploaded', uploaded_at: '2024-01-14' },
    { id: '3', name: 'Income Proof', required: true, status: 'pending' },
    { id: '4', name: 'Bank Statements', required: true, status: 'rejected', uploaded_at: '2024-01-13' },
    { id: '5', name: 'Collateral Documents', required: false, status: 'verified', uploaded_at: '2024-01-12' }
  ];

  const mockDocuments: Document[] = [
    { id: '1', name: 'Passport Copy', versions: 2, latest_status: 'verified', uploaded_at: '2024-01-15' },
    { id: '2', name: 'Academic Transcripts', versions: 1, latest_status: 'uploaded', uploaded_at: '2024-01-14' },
    { id: '4', name: 'Bank Statements', versions: 3, latest_status: 'rejected', uploaded_at: '2024-01-13' }
  ];

  const mockTimeline: TimelineEvent[] = [
    { id: '1', action: 'case_created', actor_role: 'partner', message: 'New lead created', created_at: '2024-01-15T10:30:00Z' },
    { id: '2', action: 'document_uploaded', actor_role: 'student', message: 'Passport copy uploaded', created_at: '2024-01-15T14:20:00Z' },
    { id: '3', action: 'document_verified', actor_role: 'ops_team', message: 'Passport copy verified', created_at: '2024-01-15T16:45:00Z' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-success';
      case 'uploaded': return 'text-warning';
      case 'rejected': return 'text-destructive';
      case 'expired': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return CheckCircle;
      case 'uploaded': return Clock;
      case 'rejected': return XCircle;
      case 'expired': return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-success text-success-foreground';
      case 'uploaded': return 'bg-warning text-warning-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'expired': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleDownloadDoc = async (docId: string, docName: string) => {
    try {
      // Mock API call to edge function
      // const response = await fetch('/api/get-signed-download', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ case_id: lead.case_id, doc_id: docId })
      // });
      
      toast({
        title: "Download Started",
        description: `Downloading ${docName}...`,
      });

      // Mock download - in real implementation, open the signed URL
      setTimeout(() => {
        toast({
          title: "Download Complete",
          description: `${docName} has been downloaded successfully.`,
        });
      }, 2000);

    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const requiredDocs = mockChecklist.filter(item => item.required);
  const completedRequired = requiredDocs.filter(item => item.status === 'verified').length;
  const progressPercentage = (completedRequired / requiredDocs.length) * 100;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl">
            Case Details - {lead.case_id}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-card border-0 shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Student</p>
                      <p className="font-semibold">{lead.student_name}</p>
                      <p className="text-sm text-muted-foreground">{lead.student_phone_masked}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    <BadgeIndianRupee className="h-8 w-8 text-success" />
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold">₹{(lead.amount_requested / 100000).toFixed(1)}L</p>
                      <Badge className={cn("mt-1 capitalize", lead.loan_type === 'secured' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}>
                        {lead.loan_type}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-8 w-8 text-accent-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Lender</p>
                      <p className="font-semibold">{lead.lender_name}</p>
                      <p className="text-sm text-muted-foreground">KAM: John Smith</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-8 w-8 text-warning" />
                    <div>
                      <p className="text-sm text-muted-foreground">Destination</p>
                      <p className="font-semibold">{lead.country}</p>
                      <p className="text-sm text-muted-foreground">{lead.university}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status and Progress */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Application Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status</span>
                  <Badge className={cn("capitalize", 
                    lead.status === 'sanctioned' ? 'bg-success text-success-foreground' : 
                    lead.status === 'docs_verified' ? 'bg-primary text-primary-foreground' :
                    'bg-warning text-warning-foreground'
                  )}>
                    {lead.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Application Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Created</span>
                  <span>{format(new Date(lead.created_at), 'dd MMM yyyy, HH:mm')}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Intake</span>
                  <span>Jan 2026</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Document Checklist</span>
                  <Badge variant="outline">
                    {completedRequired}/{requiredDocs.length} Required
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockChecklist.map((item) => {
                  const StatusIcon = getStatusIcon(item.status);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className={cn("h-5 w-5", getStatusColor(item.status))} />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {item.required && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                            <Badge className={cn("text-xs capitalize", getStatusBadge(item.status))}>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {item.uploaded_at && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.uploaded_at), 'dd MMM')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileCheck className="h-5 w-5 mr-2" />
                  Available Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockDocuments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileCheck className="h-8 w-8 mx-auto mb-2" />
                    <p>No documents available for download</p>
                  </div>
                ) : (
                  mockDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium">{doc.name}</p>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <span>{doc.versions} version{doc.versions !== 1 ? 's' : ''}</span>
                          <Badge className={cn("text-xs capitalize", getStatusBadge(doc.latest_status))}>
                            {doc.latest_status}
                          </Badge>
                          <span>{format(new Date(doc.uploaded_at), 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDoc(doc.id, doc.name)}
                        className="ml-4"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTimeline.map((event, index) => (
                    <div key={event.id} className="flex space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <ExternalLink className="h-4 w-4 text-primary-foreground" />
                        </div>
                        {index < mockTimeline.length - 1 && (
                          <div className="w-px h-8 bg-border mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{event.message}</p>
                          <Badge variant="outline" className="text-xs">
                            {event.actor_role.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.created_at), 'dd MMM yyyy, HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};