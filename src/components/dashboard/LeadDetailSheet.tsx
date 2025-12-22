import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AdminDocumentManager } from "@/components/admin/AdminDocumentManager";
import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  Download,
  FileText,
  User,
  CreditCard,
  GraduationCap,
  Phone,
  Mail,
  Eye,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Building2,
  Star,
  FileArchive,
  Loader2
} from "lucide-react";
import { RefactoredLead } from "@/types/refactored-lead";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { useLeadDocuments } from "@/hooks/useLeadDocuments";
import { useDynamicDocuments, LoanClassification } from "@/hooks/useDynamicDocuments";
import { EnhancedDocumentUpload } from "@/components/ui/enhanced-document-upload";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/lead-status/StatusBadge";
import { StatusUpdateSheet } from "@/components/admin/StatusUpdateSheet";
import { StatusHistory } from "@/components/lead-status/StatusHistory";
import { LenderAssignmentModal } from "@/components/admin/LenderAssignmentModal";
import { PartnerAssignmentModal } from "@/components/admin/PartnerAssignmentModal";
import { LoanConfigurationCard } from "@/components/admin/LoanConfigurationCard";
import { useAccessLogger } from "@/hooks/useAccessLogger";
import { downloadLeadPackage } from "@/utils/downloadLeadPackage";
import type { LeadStatus, DocumentStatus } from "@/utils/statusUtils";

interface LeadDetailSheetProps {
  lead: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated?: () => void;
}

interface PreferredLender {
  id: string;
  name: string;
}

interface LeadUniversity {
  id: string;
  name: string;
  city: string;
  country: string;
}

