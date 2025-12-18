import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import {
  CheckCircle,
  Upload,
  Shield,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { RefactoredLead } from "@/types/refactored-lead";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { useLeadDocuments } from "@/hooks/useLeadDocuments";
import { StatusBadge } from "@/components/lead-status/StatusBadge";
import { EnhancedDocumentUpload } from "@/components/ui/enhanced-document-upload";
import type { LeadStatus } from "@/utils/statusUtils";
import { cn } from "@/lib/utils";

interface PartnerLeadDetailSheetProps {
  lead: RefactoredLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated?: () => void;
  initialTab?: string;
}

export const PartnerLeadDetailSheet = ({ 
  lead, 
  open, 
  onOpenChange, 
  onLeadUpdated
}: PartnerLeadDetailSheetProps) => {
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  
  const { documentTypes, loading: documentTypesLoading } = useDocumentTypes();
  const { documents, loading: documentsLoading, refetch: refetchDocuments } = useLeadDocuments(lead?.id);

  if (!lead) return null;

  // Create document checklist with AI validation details
  const documentChecklist = documentTypes.map(docType => {
    const uploadedDoc = documents.find(doc => doc.document_type_id === docType.id);
    return {
      id: docType.id,
      name: docType.name,
      category: docType.category,
      required: docType.required,
      status: uploadedDoc ? 'uploaded' : 'pending',
      uploaded_at: uploadedDoc?.uploaded_at ? format(new Date(uploadedDoc.uploaded_at), 'dd MMM yyyy') : undefined,
      ai_status: uploadedDoc?.ai_validation_status,
      ai_detected_type: uploadedDoc?.ai_detected_type,
      ai_confidence: uploadedDoc?.ai_confidence_score,
      ai_quality: uploadedDoc?.ai_quality_assessment,
      ai_notes: uploadedDoc?.ai_validation_notes,
      docType: docType
    };
  });

  const createdDate = lead.created_at ? format(new Date(lead.created_at), 'dd MMM yyyy') : '';

  const handleDocumentUploadSuccess = () => {
    refetchDocuments();
    onLeadUpdated?.();
    setSelectedDocType(null);
  };

  const handleDocumentUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  const getAIStatusIcon = (aiStatus?: string) => {
    switch (aiStatus) {
      case 'validated':
        return <ShieldCheck className="h-3.5 w-3.5 text-green-600" />;
      case 'manual_review':
        return <Shield className="h-3.5 w-3.5 text-amber-600" />;
      case 'rejected':
        return <ShieldAlert className="h-3.5 w-3.5 text-red-600" />;
      default:
        return null;
    }
  };

  const getAIStatusLabel = (aiStatus?: string) => {
    switch (aiStatus) {
      case 'validated':
        return 'Verified';
      case 'manual_review':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return null;
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-muted-foreground';
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  // Group documents by category for upload selection
  const docsByCategory = documentTypes.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, typeof documentTypes>);

  const selectedDocTypeObj = documentTypes.find(d => d.id === selectedDocType);

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
          {/* Upload Section */}
          <Card className="border">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              {!selectedDocType ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Select document type to upload:</p>
                  <div className="max-h-48 overflow-y-auto space-y-3">
                    {Object.entries(docsByCategory).map(([category, docs]) => (
                      <div key={category}>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{category}</p>
                        <div className="grid grid-cols-2 gap-1">
                          {docs.map((doc) => {
                            const isUploaded = documents.some(d => d.document_type_id === doc.id);
                            return (
                              <Button
                                key={doc.id}
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-auto py-1.5 px-2 text-xs justify-start",
                                  isUploaded && "bg-green-50 border-green-200"
                                )}
                                onClick={() => setSelectedDocType(doc.id)}
                              >
                                {isUploaded && <CheckCircle className="h-3 w-3 mr-1 text-green-600" />}
                                <span className="truncate">{doc.name}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedDocTypeObj ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{selectedDocTypeObj.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedDocType(null)}
                      className="h-6 px-2 text-xs"
                    >
                      Change
                    </Button>
                  </div>
                  <EnhancedDocumentUpload
                    leadId={lead.id}
                    documentType={{
                      id: selectedDocTypeObj.id,
                      name: selectedDocTypeObj.name,
                      category: selectedDocTypeObj.category,
                      required: selectedDocTypeObj.required || false,
                      max_file_size_pdf: selectedDocTypeObj.max_file_size_pdf || 10 * 1024 * 1024,
                      max_file_size_image: selectedDocTypeObj.max_file_size_image || 5 * 1024 * 1024,
                      accepted_formats: selectedDocTypeObj.accepted_formats || ['pdf', 'jpg', 'jpeg', 'png'],
                      description: selectedDocTypeObj.description || ''
                    }}
                    onUploadSuccess={handleDocumentUploadSuccess}
                    onUploadError={handleDocumentUploadError}
                    enableAIValidation={true}
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    AI verification enabled - documents are auto-checked
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Document Checklist */}
          <Card className="border">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm font-medium">Document Status</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              {documentTypesLoading || documentsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <TooltipProvider>
                  <div className="space-y-2">
                    {documentChecklist.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between text-sm">
                        <span className={doc.status === 'uploaded' ? 'text-foreground' : 'text-muted-foreground'}>
                          {doc.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {/* AI Status with detailed tooltip */}
                          {doc.ai_status && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  {getAIStatusIcon(doc.ai_status)}
                                  {doc.ai_confidence && (
                                    <span className={cn("text-xs", getConfidenceColor(doc.ai_confidence))}>
                                      {Math.round(doc.ai_confidence)}%
                                    </span>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <div className="space-y-1.5 text-xs">
                                  <p className="font-medium">{getAIStatusLabel(doc.ai_status)}</p>
                                  {doc.ai_detected_type && (
                                    <p>Detected: <span className="font-medium">{doc.ai_detected_type}</span></p>
                                  )}
                                  {doc.ai_confidence && (
                                    <p>Confidence: <span className={cn("font-medium", getConfidenceColor(doc.ai_confidence))}>{Math.round(doc.ai_confidence)}%</span></p>
                                  )}
                                  {doc.ai_quality && (
                                    <p>Quality: <span className="capitalize font-medium">{doc.ai_quality}</span></p>
                                  )}
                                  {doc.ai_notes && (
                                    <p className="text-muted-foreground border-t pt-1 mt-1">{doc.ai_notes}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {doc.status === 'uploaded' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => setSelectedDocType(doc.id)}
                            >
                              <Upload className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};
