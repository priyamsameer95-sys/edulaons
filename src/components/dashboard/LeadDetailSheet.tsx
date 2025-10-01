import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AdminDocumentManager } from "@/components/admin/AdminDocumentManager";
import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  FileText,
  Calendar,
  User,
  MapPin,
  CreditCard,
  GraduationCap,
  Building,
  Phone,
  Mail,
  Upload,
  Eye
} from "lucide-react";
import { RefactoredLead } from "@/types/refactored-lead";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { useLeadDocuments } from "@/hooks/useLeadDocuments";
import { StandardDocumentUpload } from "./StandardDocumentUpload";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/lead-status/StatusBadge";
import { EnhancedStatusUpdateModal } from "@/components/lead-status/EnhancedStatusUpdateModal";
import { StatusHistory } from "@/components/lead-status/StatusHistory";
import { StatusProgressIndicator } from "@/components/lead-status/StatusProgressIndicator";
import type { LeadStatus, DocumentStatus } from "@/utils/statusUtils";

interface LeadDetailSheetProps {
  lead: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated?: () => void;
}

export const LeadDetailSheet = ({ lead, open, onOpenChange, onLeadUpdated }: LeadDetailSheetProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const { toast } = useToast();
  const { appUser, isAdmin } = useAuth();
  
  // Real data from Supabase
  const { documentTypes, loading: documentTypesLoading } = useDocumentTypes();
  const { documents, loading: documentsLoading, getDownloadUrl, refetch: refetchDocuments } = useLeadDocuments(lead?.id);

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

  // Create real checklist from document types and uploaded documents
  const checklist = documentTypes.map(docType => {
    const uploadedDoc = documents.find(doc => doc.document_type_id === docType.id);
    return {
      id: docType.id,
      name: docType.name,
      required: docType.required,
      status: uploadedDoc ? 'uploaded' : 'pending',
      uploaded_at: uploadedDoc?.uploaded_at ? format(new Date(uploadedDoc.uploaded_at), 'yyyy-MM-dd') : undefined
    };
  });

  const requiredDocs = checklist.filter(item => item.required);
  const completedRequired = requiredDocs.filter(item => item.status === 'uploaded').length;
  const progressPercentage = requiredDocs.length > 0 ? (completedRequired / requiredDocs.length) * 100 : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-2 pb-4 border-b">
          <SheetTitle className="text-xl font-semibold">
            Lead Details - {lead.case_id}
          </SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Student Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="font-semibold">{lead.student?.name || 'N/A'}</p>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {lead.student?.phone || 'N/A'}
                      </div>
                      {lead.student?.email && (
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Mail className="h-3 w-3 mr-1" />
                          {lead.student?.email}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Loan Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="font-semibold">₹{lead.loan_amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground capitalize">{lead.loan_type} loan</p>
                      <p className="text-sm text-muted-foreground">Lender: {lead.lender?.name || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Study Destination
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="font-semibold">{lead.study_destination}</p>
                      {lead.intake_month && (
                        <p className="text-sm text-muted-foreground">
                          Intake: {lead.intake_month}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Co-Applicant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="font-semibold">{lead.co_applicant?.name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground capitalize">{lead.co_applicant?.relationship || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">
                        {lead.co_applicant?.salary ? `₹${Number(lead.co_applicant.salary).toLocaleString()}/year` : 'N/A'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Application Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Application Status
                    <div className="flex items-center gap-2">
                      <StatusBadge status={lead.status as LeadStatus} type="lead" />
                      {isAdmin() && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setStatusUpdateModalOpen(true)}
                        >
                          Update Status
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Documents Status</span>
                      <StatusBadge status={lead.documents_status as DocumentStatus} type="document" />
                    </div>
                    <div className="space-y-3">
                      <StatusProgressIndicator currentStatus={lead.status as LeadStatus} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Document Progress</span>
                        <span>{Math.round(progressPercentage)}%</span>
                      </div>
                      <Progress value={progressPercentage} className="w-full h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                    checklist.map((item) => {
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
                                  <div className="w-48">
                                    <StandardDocumentUpload
                                      leadId={lead.id}
                                      documentTypeId={item.id}
                                      documentTypeName={item.name}
                                      maxFileSize={docType?.max_file_size_pdf || 10485760}
                                      acceptedFormats={docType?.accepted_formats || ['pdf', 'docx', 'jpg', 'png']}
                                      onUploadSuccess={() => {
                                        refetchDocuments();
                                        toast({
                                          title: "Document Replaced",
                                          description: `${item.name} has been updated`,
                                        });
                                      }}
                                      existingDocument={true}
                                      variant="ghost"
                                      size="sm"
                                      allowMultiple={false}
                                    />
                                  </div>
                                </>
                              ) : (
                                <div className="w-48">
                                  <StandardDocumentUpload
                                    leadId={lead.id}
                                    documentTypeId={item.id}
                                    documentTypeName={item.name}
                                    maxFileSize={docType?.max_file_size_pdf || 10485760}
                                    acceptedFormats={docType?.accepted_formats || ['pdf', 'docx', 'jpg', 'png']}
                                    onUploadSuccess={() => {
                                      refetchDocuments();
                                      toast({
                                        title: "Document Uploaded",
                                        description: `${item.name} uploaded successfully`,
                                      });
                                    }}
                                    existingDocument={false}
                                    variant="default"
                                    size="sm"
                                    allowMultiple={false}
                                  />
                                </div>
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
                          checklist.map((item) => {
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
                                        <StandardDocumentUpload
                                          leadId={lead.id}
                                          documentTypeId={item.id}
                                          documentTypeName={item.name}
                                          maxFileSize={docType?.max_file_size_pdf || 10485760}
                                          acceptedFormats={docType?.accepted_formats || ['pdf', 'docx', 'jpg', 'png']}
                                          onUploadSuccess={() => {
                                            refetchDocuments();
                                            toast({
                                              title: "Document Replaced",
                                              description: `${item.name} has been updated`,
                                            });
                                          }}
                                          existingDocument={true}
                                          variant="ghost"
                                          size="sm"
                                          allowMultiple={false}
                                        />
                                      </>
                                    ) : (
                                      <StandardDocumentUpload
                                        leadId={lead.id}
                                        documentTypeId={item.id}
                                        documentTypeName={item.name}
                                        maxFileSize={docType?.max_file_size_pdf || 10485760}
                                        acceptedFormats={docType?.accepted_formats || ['pdf', 'docx', 'jpg', 'png']}
                                        onUploadSuccess={() => {
                                          refetchDocuments();
                                          toast({
                                            title: "Document Uploaded",
                                            description: `${item.name} uploaded successfully`,
                                          });
                                        }}
                                        existingDocument={false}
                                        variant="default"
                                        size="sm"
                                        allowMultiple={false}
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

            <TabsContent value="status" className="space-y-4">
              <StatusHistory leadId={lead.id} />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Lead creation event */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="w-px h-12 bg-border ml-0.5 mt-1"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">Lead created</p>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(lead.created_at), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">partner</Badge>
                          <span className="text-xs text-muted-foreground">case created</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Document upload events */}
                    {documents.map((doc, index) => {
                      const docType = documentTypes.find(type => type.id === doc.document_type_id);
                      return (
                        <div key={doc.id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                            {index < documents.length - 1 && (
                              <div className="w-px h-12 bg-border ml-0.5 mt-1"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{docType?.name || 'Document'} uploaded</p>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(doc.uploaded_at), 'MMM dd, HH:mm')}
                            </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">student</Badge>
                              <span className="text-xs text-muted-foreground">document uploaded</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* If no documents, show current status */}
                    {documents.length === 0 && (
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">Awaiting document upload</p>
                            <span className="text-sm text-muted-foreground">Current</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">system</Badge>
                            <span className="text-xs text-muted-foreground">documents pending</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>

      {/* Status Update Modal */}
      <EnhancedStatusUpdateModal
        open={statusUpdateModalOpen}
        onOpenChange={setStatusUpdateModalOpen}
        leadId={lead.id}
        currentStatus={lead.status as LeadStatus}
        currentDocumentsStatus={lead.documents_status as DocumentStatus}
        onStatusUpdated={() => {
          setStatusUpdateModalOpen(false);
          // Call the parent callback to refresh dashboard data
          onLeadUpdated?.();
        }}
      />
    </Sheet>
  );
};