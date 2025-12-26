import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, FileText, CheckCircle } from 'lucide-react';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { useLeadDocuments } from '@/hooks/useLeadDocuments';
import { useLeadInfo } from '@/hooks/useLeadInfo';
import { PartnerDocumentGrid } from '@/components/partner/PartnerDocumentGrid';
import { PartnerSmartUpload } from '@/components/partner/PartnerSmartUpload';
import { formatIndianNumber } from '@/utils/currencyFormatter';
export default function PartnerDocumentPage() {
  const {
    partnerCode,
    leadId
  } = useParams();
  const navigate = useNavigate();
  const [preferredDocTypeId, setPreferredDocTypeId] = useState<string | null>(null);
  const [highlightedDocType, setHighlightedDocType] = useState<string | null>(null);
  const smartUploadRef = useRef<HTMLDivElement>(null);
  const {
    lead,
    loading
  } = useLeadInfo(leadId);
  const {
    documentTypes,
    loading: docTypesLoading
  } = useDocumentTypes();
  const {
    documents,
    refetch: refetchDocuments
  } = useLeadDocuments(leadId);
  const handleBack = () => {
    navigate(`/partner/${partnerCode}?openLead=${leadId}`);
  };

  // When checklist item clicked, set preferred doc type and scroll to Smart Upload
  const handleDocSelect = (docTypeId: string) => {
    setPreferredDocTypeId(docTypeId);
    setHighlightedDocType(null);
    smartUploadRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };
  const handleUploadSuccess = useCallback(() => {
    refetchDocuments();
    setPreferredDocTypeId(null);
    setHighlightedDocType(null);
  }, [refetchDocuments]);

  // AI suggests a doc type - highlight it in the grocery list
  const handleSuggestDocType = useCallback((docTypeId: string) => {
    setHighlightedDocType(docTypeId);
    document.getElementById('grocery-list')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, []);

  // Clear preferred doc type (user wants to let AI decide)
  const handleClearPreferredDocType = useCallback(() => {
    setPreferredDocTypeId(null);
  }, []);

  // Calculate progress
  const requiredDocs = documentTypes.filter(d => d.required);
  const uploadedRequiredCount = requiredDocs.filter(d => documents.some(doc => doc.document_type_id === d.id)).length;
  const progressPercent = requiredDocs.length > 0 ? Math.round(uploadedRequiredCount / requiredDocs.length * 100) : 0;
  if (loading || docTypesLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>;
  }
  if (!lead) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Lead not found</p>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {lead.student.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {lead.case_id} • ₹{formatIndianNumber(lead.loan_amount)} • {lead.study_destination}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {documents.length} / {documentTypes.length} uploaded
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Card */}
        <Card>
          
        </Card>

        {/* AI Smart Upload Section - Single upload channel */}
        <div ref={smartUploadRef}>
          <PartnerSmartUpload leadId={lead.id} documentTypes={documentTypes} onUploadSuccess={handleUploadSuccess} onSuggestDocType={handleSuggestDocType} studentName={lead.student.name} coApplicantName={lead.co_applicant?.name} preferredDocumentTypeId={preferredDocTypeId} onClearPreferredDocType={handleClearPreferredDocType} uploadedDocuments={documents} />
        </div>

        {/* Document Grocery List */}
        <Card id="grocery-list">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Document Checklist</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tap any document to upload it. <span className="text-destructive">*</span> = required
            </p>
          </CardHeader>
          <CardContent>
            <PartnerDocumentGrid documentTypes={documentTypes} uploadedDocuments={documents} selectedDocType={preferredDocTypeId} highlightedDocType={highlightedDocType} onSelect={handleDocSelect} />
          </CardContent>
        </Card>
      </div>
    </div>;
}