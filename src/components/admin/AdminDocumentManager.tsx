import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  User,
  Shield,
  Bot,
  AlertTriangle
} from 'lucide-react';
import { useLeadDocuments } from '@/hooks/useLeadDocuments';
import { DocumentVerificationModal } from './DocumentVerificationModal';
import { InlineDocumentUpload } from './InlineDocumentUpload';

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
  ai_validation_status?: string;
  ai_detected_type?: string;
  ai_confidence_score?: number;
  ai_quality_assessment?: string;
  ai_validation_notes?: string;
  document_types?: {
    name: string;
    category: string;
  };
}

export function AdminDocumentManager({ leadId }: AdminDocumentManagerProps) {
  const { documents, loading, refetch, getDownloadUrl } = useLeadDocuments(leadId);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LeadDocument | null>(null);

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
      case 'uploaded':
        return <Badge className="bg-blue-500 text-white">Uploaded</Badge>;
      case 'resubmission_required':
        return <Badge className="bg-yellow-500 text-white">Resubmission Required</Badge>;
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

  const getAIStatusBadge = (document: LeadDocument) => {
    if (!document.ai_validation_status || document.ai_validation_status === 'pending') {
      return null;
    }
    
    if (document.ai_validation_status === 'validated') {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-300 text-[10px] px-1.5 py-0 h-5">
          <Bot className="h-3 w-3 mr-1" />
          AI OK
        </Badge>
      );
    }
    
    if (document.ai_validation_status === 'rejected') {
      return (
        <Badge className="bg-red-500/10 text-red-600 border-red-300 text-[10px] px-1.5 py-0 h-5">
          <Bot className="h-3 w-3 mr-1" />
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-300 text-[10px] px-1.5 py-0 h-5">
        <Bot className="h-3 w-3 mr-1" />
        <AlertTriangle className="h-3 w-3 mr-1" />
        Review
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Inline Upload Section */}
      <InlineDocumentUpload leadId={leadId} onUploadComplete={refetch} />

      {/* Documents List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Uploaded Documents ({documents.length})</span>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No documents uploaded yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          documents.map((document: LeadDocument) => {
            const VerificationIcon = getVerificationIcon(document.verification_status || 'pending');
            const UploadedByIcon = getUploadedByIcon(document.uploaded_by || 'student');
            const isAIFlagged = document.ai_validation_status === 'manual_review' || document.ai_validation_status === 'rejected';
            
            return (
              <Card 
                key={document.id} 
                className={isAIFlagged ? 'border-amber-300 dark:border-amber-700' : ''}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        document.verification_status === 'verified' ? 'bg-success/10' :
                        document.verification_status === 'rejected' ? 'bg-destructive/10' :
                        isAIFlagged ? 'bg-amber-500/10' :
                        'bg-warning/10'
                      }`}>
                        {isAIFlagged ? (
                          <Bot className="h-4 w-4 text-amber-500" />
                        ) : (
                          <VerificationIcon className={`h-4 w-4 ${
                            document.verification_status === 'verified' ? 'text-success' :
                            document.verification_status === 'rejected' ? 'text-destructive' :
                            'text-warning'
                          }`} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{document.original_filename}</span>
                          <UploadedByIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                          {getAIStatusBadge(document)}
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {document.document_types?.name} • {document.document_types?.category}
                        </div>

                        {isAIFlagged && document.ai_validation_notes && (
                          <div className="text-xs text-amber-600 mt-1">
                            {document.ai_validation_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getVerificationBadge(document.verification_status || 'pending')}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant={isAIFlagged ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleVerificationAction(document)}
                        className={isAIFlagged ? "bg-amber-500 hover:bg-amber-600" : ""}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
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
    </div>
  );
}