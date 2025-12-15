import { useState } from 'react';
import { useLeadDocuments, LeadDocument } from '@/hooks/useLeadDocuments';
import { DocumentVerificationModal } from './DocumentVerificationModal';
import { InlineDocumentUpload } from './InlineDocumentUpload';

interface AdminDocumentManagerProps {
  leadId: string;
}

export function AdminDocumentManager({ leadId }: AdminDocumentManagerProps) {
  const { documents, loading, refetch, getDownloadUrl } = useLeadDocuments(leadId);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LeadDocument | null>(null);

  const handleDownload = async (document: LeadDocument) => {
    try {
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

  if (loading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Unified Document Checklist - handles both types and uploaded docs */}
      <InlineDocumentUpload 
        leadId={leadId} 
        onUploadComplete={refetch}
        uploadedDocuments={documents}
        onDownload={handleDownload}
        onVerify={handleVerificationAction}
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