export const LeadDetailSheet = ({ lead, open, onOpenChange, onLeadUpdated }: LeadDetailSheetProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [lenderAssignmentModalOpen, setLenderAssignmentModalOpen] = useState(false);
  const [partnerAssignmentModalOpen, setPartnerAssignmentModalOpen] = useState(false);
  const [showCoApplicantDetails, setShowCoApplicantDetails] = useState(false);
  const [preferredLenders, setPreferredLenders] = useState<PreferredLender[]>([]);
  const [leadUniversities, setLeadUniversities] = useState<LeadUniversity[]>([]);
  const [allLenders, setAllLenders] = useState<{ id: string; name: string }[]>([]);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const { toast } = useToast();
  const { appUser, isAdmin } = useAuth();
  const { logLeadView } = useAccessLogger();
  
  // Real data from Supabase
  const { documentTypes, loading: documentTypesLoading } = useDocumentTypes();
  const { documents, loading: documentsLoading, getDownloadUrl, refetch: refetchDocuments } = useLeadDocuments(lead?.id);
  
  // Dynamic documents based on loan classification
  const { requiredDocs, totalRequired, loading: dynamicDocsLoading, refetch: refetchDynamicDocs } = useDynamicDocuments(
    lead?.loan_classification as LoanClassification | null
  );

  // Log lead view and fetch preferred lenders and universities
  useEffect(() => {
    if (!lead?.id) return;
    
    // Silent background logging
    logLeadView(lead.id);

    const fetchAdditionalData = async () => {
      // Fetch universities for this lead
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

        // Fetch preferred lenders based on university preferences
        if (universities.length > 0) {
          const { data: prefData } = await supabase
            .from('university_lender_preferences')
            .select('lender_id, is_preferred, lenders(id, name)')
            .eq('university_id', universities[0].id)
            .eq('study_destination', lead.study_destination)
            .eq('is_preferred', true)
            .limit(2);

          if (prefData) {
            const lenders = prefData
              .filter((p: any) => p.lenders)
              .map((p: any) => ({
                id: p.lenders.id,
                name: p.lenders.name
              }));
            setPreferredLenders(lenders);
          }
        }
      }
    };

    fetchAdditionalData();
  }, [lead?.id, lead?.study_destination]);

  // Fetch all lenders for the loan configuration dropdown
  useEffect(() => {
    const fetchAllLenders = async () => {
      const { data } = await supabase
        .from('lenders')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (data) {
        setAllLenders(data);
      }
    };
    
    fetchAllLenders();
  }, []);

  if (!lead) return null;

  const handleDownloadDoc = async (documentId: string, docName: string) => {
    try {
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        toast({
          title: "Download Failed",
          description: "Document not found.",
          variant: "destructive",
        });
        return;
      }

      const url = await getDownloadUrl(document.file_path);
      if (url) {
        window.open(url, '_blank');
        toast({
          title: "Download Started",
          description: `Downloading ${docName}...`,
        });
      } else {
        throw new Error('Failed to get download URL');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadZip = async () => {
    if (!lead) return;
    
    setIsDownloadingZip(true);
    try {
      const success = await downloadLeadPackage(
        lead,
        documents,
        (message) => console.log('ZIP Progress:', message)
      );
      
      if (success) {
        toast({
          title: "Download Complete",
          description: "Lead package has been downloaded successfully.",
        });
      } else {
        throw new Error('Failed to create package');
      }
    } catch (error) {
      console.error('ZIP download error:', error);
      toast({
        title: "Download Failed",
        description: "Unable to create lead package. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Create dynamic checklist from document requirements based on loan classification
  // If dynamic docs available, use them; otherwise fall back to all document types
  const dynamicChecklist = requiredDocs.length > 0 
    ? requiredDocs.map(req => {
        const uploadedDoc = documents.find(doc => doc.document_type_id === req.document_type_id);
        return {
          id: req.document_type_id,
          name: req.document_type?.name || 'Unknown',
          required: req.is_required,
          status: uploadedDoc ? 'uploaded' : 'pending',
          uploaded_at: uploadedDoc?.uploaded_at ? format(new Date(uploadedDoc.uploaded_at), 'yyyy-MM-dd') : undefined
        };
      })
    : documentTypes.map(docType => {
        const uploadedDoc = documents.find(doc => doc.document_type_id === docType.id);
        return {
          id: docType.id,
          name: docType.name,
          required: docType.required,
          status: uploadedDoc ? 'uploaded' : 'pending',
          uploaded_at: uploadedDoc?.uploaded_at ? format(new Date(uploadedDoc.uploaded_at), 'yyyy-MM-dd') : undefined
        };
      });

  const requiredDocsFiltered = dynamicChecklist.filter(item => item.required);
  const completedRequired = requiredDocsFiltered.filter(item => item.status === 'uploaded').length;
  const progressPercentage = requiredDocsFiltered.length > 0 ? (completedRequired / requiredDocsFiltered.length) * 100 : 0;

  // Get first 5 required docs for quick check
  const quickDocCheck = requiredDocsFiltered.slice(0, 5);
  const partnerName = lead.partners?.name || lead.partner?.name || 'Direct';
  const createdDate = lead.created_at ? format(new Date(lead.created_at), 'dd MMM yyyy') : '';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto p-0">
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5 border-b">
          <SheetHeader className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <SheetTitle className="text-xl font-bold tracking-tight">
                  {lead.student?.name || 'Lead Details'}
                </SheetTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{lead.case_id}</span>
                  <span>•</span>
                  <span>{createdDate}</span>
                  <span>•</span>
                  <span>{partnerName}</span>
                </div>
              </div>
              {isAdmin() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadZip}
                  disabled={isDownloadingZip}
                  className="shrink-0 bg-background/80 backdrop-blur-sm hover:bg-background"
                >
                  {isDownloadingZip ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileArchive className="h-4 w-4 mr-2" />
                  )}
                  {isDownloadingZip ? 'Creating...' : 'Download ZIP'}
                </Button>
              )}
            </div>
            
            {/* Status Badge Row */}
            <div className="flex items-center gap-3">
              <StatusBadge status={lead.status as LeadStatus} type="lead" />
              {isAdmin() && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setStatusUpdateModalOpen(true)}
                  className="h-7 text-xs hover:bg-primary/10"
                >
                  Update Status
                </Button>
              )}
            </div>
          </SheetHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Documents
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-5 mt-5 animate-fade-in">
              {/* Info Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Student Card */}
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-900/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/50">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      Student
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    <p className="font-semibold text-base">{lead.student?.name || 'N/A'}</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{lead.student?.phone || 'N/A'}</span>
                        {lead.student?.phone && (
                          <a 
                            href={`https://wa.me/91${lead.student.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      {lead.student?.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{lead.student.email}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Co-Applicant Card */}
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-950/20 dark:to-purple-900/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/50">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      Co-Applicant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    <p className="font-semibold text-base">{lead.co_applicant?.name || 'N/A'}</p>
                    <div className="space-y-1.5">
                      {lead.co_applicant?.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{lead.co_applicant.phone}</span>
                        </div>
                      )}
                      <button 
                        onClick={() => setShowCoApplicantDetails(!showCoApplicantDetails)}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        {showCoApplicantDetails ? 'Hide details' : 'Show details'}
                        {showCoApplicantDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>
                    {showCoApplicantDetails && (
                      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-purple-200/50 dark:border-purple-800/50 animate-fade-in">
                        <p>Relation: <span className="capitalize font-medium text-foreground">{lead.co_applicant?.relationship || 'N/A'}</span></p>
                        <p>Salary: <span className="font-medium text-foreground">{lead.co_applicant?.salary ? `₹${Number(lead.co_applicant.salary).toLocaleString()}/yr` : 'N/A'}</span></p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Loan Details Card */}
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/20 dark:to-emerald-900/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50">
                        <CreditCard className="h-3.5 w-3.5" />
                      </div>
                      Loan Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    <p className="font-bold text-xl text-emerald-700 dark:text-emerald-300">₹{lead.loan_amount?.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs capitalize bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0">
                        {lead.loan_type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{lead.lender?.name || 'N/A'}</span>
                      </div>
                      {isAdmin() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLenderAssignmentModalOpen(true)}
                          className="h-6 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/50"
                        >
                          Change
                        </Button>
                      )}
                    </div>
                    {preferredLenders.length > 0 && (
                      <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span>Preferred: </span>
                          <span className="text-foreground font-medium">
                            {preferredLenders.map(l => l.name).join(', ')}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Study Destination Card */}
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-950/20 dark:to-amber-900/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/50">
                        <GraduationCap className="h-3.5 w-3.5" />
                      </div>
                      Study Destination
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    <p className="font-semibold text-base">{lead.study_destination}</p>
                    <p className="text-sm text-muted-foreground">
                      Intake: <span className="font-medium text-foreground">{lead.intake_month}/{lead.intake_year}</span>
                    </p>
                    {leadUniversities.length > 0 && (
                      <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/50 space-y-1.5">
                        {leadUniversities.slice(0, 2).map((uni) => (
                          <div key={uni.id} className="flex items-start gap-2 text-xs">
                            <Building2 className="h-3 w-3 mt-0.5 text-amber-600/70 shrink-0" />
                            <div>
                              <p className="font-medium leading-tight">{uni.name}</p>
                              <p className="text-muted-foreground">{uni.city}</p>
                            </div>
                          </div>
                        ))}
                        {leadUniversities.length > 2 && (
                          <p className="text-xs text-muted-foreground pl-5">+{leadUniversities.length - 2} more</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Loan Configuration - Admin Only */}
              {isAdmin() && (
                <LoanConfigurationCard
                  leadId={lead.id}
                  currentClassification={lead.loan_classification || null}
                  currentTargetLenderId={lead.target_lender_id || null}
                  currentComplexity={lead.case_complexity || null}
                  lenders={allLenders}
                  onConfigUpdated={() => {
                    onLeadUpdated?.();
                    refetchDynamicDocs();
                  }}
                />
              )}

              {/* Document Progress Card */}
              <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-r from-muted/30 to-transparent">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Document Progress
                    </CardTitle>
                    <Badge variant="outline" className="text-xs font-medium">
                      {completedRequired}/{requiredDocsFiltered.length} required
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-1">
                    {quickDocCheck.map((doc, index) => (
                      <div 
                        key={doc.id} 
                        className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          {doc.status === 'uploaded' ? (
                            <div className="p-1 rounded-full bg-success/10">
                              <CheckCircle className="h-4 w-4 text-success" />
                            </div>
                          ) : (
                            <div className="p-1 rounded-full bg-muted">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className={`text-sm ${doc.status === 'uploaded' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {doc.name}
                          </span>
                        </div>
                        <Badge 
                          variant={doc.status === 'uploaded' ? 'default' : 'secondary'}
                          className={`text-xs ${doc.status === 'uploaded' ? 'bg-success/10 text-success hover:bg-success/20 border-0' : ''}`}
                        >
                          {doc.status === 'uploaded' ? 'Uploaded' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-3 w-full justify-center text-primary hover:text-primary hover:bg-primary/5"
                    onClick={() => setActiveTab('documents')}
                  >
                    View all documents
                    <ExternalLink className="h-3.5 w-3.5 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Partner Info Footer */}
              {isAdmin() && (
                <div className="flex items-center justify-between text-sm text-muted-foreground px-2 py-2 bg-muted/30 rounded-lg">
                  <span>
                    <span className="font-medium text-foreground">Partner:</span> {partnerName} 
                    {lead.partners?.partner_code && <span className="text-xs ml-1">({lead.partners.partner_code})</span>}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPartnerAssignmentModalOpen(true)}
                    className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                  >
                    Change
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="checklist" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Document Verification Progress</CardTitle>
                    <Badge variant="outline" className="bg-background">
                      {completedRequired}/{requiredDocs.length} Required
                    </Badge>
                  </div>
                  <Progress value={progressPercentage} className="w-full h-2" />
                  <p className="text-sm text-muted-foreground">
                    {Math.round(progressPercentage)}% of required documents uploaded
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {documentTypesLoading ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Loading document requirements...</p>
                    </div>
                  ) : (
                    dynamicChecklist.map((item) => {
                      const uploadedDoc = documents.find(doc => doc.document_type_id === item.id);
                      const docType = documentTypes.find(type => type.id === item.id);
                      
                      return (
                        <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex items-center space-x-3 flex-1">
                            <CheckCircle className={`h-5 w-5 ${item.status === 'uploaded' ? 'text-success' : 'text-muted-foreground'}`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{item.name}</span>
                                {item.required && (
                                  <Badge variant="destructive" className="text-xs px-1.5 py-0">Required</Badge>
                                )}
                              </div>
                              {docType && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  {docType.description}
                                </p>
                              )}
                              {item.uploaded_at && (
                                <p className="text-sm text-muted-foreground">
                                  Uploaded: {format(new Date(item.uploaded_at), 'MMM dd, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className={item.status === 'uploaded' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>
                              {item.status === 'uploaded' ? 'Uploaded' : 'Pending'}
                            </Badge>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2">
                              {uploadedDoc ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadDoc(uploadedDoc.id, item.name)}
                                    className="flex items-center gap-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Document
                                  </Button>
                                  <EnhancedDocumentUpload
                                    leadId={lead.id}
                                    documentType={{
                                      id: item.id,
                                      name: item.name,
                                      category: docType?.category || 'student',
                                      required: item.required,
                                      max_file_size_pdf: docType?.max_file_size_pdf || 10485760,
                                      max_file_size_image: docType?.max_file_size_image || 5242880,
                                      accepted_formats: docType?.accepted_formats || ['pdf', 'jpg', 'png'],
                                      description: docType?.description || ''
                                    }}
                                    onUploadSuccess={() => {
                                      refetchDocuments();
                                      toast({
                                        title: "Document Replaced",
                                        description: `${item.name} has been updated`,
                                      });
                                    }}
                                    onUploadError={(error) => {
                                      toast({
                                        variant: "destructive",
                                        title: "Upload Failed",
                                        description: error,
                                      });
                                    }}
                                    enableAIValidation={true}
                                  />
                                </>
                              ) : (
                                <EnhancedDocumentUpload
                                  leadId={lead.id}
                                  documentType={{
                                    id: item.id,
                                    name: item.name,
                                    category: docType?.category || 'student',
                                    required: item.required,
                                    max_file_size_pdf: docType?.max_file_size_pdf || 10485760,
                                    max_file_size_image: docType?.max_file_size_image || 5242880,
                                    accepted_formats: docType?.accepted_formats || ['pdf', 'jpg', 'png'],
                                    description: docType?.description || ''
                                  }}
                                  onUploadSuccess={() => {
                                    refetchDocuments();
                                    toast({
                                      title: "Document Uploaded",
                                      description: `${item.name} uploaded successfully`,
                                    });
                                  }}
                                  onUploadError={(error) => {
                                    toast({
                                      variant: "destructive",
                                      title: "Upload Failed",
                                      description: error,
                                    });
                                  }}
                                  enableAIValidation={true}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              {isAdmin() ? (
                <AdminDocumentManager leadId={lead.id} />
              ) : (
                <div className="space-y-6">
                  {/* Progress Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Document Progress</CardTitle>
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          {completedRequired}/{requiredDocs.length} Complete
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Progress value={progressPercentage} className="h-3" />
                        <p className="text-sm text-muted-foreground">
                          {Math.round(progressPercentage)}% of required documents uploaded
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Document List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Required Documents</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Upload all required documents to proceed with your application
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {documentTypesLoading ? (
                          <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                            ))}
                          </div>
                        ) : (
                          dynamicChecklist.map((item) => {
                            const uploadedDoc = documents.find(doc => doc.document_type_id === item.id);
                            const docType = documentTypes.find(type => type.id === item.id);
                            
                            return (
                              <div 
                                key={item.id} 
                                className="p-5 rounded-lg border bg-card hover:shadow-md transition-all duration-200"
                              >
                                <div className="space-y-4">
                                  {/* Document Info Section */}
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="mt-1">
                                        <CheckCircle 
                                          className={`h-6 w-6 ${
                                            item.status === 'uploaded' 
                                              ? 'text-success fill-success/20' 
                                              : 'text-muted-foreground'
                                          }`} 
                                        />
                                      </div>
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h4 className="font-semibold text-base">{item.name}</h4>
                                          {item.required && (
                                            <Badge variant="destructive" className="text-xs px-2">
                                              Required
                                            </Badge>
                                          )}
                                          <Badge 
                                            variant="outline" 
                                            className={`text-xs px-2 ${
                                              item.status === 'uploaded' 
                                                ? 'bg-success/10 text-success border-success/20' 
                                                : 'bg-muted/50 text-muted-foreground'
                                            }`}
                                          >
                                            {item.status === 'uploaded' ? 'Uploaded' : 'Pending'}
                                          </Badge>
                                        </div>
                                        
                                        <p className="text-sm text-muted-foreground">
                                          {docType?.description || 'Document type'}
                                        </p>
                                        
                                        {uploadedDoc && (
                                          <div className="pt-2 space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                              <FileText className="h-3 w-3" />
                                              <span className="font-medium">{uploadedDoc.original_filename}</span>
                                            </div>
                                            {item.uploaded_at && (
                                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span>Uploaded on {format(new Date(item.uploaded_at), 'MMM dd, yyyy')}</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons Section */}
                                  <div className="flex items-center gap-2 pt-2 border-t">
                                    {uploadedDoc ? (
                                      <>
                                        <Button
                                          onClick={() => handleDownloadDoc(uploadedDoc.id, uploadedDoc.original_filename)}
                                          variant="outline"
                                          size="sm"
                                          className="flex-1 sm:flex-none"
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Document
                                        </Button>
                                        <EnhancedDocumentUpload
                                          leadId={lead.id}
                                          documentType={{
                                            id: item.id,
                                            name: item.name,
                                            category: docType?.category || 'student',
                                            required: item.required,
                                            max_file_size_pdf: docType?.max_file_size_pdf || 10485760,
                                            max_file_size_image: docType?.max_file_size_image || 5242880,
                                            accepted_formats: docType?.accepted_formats || ['pdf', 'jpg', 'png'],
                                            description: docType?.description || ''
                                          }}
                                          onUploadSuccess={() => {
                                            refetchDocuments();
                                            toast({
                                              title: "Document Replaced",
                                              description: `${item.name} has been updated`,
                                            });
                                          }}
                                          onUploadError={(error) => {
                                            toast({
                                              variant: "destructive",
                                              title: "Upload Failed",
                                              description: error,
                                            });
                                          }}
                                          enableAIValidation={true}
                                        />
                                      </>
                                    ) : (
                                      <EnhancedDocumentUpload
                                        leadId={lead.id}
                                        documentType={{
                                          id: item.id,
                                          name: item.name,
                                          category: docType?.category || 'student',
                                          required: item.required,
                                          max_file_size_pdf: docType?.max_file_size_pdf || 10485760,
                                          max_file_size_image: docType?.max_file_size_image || 5242880,
                                          accepted_formats: docType?.accepted_formats || ['pdf', 'jpg', 'png'],
                                          description: docType?.description || ''
                                        }}
                                        onUploadSuccess={() => {
                                          refetchDocuments();
                                          toast({
                                            title: "Document Uploaded",
                                            description: `${item.name} uploaded successfully`,
                                          });
                                        }}
                                        onUploadError={(error) => {
                                          toast({
                                            variant: "destructive",
                                            title: "Upload Failed",
                                            description: error,
                                          });
                                        }}
                                        enableAIValidation={true}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>


            <TabsContent value="status" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Uploaded Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documentsLoading ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Loading documents...</p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No documents uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => {
                        const docType = documentTypes.find(type => type.id === doc.document_type_id);
                        return (
                          <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{docType?.name || 'Document'}</span>
                                  <Badge variant="secondary" className="text-xs">v{doc.version}</Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <CheckCircle className="h-4 w-4 text-success" />
                                  <span className="text-sm text-success">Uploaded</span>
                                  <span className="text-muted-foreground text-sm">•</span>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                              </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {doc.original_filename} • {(doc.file_size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDoc(doc.id, doc.original_filename)}
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <StatusHistory 
                leadId={lead.id} 
                documents={documents} 
                documentTypes={documentTypes} 
                createdAt={lead.created_at} 
                createdByPartner={lead.partners?.name || 'Partner'}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>

      {/* Status Update Sheet */}
      <StatusUpdateSheet
        open={statusUpdateModalOpen}
        onOpenChange={setStatusUpdateModalOpen}
        leadId={lead.id}
        currentStatus={lead.status as LeadStatus}
        currentDocumentsStatus={lead.documents_status as DocumentStatus}
        stageStartedAt={lead.current_stage_started_at}
        onStatusUpdated={() => {
          setStatusUpdateModalOpen(false);
          onLeadUpdated?.();
        }}
      />

      {/* Lender Assignment Modal */}
      {isAdmin() && lead.lender_id && (
        <LenderAssignmentModal
          open={lenderAssignmentModalOpen}
          onOpenChange={setLenderAssignmentModalOpen}
          leadId={lead.id}
          currentLenderId={lead.lender_id}
          studyDestination={lead.study_destination}
          loanAmount={lead.loan_amount}
          onSuccess={() => {
            onLeadUpdated?.();
          }}
        />
      )}

      {/* Partner Assignment Modal */}
      {isAdmin() && (
        <PartnerAssignmentModal
          open={partnerAssignmentModalOpen}
          onOpenChange={setPartnerAssignmentModalOpen}
          leadId={lead.id}
          currentPartnerId={lead.partner_id}
          onSuccess={() => {
            onLeadUpdated?.();
          }}
        />
      )}
    </Sheet>
  );
};