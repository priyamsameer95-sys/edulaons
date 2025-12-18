import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import {
  User,
  CreditCard,
  GraduationCap,
  Phone,
  Mail,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  CheckCircle,
  Upload
} from "lucide-react";
import { RefactoredLead } from "@/types/refactored-lead";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { useLeadDocuments } from "@/hooks/useLeadDocuments";
import { StatusBadge } from "@/components/lead-status/StatusBadge";
import { EnhancedDocumentUpload } from "@/components/ui/enhanced-document-upload";
import { supabase } from "@/integrations/supabase/client";
import type { LeadStatus } from "@/utils/statusUtils";

interface PartnerLeadDetailSheetProps {
  lead: RefactoredLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated?: () => void;
  initialTab?: string;
}

interface LeadUniversity {
  id: string;
  name: string;
  city: string;
  country: string;
}

export const PartnerLeadDetailSheet = ({ 
  lead, 
  open, 
  onOpenChange, 
  onLeadUpdated,
  initialTab = "overview"
}: PartnerLeadDetailSheetProps) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showCoApplicantDetails, setShowCoApplicantDetails] = useState(false);
  const [leadUniversities, setLeadUniversities] = useState<LeadUniversity[]>([]);
  
  const { documentTypes, loading: documentTypesLoading } = useDocumentTypes();
  const { documents, loading: documentsLoading, refetch: refetchDocuments } = useLeadDocuments(lead?.id);

  // Set initial tab when it changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Fetch universities for this lead
  useEffect(() => {
    if (!lead?.id) return;

    const fetchUniversities = async () => {
      const { data: univData } = await supabase
        .from('lead_universities')
        .select('university_id, universities(id, name, city, country)')
        .eq('lead_id', lead.id);

      if (univData) {
        const universities = univData
          .filter((u: any) => u.universities)
          .map((u: any) => ({
            id: u.universities.id,
            name: u.universities.name,
            city: u.universities.city,
            country: u.universities.country
          }));
        setLeadUniversities(universities);
      }
    };

    fetchUniversities();
  }, [lead?.id]);

  if (!lead) return null;

  // Create document checklist
  const documentChecklist = documentTypes.map(docType => {
    const uploadedDoc = documents.find(doc => doc.document_type_id === docType.id);
    return {
      id: docType.id,
      name: docType.name,
      required: docType.required,
      status: uploadedDoc ? 'uploaded' : 'pending',
      uploaded_at: uploadedDoc?.uploaded_at ? format(new Date(uploadedDoc.uploaded_at), 'dd MMM yyyy') : undefined
    };
  });

  const requiredDocs = documentChecklist.filter(item => item.required);
  const completedRequired = requiredDocs.filter(item => item.status === 'uploaded').length;
  const progressPercentage = requiredDocs.length > 0 ? (completedRequired / requiredDocs.length) * 100 : 0;

  const partnerName = lead.partner?.name || 'Direct';
  const createdDate = lead.created_at ? format(new Date(lead.created_at), 'dd MMM yyyy') : '';

  const handleDocumentUploadSuccess = () => {
    refetchDocuments();
    onLeadUpdated?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-1 pb-4 border-b">
          <SheetTitle className="text-lg font-semibold">
            {lead.case_id} • {createdDate}
          </SheetTitle>
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.status as LeadStatus} type="lead" />
            {lead.is_quick_lead && !lead.quick_lead_completed_at && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Incomplete
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="py-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Student Details */}
              <Card className="border">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Student
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-1.5">
                  <p className="font-semibold text-sm">{lead.student?.name || 'N/A'}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{lead.student?.phone || 'N/A'}</span>
                    {lead.student?.phone && (
                      <a 
                        href={`https://wa.me/91${lead.student.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  {lead.student?.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{lead.student.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Co-Applicant Details */}
              <Card className="border">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Co-Applicant
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-1.5">
                  <p className="font-semibold text-sm">{lead.co_applicant?.name || 'N/A'}</p>
                  {lead.co_applicant?.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{lead.co_applicant.phone}</span>
                    </div>
                  )}
                  <button 
                    onClick={() => setShowCoApplicantDetails(!showCoApplicantDetails)}
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    {showCoApplicantDetails ? 'Hide' : 'Show more'}
                    {showCoApplicantDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {showCoApplicantDetails && (
                    <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t">
                      <p>Relation: <span className="capitalize">{lead.co_applicant?.relationship || 'N/A'}</span></p>
                      <p>Salary: {lead.co_applicant?.salary ? `₹${Number(lead.co_applicant.salary).toLocaleString()}/yr` : 'N/A'}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Loan & Study Details */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      Loan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-1">
                    <p className="font-semibold text-sm">₹{lead.loan_amount?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground capitalize">{lead.loan_type}</p>
                    <p className="text-xs text-muted-foreground">{lead.lender?.name || 'Not assigned'}</p>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Study
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-1">
                    <p className="font-semibold text-sm">{lead.study_destination}</p>
                    {lead.intake_month && lead.intake_year && (
                      <p className="text-xs text-muted-foreground">
                        Intake: {format(new Date(lead.intake_year, lead.intake_month - 1), 'MMM yyyy')}
                      </p>
                    )}
                    {leadUniversities.length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        {leadUniversities[0].name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Document Progress Summary */}
              <Card className="border">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{completedRequired} of {requiredDocs.length} required docs uploaded</span>
                    <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-1.5" />
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="border">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-1.5 text-xs text-muted-foreground">
                  <p>Created: {createdDate}</p>
                  {lead.updated_at && (
                    <p>Last Updated: {format(new Date(lead.updated_at), 'dd MMM yyyy, HH:mm')}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 mt-4">
              {/* Document Checklist */}
              <Card className="border">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm font-medium">Document Checklist</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  {documentTypesLoading || documentsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : (
                    <div className="space-y-2">
                      {requiredDocs.slice(0, 8).map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between text-sm">
                          <span className={doc.status === 'uploaded' ? 'text-foreground' : 'text-muted-foreground'}>
                            {doc.name}
                          </span>
                          {doc.status === 'uploaded' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Upload className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                      {requiredDocs.length > 8 && (
                        <p className="text-xs text-muted-foreground">
                          +{requiredDocs.length - 8} more documents
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};
