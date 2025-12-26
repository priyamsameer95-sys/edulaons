import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
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
import { EnhancedDocumentUpload } from '@/components/ui/enhanced-document-upload';
import { formatIndianNumber } from '@/utils/currencyFormatter';

export default function PartnerDocumentPage() {
  const { partnerCode, leadId } = useParams();
  const navigate = useNavigate();
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [highlightedDocType, setHighlightedDocType] = useState<string | null>(null);

  const { lead, loading } = useLeadInfo(leadId);
  const { documentTypes, loading: docTypesLoading } = useDocumentTypes();
  const { documents, refetch: refetchDocuments } = useLeadDocuments(leadId);

  const handleBack = () => {
    navigate(`/partner/${partnerCode}?openLead=${leadId}`);
  };

  const handleDocSelect = (docTypeId: string) => {
    setSelectedDocType(docTypeId);
    setHighlightedDocType(null);
    document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUploadSuccess = useCallback(() => {
    refetchDocuments();
    setSelectedDocType(null);
    setHighlightedDocType(null);
  }, [refetchDocuments]);

  // AI suggests a doc type - highlight it in the grocery list
  const handleSuggestDocType = useCallback((docTypeId: string) => {
    setHighlightedDocType(docTypeId);
    // Scroll to grocery list to show the highlighted item
    document.getElementById('grocery-list')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const selectedDocTypeObj = documentTypes.find(d => d.id === selectedDocType);

  // Calculate progress
  const requiredDocs = documentTypes.filter(d => d.required);
  const uploadedRequiredCount = requiredDocs.filter(d => 
    documents.some(doc => doc.document_type_id === d.id)
  ).length;
  const progressPercent = requiredDocs.length > 0 
    ? Math.round((uploadedRequiredCount / requiredDocs.length) * 100) 
    : 0;

  if (loading || docTypesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Lead not found</p>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Required Documents</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {uploadedRequiredCount} of {requiredDocs.length} uploaded
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            {progressPercent === 100 && (
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                All required documents uploaded
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI Smart Upload Section */}
        <PartnerSmartUpload
          leadId={lead.id}
          documentTypes={documentTypes}
          onUploadSuccess={handleUploadSuccess}
          onSuggestDocType={handleSuggestDocType}
          studentName={lead.student.name}
          coApplicantName={lead.co_applicant?.name}
        />

        {/* Document Grocery List */}
        <Card id="grocery-list">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Document Checklist</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click to upload manually. <span className="text-destructive">*</span> = required
            </p>
          </CardHeader>
          <CardContent>
            <PartnerDocumentGrid
              documentTypes={documentTypes}
              uploadedDocuments={documents}
              selectedDocType={selectedDocType}
              highlightedDocType={highlightedDocType}
              onSelect={handleDocSelect}
            />
          </CardContent>
        </Card>

        {/* Manual Upload Section (when doc type selected from grocery list) */}
        <div id="upload-section">
          {selectedDocTypeObj && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  Upload: {selectedDocTypeObj.name}
                  {selectedDocTypeObj.required && (
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={(error) => console.error('Upload error:', error)}
                  enableAIValidation={true}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => setSelectedDocType(null)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
