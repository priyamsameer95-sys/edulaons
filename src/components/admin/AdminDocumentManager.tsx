import { useState, useRef, useCallback } from 'react';
import { useLeadDocuments, LeadDocument } from '@/hooks/useLeadDocuments';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { DocumentVerificationModal } from './DocumentVerificationModal';
import { AdminSmartUpload, AdminSmartUploadRef } from './AdminSmartUpload';
import { AdminDocumentGrid } from './AdminDocumentGrid';
import { useAccessLogger } from '@/hooks/useAccessLogger';

interface AdminDocumentManagerProps {
  leadId: string;
  studentName?: string;
  coApplicantName?: string;
}

export function AdminDocumentManager({ leadId, studentName, coApplicantName }: AdminDocumentManagerProps) {
  const { documents, loading, refetch, getDownloadUrl } = useLeadDocuments(leadId);
  const { documentTypes, loading: typesLoading } = useDocumentTypes();
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LeadDocument | null>(null);
  const { logDocumentDownload } = useAccessLogger();

  // Two-way sync state
  const [preferredDocTypeId, setPreferredDocTypeId] = useState<string | null>(null);
  const [highlightedDocType, setHighlightedDocType] = useState<string | null>(null);
  const uploadRef = useRef<AdminSmartUploadRef>(null);

  // When user clicks a checklist item → scroll to upload zone & pre-select
  const handleDocTypeSelect = useCallback((docTypeId: string) => {
    setPreferredDocTypeId(docTypeId);
    setHighlightedDocType(null);
    // Scroll to upload zone
    uploadRef.current?.scrollToUpload();
  }, []);

  // When AI suggests a bucket → highlight in checklist
  const handleSuggestDocType = useCallback((docTypeId: string) => {
    setHighlightedDocType(docTypeId);
    // Clear highlight after 3 seconds
    setTimeout(() => setHighlightedDocType(null), 3000);
  }, []);

  const handleClearPreferredDocType = useCallback(() => {
    setPreferredDocTypeId(null);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    refetch();
    // Clear preferred doc type after successful upload
    setPreferredDocTypeId(null);
    setHighlightedDocType(null);
  }, [refetch]);

  const handleDownload = async (document: LeadDocument) => {
    try {
      logDocumentDownload(leadId, document.id);
      
      const url = await getDownloadUrl(document.file_path);
      if (url) {
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document.original_filename;
        link.click();
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleVerificationAction = (document: LeadDocument) => {
    setSelectedDocument(document);
    setVerificationModalOpen(true);
  };

  if (loading || typesLoading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }

  // Convert documents for upload component
  const uploadedDocsForUpload = documents.map(d => ({
    id: d.id,
    document_type_id: d.document_type_id,
    verification_status: d.verification_status
  }));

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* AI-Powered Smart Upload Zone */}
      <AdminSmartUpload
        ref={uploadRef}
        leadId={leadId}
        documentTypes={documentTypes}
        onUploadSuccess={handleUploadSuccess}
        onSuggestDocType={handleSuggestDocType}
        studentName={studentName}
        coApplicantName={coApplicantName}
        preferredDocumentTypeId={preferredDocTypeId}
        onClearPreferredDocType={handleClearPreferredDocType}
        uploadedDocuments={uploadedDocsForUpload}
      />

      {/* Document Checklist / Grocery List */}
      <AdminDocumentGrid
        documentTypes={documentTypes}
        uploadedDocuments={documents}
        selectedDocType={preferredDocTypeId}
        highlightedDocType={highlightedDocType}
        onSelect={handleDocTypeSelect}
        onRefresh={refetch}
      />

      {/* Verification Modal */}
      <DocumentVerificationModal
        open={verificationModalOpen}
        onOpenChange={setVerificationModalOpen}
        document={selectedDocument}
        onVerificationComplete={refetch}
      />
    </div>
  );
}
