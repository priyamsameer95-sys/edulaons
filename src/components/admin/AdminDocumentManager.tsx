import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  User,
  Shield
} from 'lucide-react';
import { useLeadDocuments } from '@/hooks/useLeadDocuments';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { DocumentVerificationModal } from './DocumentVerificationModal';
import { AdminDocumentUpload } from './AdminDocumentUpload';

interface AdminDocumentManagerProps {
  leadId: string;
}

interface LeadDocument {
  id: string;
  original_filename: string;
  file_path: string;
  document_type_id: string;
  uploaded_by?: string;
  verification_status?: string;
  admin_notes?: string;
  verified_by?: string;
  document_types?: {
    name: string;
    category: string;
  };
}

export function AdminDocumentManager({ leadId }: AdminDocumentManagerProps) {
  const { documents, loading, refetch, deleteDocument, getDownloadUrl } = useLeadDocuments(leadId);
  const { documentTypes } = useDocumentTypes();
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LeadDocument | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const handleDownload = async (document: LeadDocument) => {
    try {
      const url = await getDownloadUrl(document.file_path);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.original_filename;
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleVerificationAction = (document: LeadDocument) => {
    setSelectedDocument(document);
    setVerificationModalOpen(true);
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success text-success-foreground">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive text-destructive-foreground">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-warning text-warning-foreground">Pending</Badge>;
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified': return CheckCircle;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  const getUploadedByIcon = (uploadedBy: string) => {
    return uploadedBy === 'admin' ? Shield : User;
  };

  if (loading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Upload New Document Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Document Management</h3>
        <Button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload for Student
        </Button>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No documents uploaded yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          documents.map((document: LeadDocument) => {
            const VerificationIcon = getVerificationIcon(document.verification_status || 'pending');
            const UploadedByIcon = getUploadedByIcon(document.uploaded_by || 'student');
            
            return (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <VerificationIcon className={`h-5 w-5 ${
                        document.verification_status === 'verified' ? 'text-success' :
                        document.verification_status === 'rejected' ? 'text-destructive' :
                        'text-warning'
                      }`} />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{document.original_filename}</span>
                          <UploadedByIcon className="h-4 w-4 text-muted-foreground" />
                          {document.uploaded_by === 'admin' && (
                            <Badge variant="outline" className="text-xs">Admin Upload</Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {document.document_types?.name} • {document.document_types?.category}
                        </div>
                        
                        {document.admin_notes && (
                          <div className="text-xs text-muted-foreground mt-1 italic">
                            Admin notes: {document.admin_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getVerificationBadge(document.verification_status || 'pending')}
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        {document.verification_status !== 'verified' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerificationAction(document)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Verification Modal */}
      <DocumentVerificationModal
        open={verificationModalOpen}
        onOpenChange={setVerificationModalOpen}
        document={selectedDocument}
        onVerificationComplete={refetch}
      />

      {/* Upload Modal */}
      <AdminDocumentUpload
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        leadId={leadId}
        onUploadComplete={refetch}
      />
    </div>
  );
}